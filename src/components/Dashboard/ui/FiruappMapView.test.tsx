import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import axios from "axios";
import { useMap } from "react-leaflet";
import FiruappMapView, { CenterMap } from "./FiruappMapView.tsx";
import { demoPets } from "./dashboardDemoData.ts";

jest.mock("react-leaflet", () => {
  const React = require("react");
  const Container = ({ children }: any) => <div>{children}</div>;
  return {
    useMap: jest.fn(),
    MapContainer: Container,
    Popup: Container,
    TileLayer: () => null,
    Circle: ({ children }: any) => <div data-testid="map-geofence">{children}</div>,
    Polygon: ({ children }: any) => <div data-testid="map-geofence">{children}</div>,
    Marker: ({ icon, children, position }: any) => (
      <div data-testid="map-marker" data-latitude={position[0]} data-longitude={position[1]}>
        <div dangerouslySetInnerHTML={{ __html: icon.options.html }} />
        {children}
      </div>
    ),
  };
});
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../services/usePetImage.ts", () => ({
  loadPetImage: () => Promise.resolve(undefined),
}));

const locations = [
  { id: 80133, petId: 1, latitude: 10.973074, longitude: -74.791997 },
  { id: 80134, petId: 4, latitude: 10.624448333333333, longitude: -74.923545 },
];

test("fits both distant pet locations in the viewport", () => {
  const fitBounds = jest.fn();
  (useMap as jest.Mock).mockReturnValue({ fitBounds });
  render(<CenterMap markers={locations} selectionKey="all" />);

  const [bounds, options] = fitBounds.mock.calls[0];
  locations.forEach(({ latitude, longitude }) => {
    expect(bounds.contains([latitude, longitude])).toBe(true);
  });
  expect(options).toEqual({ padding: [80, 80], maxZoom: 14 });
});

test("keeps the default viewport when no locations are available", () => {
  const fitBounds = jest.fn();
  (useMap as jest.Mock).mockReturnValue({ fitBounds });
  render(<CenterMap markers={[]} selectionKey="all" />);
  expect(fitBounds).not.toHaveBeenCalled();
});

test("limits zoom for a single pet and fits again when the selected pets change", () => {
  const fitBounds = jest.fn();
  (useMap as jest.Mock).mockReturnValue({ fitBounds });
  const { rerender } = render(<CenterMap markers={[locations[0]]} selectionKey="pet-1" />);
  expect(fitBounds.mock.calls[0][1].maxZoom).toBe(14);

  rerender(<CenterMap markers={locations} selectionKey="all" />);
  expect(fitBounds).toHaveBeenCalledTimes(2);
  expect(fitBounds.mock.calls[1][0].contains([locations[1].latitude, locations[1].longitude])).toBe(true);
});

test("preserves the viewport across moved, reordered, and temporarily empty location refreshes", () => {
  const fitBounds = jest.fn();
  (useMap as jest.Mock).mockReturnValue({ fitBounds });
  const { rerender } = render(<CenterMap markers={locations} selectionKey="all" />);

  const refreshed = locations.map((location) => ({
    ...location,
    id: location.id + 100,
    latitude: location.latitude + 0.01,
  })).reverse();
  rerender(<CenterMap markers={refreshed} selectionKey="all" />);
  rerender(<CenterMap markers={[]} selectionKey="all" />);
  rerender(<CenterMap markers={refreshed} selectionKey="all" />);

  expect(fitBounds).toHaveBeenCalledTimes(1);
});

test("waits for location data before fitting a new selection", () => {
  const fitBounds = jest.fn();
  (useMap as jest.Mock).mockReturnValue({ fitBounds });
  const { rerender } = render(<CenterMap markers={[]} selectionKey="all" />);
  rerender(<CenterMap markers={locations} selectionKey="all" />);
  expect(fitBounds).toHaveBeenCalledTimes(1);

  rerender(<CenterMap markers={[]} selectionKey="pet-4" />);
  expect(fitBounds).toHaveBeenCalledTimes(1);
  rerender(<CenterMap markers={[locations[1]]} selectionKey="pet-4" />);
  expect(fitBounds).toHaveBeenCalledTimes(2);
});

