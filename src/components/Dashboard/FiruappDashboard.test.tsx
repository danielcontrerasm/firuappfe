import React, { useEffect } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import axios from "axios";
import FiruappDashboard from "./FiruappDashboard.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";
import { createDemoPetLocations } from "./ui/dashboardDemoData.ts";

jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("sockjs-client", () => jest.fn());
jest.mock("@stomp/stompjs", () => ({
  Client: class {
    activate() {}
    deactivate() {}
  },
}));
jest.mock("./ui/FiruappSidebar.tsx", () => () => null);
jest.mock("./ui/FiruappPetList.tsx", () => () => null);
jest.mock("./ui/FiruappMapView.tsx", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../services/usePetImage.ts", () => ({ usePetImage: () => undefined }));
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    useNavigate: () => jest.fn(),
    Link: React.forwardRef(({ to, children, ...props }: any, ref: any) => <a href={to} ref={ref} {...props}>{children}</a>),
  };
}, { virtual: true });

const locations = [
  {
    id: 80133,
    petId: 1,
    latitude: 10.973074,
    longitude: -74.791997,
    petName: "Peluche",
    city: "Perímetro Urbano Barranquilla",
    address: "Carrera 30",
    timestamp: "2026-10-06T15:03:00.400963",
  },
  {
    id: 80134,
    petId: 4,
    latitude: 10.624448333333333,
    longitude: -74.923545,
    petName: "Rocky",
    city: "Sabanalarga",
    address: "Carrera 9",
    timestamp: "2026-11-01T16:26:34",
  },
];

// Isolate the dashboard's filtering from Leaflet and network requests.
const MapPreview = ({ pets, onLocationsChange, onSelectPet, petDataMode, showGeofences, mapStyle }: any) => {
  useEffect(() => {
    onLocationsChange(petDataMode === "mixed" ? [...locations, ...createDemoPetLocations()] : locations);
  }, [onLocationsChange, petDataMode]);

  return (
    <div data-testid="map-pets" data-geofences={showGeofences} data-map-style={mapStyle}>
      {pets.map((pet: any) => (
        <button key={pet.id} onClick={() => onSelectPet(pet.id)}>
          Select {pet.name}
        </button>
      ))}
    </div>
  );
};

beforeEach(() => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date(2026, 10, 1, 16, 28));
  (axios.get as jest.Mock).mockResolvedValue({
    data: [
      { id: 1, name: "Peluche", status: "active" },
      { id: 4, name: "Rocky", status: "active" },
    ],
  });
  (FiruappMapView as jest.Mock).mockImplementation(MapPreview);
});

afterEach(() => {
  jest.useRealTimers();
});

const expectBothPetsOnMap = () => {
  const map = within(screen.getByTestId("map-pets"));
  expect(map.getByRole("button", { name: "Select Peluche" })).toBeInTheDocument();
  expect(map.getByRole("button", { name: "Select Rocky" })).toBeInTheDocument();
};

test("keeps pets in both cities on the map after GPS data arrives and a pet is selected", async () => {
  render(<FiruappDashboard />);
  await screen.findByText("Perímetro Urbano Barranquilla · Carrera 30");

  expect(screen.getByRole("combobox")).toHaveTextContent("All cities");
  expectBothPetsOnMap();

  fireEvent.click(screen.getByRole("button", { name: "Select Rocky" }));
  await screen.findByText("Sabanalarga · Carrera 9");

  expect(screen.getByRole("combobox")).toHaveTextContent("All cities");
  expectBothPetsOnMap();
});

test("shows an old report as offline and counts only recent GPS reports", async () => {
  render(<FiruappDashboard />);
  await screen.findByText("Perímetro Urbano Barranquilla · Carrera 30");

  expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  expect(screen.getByText("Offline")).toBeInTheDocument();
  expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "GPS Online" })).getByText("1")).toBeInTheDocument();
  expectBothPetsOnMap();

  fireEvent.click(screen.getByRole("button", { name: "Select Rocky" }));
  expect(screen.getByText("ONLINE")).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(4 * 60 * 1000);
  });

  expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "GPS Online" })).getByText("0")).toBeInTheDocument();
  expectBothPetsOnMap();
});

