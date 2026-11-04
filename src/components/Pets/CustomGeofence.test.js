import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import axios from "axios";
import { useMap, useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import CustomGeofence from "./CustomGeofence";

jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("react-router-dom", () => ({ useSearchParams: jest.fn() }), { virtual: true });
jest.mock("react-leaflet", () => {
  const React = require("react");
  const Container = ({ children }) => <div>{children}</div>;
  return {
    useMap: jest.fn(),
    useMapEvents: jest.fn(),
    MapContainer: Container,
    FeatureGroup: Container,
    TileLayer: () => null,
    Circle: () => null,
    Polygon: () => null,
    Polyline: () => null,
    Popup: Container,
  };
});

const pets = [{ id: 1, name: "Peluche", status: "active" }];
const savedGeofences = [{
  id: 7,
  petId: 1,
  name: "Home",
  type: "polygon",
  coordinates: [[-74.792, 10.973], [-74.791, 10.973], [-74.791, 10.974]],
}];
let map;

beforeEach(() => {
  map = { fitBounds: jest.fn(), setView: jest.fn() };
  useMap.mockReturnValue(map);
  useSearchParams.mockReturnValue([new URLSearchParams("petId=1"), jest.fn()]);
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.endsWith("/api/pets") ? pets : savedGeofences,
  }));
});

const clickMap = (lat, lng) => {
  act(() => {
    const handlers = useMapEvents.mock.calls[useMapEvents.mock.calls.length - 1][0];
    handlers.click({ latlng: { lat, lng } });
  });
};

const expectViewportUnchanged = () => {
  expect(map.fitBounds).not.toHaveBeenCalled();
  expect(map.setView).not.toHaveBeenCalled();
};

test("fits saved geofences on load but preserves the viewport while adding polygon vertices", async () => {
  render(<CustomGeofence />);
  await screen.findByText("1 SAVED");
  expect(map.fitBounds).toHaveBeenCalled();
  map.fitBounds.mockClear();
  map.setView.mockClear();

  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  clickMap(10.973, -74.792);
  clickMap(10.973, -74.791);
  clickMap(10.974, -74.791);

  expect(screen.getByText("3 POINTS")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  expectViewportUnchanged();
});

test("does not reset the zoom to 14 when placing the first point without saved geofences", async () => {
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.endsWith("/api/pets") ? pets : [],
  }));
  render(<CustomGeofence />);
  await screen.findByRole("option", { name: "Peluche" });

  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  clickMap(10.973, -74.792);

  expect(screen.getByText("1 POINTS")).toBeInTheDocument();
  expectViewportUnchanged();
});

test("preserves the viewport when switching to a circle, moving its center, and changing its radius", async () => {
  render(<CustomGeofence />);
  await screen.findByText("1 SAVED");
  map.fitBounds.mockClear();
  map.setView.mockClear();

  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  clickMap(10.973, -74.792);
  fireEvent.click(screen.getByRole("button", { name: "Circle" }));
  clickMap(10.973, -74.792);
  clickMap(10.974, -74.791);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "650" } });

  expect(screen.getByText("650 meter circle ready")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  expectViewportUnchanged();
});

test("does not interrupt drawing when saved geofences finish loading", async () => {
  let resolveGeofences;
  const pendingGeofences = new Promise((resolve) => { resolveGeofences = resolve; });
  axios.get.mockImplementation((url) => url.endsWith("/api/pets")
    ? Promise.resolve({ data: pets })
    : pendingGeofences);
  render(<CustomGeofence />);
  await screen.findByRole("option", { name: "Peluche" });

  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  clickMap(10.973, -74.792);
  await act(async () => {
    resolveGeofences({ data: savedGeofences });
  });

  expect(screen.getByText("1 SAVED")).toBeInTheDocument();
  expect(screen.getByText("1 POINTS")).toBeInTheDocument();
  expectViewportUnchanged();

  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(map.fitBounds).toHaveBeenCalled();
});