describe("GPS connectivity on the map", () => {
  const pets = [
    { id: "db-1", apiId: "1", name: "Peluche", status: "active" as const },
    { id: "db-4", apiId: "4", name: "Rocky", status: "active" as const },
  ];
  const reports = [
    { ...locations[0], petName: "Peluche", timestamp: "2026-10-06T15:03:00.400963" },
    { ...locations[1], petName: "Rocky", timestamp: "2026-11-01T16:26:34" },
  ];
  const markerFor = (name: string) => screen.getAllByTestId("map-marker").find(
    (marker) => within(marker).queryByText(name, { selector: ".firu-pet-label strong" })
  )!;

  beforeEach(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2026, 10, 1, 16, 28));
    (useMap as jest.Mock).mockReturnValue({ fitBounds: jest.fn() });
    (axios.get as jest.Mock).mockImplementation((url: string) => Promise.resolve({
      data: url.endsWith("/api/pets/locations") ? reports : [],
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("retains old positions but excludes them from the online count", async () => {
    render(<FiruappMapView pets={pets} />);
    await screen.findByText("1 pets online");

    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);
    expect(within(markerFor("Peluche")).getByText("Offline")).toBeInTheDocument();
    expect(within(markerFor("Rocky")).getByText("Online")).toBeInTheDocument();
  });

  test("refreshes marker positions and dashboard data without changing the viewport", async () => {
    const onLocationsChange = jest.fn();
    const { rerender } = render(<FiruappMapView pets={pets} onLocationsChange={onLocationsChange} />);
    await screen.findByText("1 pets online");
    const map = (useMap as jest.Mock).mock.results[0].value;
    expect(map.fitBounds).toHaveBeenCalledTimes(1);

    const refreshedReports = reports.map((report) => ({
      ...report,
      id: report.id + 100,
      latitude: report.latitude + 0.01,
      longitude: report.longitude - 0.01,
      timestamp: new Date().toISOString(),
    }));
    (axios.get as jest.Mock).mockImplementation((url: string) => Promise.resolve({
      data: url.endsWith("/api/pets/locations") ? refreshedReports : [],
    }));
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    expect(markerFor("Rocky")).toHaveAttribute("data-latitude", String(refreshedReports[1].latitude));
    expect(markerFor("Rocky")).toHaveAttribute("data-longitude", String(refreshedReports[1].longitude));
    expect(onLocationsChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining(refreshedReports[1]),
    ]));
    expect(map.fitBounds).toHaveBeenCalledTimes(1);

    // A parent re-render with updated pet metadata must also preserve the viewport.
    rerender(<FiruappMapView pets={pets.map((pet) => ({ ...pet, battery: 50 }))} onLocationsChange={onLocationsChange} />);
    // Settle asynchronous geofence and image requests triggered by the new props.
    await act(() => Promise.resolve());
    expect(map.fitBounds).toHaveBeenCalledTimes(1);

    // Deliberately narrowing the visible pets still fits the resulting selection.
    rerender(<FiruappMapView pets={[pets[1]]} onLocationsChange={onLocationsChange} />);
    await act(() => Promise.resolve());
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
  });

  test("expires online indicators even when location requests stop responding", async () => {
    render(<FiruappMapView pets={pets} />);
    await screen.findByText("1 pets online");
    (axios.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    act(() => {
      jest.advanceTimersByTime(4 * 60 * 1000);
    });

    expect(screen.getByText("0 pets online")).toBeInTheDocument();
    expect(within(markerFor("Rocky")).getByText("Offline")).toBeInTheDocument();
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);
  });

  test("a lost pet can still have a recent GPS report", async () => {
    render(<FiruappMapView pets={[pets[0], { ...pets[1], status: "lost" }]} />);
    await screen.findByText("1 pets online");

    expect(within(markerFor("Rocky")).getByText("Lost · Online")).toBeInTheDocument();
  });

  test("demo mode adds markers, safe zones, and detail data without removing real locations", async () => {
    const onLocationsChange = jest.fn();
    const { rerender } = render(<FiruappMapView pets={pets} onLocationsChange={onLocationsChange} />);
    await screen.findByText("1 pets online");

    await act(async () => {
      rerender(<FiruappMapView pets={[...pets, ...demoPets]} petDataMode="mixed" onLocationsChange={onLocationsChange} />);
    });
    await screen.findByText("3 pets online");
    expect(screen.getAllByTestId("map-marker")).toHaveLength(4);
    expect(screen.getAllByTestId("map-geofence")).toHaveLength(2);
    expect(onLocationsChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ petId: "mock-2", city: "Medellín", batteryPercent: 82 }),
      expect.objectContaining({ petId: "mock-3", city: "Medellín", batteryPercent: 18 }),
      expect.objectContaining({ petId: 1 }),
      expect.objectContaining({ petId: 4 }),
    ]));
    expect((axios.get as jest.Mock).mock.calls.some(([url]) => url.includes("/mock-"))).toBe(false);

    await act(async () => {
      rerender(<FiruappMapView pets={pets} petDataMode="database" onLocationsChange={onLocationsChange} />);
    });
    await screen.findByText("1 pets online");
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);
    expect(screen.queryByTestId("map-geofence")).not.toBeInTheDocument();
    expect(onLocationsChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ petId: 1 }), expect.objectContaining({ petId: 4 }),
    ]));
    expect(onLocationsChange.mock.calls.at(-1)[0]).toHaveLength(2);
  });

  test("hides and restores saved geofences while keeping pet markers visible", async () => {
    (axios.get as jest.Mock).mockImplementation((url: string) => Promise.resolve({
      data: url.endsWith("/api/pets/locations") ? reports : [
        { id: 1, type: "circle", center: { latitude: 10.97, longitude: -74.79 }, radiusMeters: 200 },
      ],
    }));
    const onShowGeofencesChange = jest.fn();
    const { rerender } = render(<FiruappMapView pets={pets} showGeofences onShowGeofencesChange={onShowGeofencesChange} />);
    expect(await screen.findAllByTestId("map-geofence")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Toggle geofences" }));
    expect(onShowGeofencesChange).toHaveBeenCalledWith(false);
    await act(async () => {
      rerender(<FiruappMapView pets={pets} showGeofences={false} onShowGeofencesChange={onShowGeofencesChange} />);
    });
    expect(screen.queryByTestId("map-geofence")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);

    await act(async () => {
      rerender(<FiruappMapView pets={pets} showGeofences onShowGeofencesChange={onShowGeofencesChange} />);
    });
    expect(screen.getAllByTestId("map-geofence")).toHaveLength(2);
  });

  test("keeps the map's layer button in sync with the selected map style", async () => {
    const onMapStyleChange = jest.fn();
    const { rerender } = render(<FiruappMapView pets={pets} mapStyle="clean" onMapStyleChange={onMapStyleChange} />);
    await screen.findByText("1 pets online");
    const layerButton = screen.getByRole("button", { name: "Cambiar capa del mapa" });
    expect(layerButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(layerButton);
    expect(onMapStyleChange).toHaveBeenCalledWith("natural");
    await act(async () => {
      rerender(<FiruappMapView pets={pets} mapStyle="natural" onMapStyleChange={onMapStyleChange} />);
    });
    expect(layerButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(layerButton);
    expect(onMapStyleChange).toHaveBeenLastCalledWith("clean");
  });
});