test("keeps lost status separate from GPS connectivity", async () => {
  (axios.get as jest.Mock).mockResolvedValue({
    data: [
      { id: 1, name: "Peluche", status: "active" },
      { id: 4, name: "Rocky", status: "lost" },
    ],
  });
  render(<FiruappDashboard />);
  await screen.findByText("Sabanalarga · Carrera 9");

  expect(screen.getByText("LOST")).toBeInTheDocument();
  expect(screen.getByText("ONLINE")).toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "GPS Online" })).getByText("1")).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(4 * 60 * 1000);
  });

  expect(screen.getByText("LOST")).toBeInTheDocument();
  expect(screen.getByText("OFFLINE")).toBeInTheDocument();
});

test("filters by an explicitly chosen GPS city and restores both pets with All cities", async () => {
  render(<FiruappDashboard />);
  await screen.findByText("Perímetro Urbano Barranquilla · Carrera 30");

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Sabanalarga" }));

  const map = within(screen.getByTestId("map-pets"));
  expect(map.queryByRole("button", { name: "Select Peluche" })).not.toBeInTheDocument();
  expect(map.getByRole("button", { name: "Select Rocky" })).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "All cities" }));

  expect(screen.getByRole("combobox")).toHaveTextContent("All cities");
  expectBothPetsOnMap();
});

test("adds labeled demo pets alongside real pets and removes their details when demo data is turned off", async () => {
  render(<FiruappDashboard />);
  await screen.findByText("Perímetro Urbano Barranquilla · Carrera 30");
  const controls = within(screen.getByRole("group", { name: "Dashboard controls" }));
  const demoButton = controls.getByRole("button", { name: "Demo Data" });
  expect(demoButton).toHaveAttribute("aria-pressed", "false");

  fireEvent.click(demoButton);
  expect(demoButton).toHaveAttribute("aria-pressed", "true");
  expectBothPetsOnMap();
  expect(screen.getByRole("button", { name: "Select Bella (Demo)" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Select Rocky (Demo)" }));
  expect(screen.getByText("Medellín · Demo location")).toBeInTheDocument();
  expect(screen.getByText("18%")).toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "Pets" })).getByText("4")).toBeInTheDocument();

  fireEvent.click(demoButton);
  expectBothPetsOnMap();
  expect(screen.queryByRole("button", { name: "Select Rocky (Demo)" })).not.toBeInTheDocument();
  expect(screen.queryByText("Medellín · Demo location")).not.toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "Pets" })).getByText("2")).toBeInTheDocument();
});

test("top controls toggle geofences and select map styles", async () => {
  render(<FiruappDashboard />);
  await screen.findByText("Perímetro Urbano Barranquilla · Carrera 30");
  const controls = within(screen.getByRole("group", { name: "Dashboard controls" }));
  const geofences = controls.getByRole("button", { name: "Geofences" });
  expect(geofences).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(geofences);
  expect(geofences).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByTestId("map-pets")).toHaveAttribute("data-geofences", "false");
  fireEvent.click(geofences);
  expect(screen.getByTestId("map-pets")).toHaveAttribute("data-geofences", "true");

  fireEvent.click(controls.getByRole("button", { name: "Maps" }));
  expect(screen.getByRole("menuitemradio", { name: "Clear map" })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(screen.getByRole("menuitemradio", { name: "Detailed map" }));
  expect(screen.getByTestId("map-pets")).toHaveAttribute("data-map-style", "natural");

  fireEvent.click(controls.getByRole("button", { name: "Maps" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: "Clear map" }));
  expect(screen.getByTestId("map-pets")).toHaveAttribute("data-map-style", "clean");
  expectBothPetsOnMap();
});

test("uses the same demo and map controls in the mobile dashboard", async () => {
  const previousMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width:899.95px)",
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  try {
    render(<FiruappDashboard />);
    const controls = within(await screen.findByRole("group", { name: "Dashboard controls" }));
    await screen.findByRole("heading", { name: "Mis mascotas (2)" });
    fireEvent.click(controls.getByRole("button", { name: "Demo Data" }));
    await screen.findByRole("heading", { name: "Mis mascotas (4)" });
    expect(screen.getByRole("button", { name: "Select Bella (Demo)" })).toBeInTheDocument();

    fireEvent.click(controls.getByRole("button", { name: "Geofences" }));
    expect(screen.getByTestId("map-pets")).toHaveAttribute("data-geofences", "false");
    fireEvent.click(controls.getByRole("button", { name: "Maps" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Detailed map" }));
    expect(screen.getByTestId("map-pets")).toHaveAttribute("data-map-style", "natural");

    fireEvent.click(controls.getByRole("button", { name: "Demo Data" }));
    await screen.findByRole("heading", { name: "Mis mascotas (2)" });
    expectBothPetsOnMap();
  } finally {
    window.matchMedia = previousMatchMedia;
  }
});
