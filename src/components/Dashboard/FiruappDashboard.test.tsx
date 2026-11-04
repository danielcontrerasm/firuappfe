import React, { useEffect } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import axios from "axios";
import FiruappDashboard from "./FiruappDashboard.tsx";
import FiruappMapView from "./ui/FiruappMapView.tsx";

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
const MapPreview = ({ pets, onLocationsChange, onSelectPet }: any) => {
  useEffect(() => {
    onLocationsChange(locations);
  }, [onLocationsChange]);

  return (
    <div data-testid="map-pets">
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
