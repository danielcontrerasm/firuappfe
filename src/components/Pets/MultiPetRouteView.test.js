import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { useMap } from "react-leaflet";
import MultiPetRouteView from "./MultiPetRouteView";

jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("react-leaflet", () => {
  const React = require("react");
  const Container = ({ children }) => <div>{children}</div>;
  return {
    useMap: jest.fn(),
    MapContainer: Container,
    Marker: Container,
    Popup: Container,
    Polyline: () => null,
    TileLayer: () => null,
  };
});
jest.mock("../Dashboard/ui/FiruappPetList.tsx", () => {
  const React = require("react");
  return ({ pets, onSelect }) => (
    <div>
      {pets.map((pet) => (
        <button key={pet.id} onClick={() => onSelect(pet.id)}>Select {pet.name}</button>
      ))}
    </div>
  );
});

const now = new Date("2026-11-01T16:28:37Z");
const defaultPoints = [{ id: 1, petId: 1, petName: "Peluche", latitude: 10.973074, longitude: -74.791997 }];
const responseFor = (url) => ({
  data: url.endsWith("/api/pets")
    ? [{ id: 1, name: "Peluche" }]
    : url.includes("walk-distance") ? [] : defaultPoints,
});

beforeEach(() => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(now);
  useMap.mockReturnValue({ setView: jest.fn(), fitBounds: jest.fn() });
  axios.get.mockImplementation((url) => Promise.resolve(responseFor(url)));
});

afterEach(() => {
  jest.useRealTimers();
});

const selectPet = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Select Peluche" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "10 minutes" })).toBeEnabled());
};

const latestRangeRequest = () => axios.get.mock.calls
  .map(([url]) => new URL(url))
  .filter((url) => url.pathname.endsWith("/1/route/range"))
  .pop();

test("requires a selected pet before applying a recent period", async () => {
  render(<MultiPetRouteView />);
  await screen.findByRole("button", { name: "Select Peluche" });
  expect(screen.getByRole("button", { name: "10 minutes" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "1 hour" })).toBeDisabled();
  expect(latestRangeRequest()).toBeUndefined();
});

test.each([
  { label: "10 minutes", minutes: 10 },
  { label: "1 hour", minutes: 60 },
])("immediately requests the last $label and fills in the date fields", async ({ label, minutes }) => {
  render(<MultiPetRouteView />);
  await selectPet();
  const button = screen.getByRole("button", { name: label });
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeEnabled());

  const request = latestRangeRequest();
  const from = request.searchParams.get("from");
  const to = request.searchParams.get("to");
  expect(to).toBe(now.toISOString());
  expect(new Date(to).getTime() - new Date(from).getTime()).toBe(minutes * 60 * 1000);
  expect(new Date(screen.getByLabelText("Route range from").value).toISOString()).toBe(from);
  expect(new Date(screen.getByLabelText("Route range to").value).toISOString()).toBe(to);
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: `Movement trail · Last ${label}` })).toBeInTheDocument();
});

test("Clear restores the default route and clears the selected period", async () => {
  render(<MultiPetRouteView />);
  await selectPet();
  fireEvent.click(screen.getByRole("button", { name: "10 minutes" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "10 minutes" })).toBeEnabled());

  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "10 minutes" })).toBeEnabled());

  expect(screen.getByLabelText("Route range from")).toHaveValue("");
  expect(screen.getByLabelText("Route range to")).toHaveValue("");
  expect(screen.getByRole("button", { name: "10 minutes" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("heading", { name: "Movement trail · Last 3 hours" })).toBeInTheDocument();
  expect(new URL(axios.get.mock.calls[axios.get.mock.calls.length - 1][0]).pathname).toBe("/api/pets/1/route");
});

test("a custom search replaces the selected recent period", async () => {
  render(<MultiPetRouteView />);
  await selectPet();
  fireEvent.click(screen.getByRole("button", { name: "1 hour" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "1 hour" })).toBeEnabled());

  const from = "2026-10-06T15:00:00";
  const to = "2026-10-06T15:20:00";
  fireEvent.change(screen.getByLabelText("Route range from"), { target: { value: from } });
  fireEvent.change(screen.getByLabelText("Route range to"), { target: { value: to } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Search" })).toBeEnabled());

  expect(latestRangeRequest().searchParams.get("from")).toBe(new Date(from).toISOString());
  expect(latestRangeRequest().searchParams.get("to")).toBe(new Date(to).toISOString());
  expect(screen.getByRole("button", { name: "1 hour" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("heading", { name: "Movement trail · Selected time range" })).toBeInTheDocument();
});

test("an older period response cannot replace the route after Clear", async () => {
  let resolveRange;
  const pendingRange = new Promise((resolve) => { resolveRange = resolve; });
  axios.get.mockImplementation((url) => url.includes("/route/range?")
    ? pendingRange
    : Promise.resolve(responseFor(url)));
  render(<MultiPetRouteView />);
  await selectPet();

  fireEvent.click(screen.getByRole("button", { name: "10 minutes" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "10 minutes" })).toBeEnabled());
  await act(async () => {
    resolveRange({ data: [{ ...defaultPoints[0], latitude: 10.62445 }] });
  });

  expect(screen.getByText(/Lat: 10\.97307/)).toBeInTheDocument();
  expect(screen.queryByText(/Lat: 10\.62445/)).not.toBeInTheDocument();
});
