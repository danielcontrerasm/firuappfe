import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useMap } from "react-leaflet";
import MapControls from "./MapControls.tsx";

jest.mock("react-leaflet", () => ({ useMap: jest.fn() }));

const map = { zoomIn: jest.fn(), zoomOut: jest.fn(), fitBounds: jest.fn(), flyTo: jest.fn(), setView: jest.fn(), getCenter: () => [6.24, -75.58] };
beforeEach(() => { jest.clearAllMocks(); (useMap as jest.Mock).mockReturnValue(map); });

test("does not interrupt a manually positioned map when location data refreshes", () => {
  const onToggleLayer = jest.fn();
  const { rerender } = render(<MapControls coordinates={[[6.24, -75.58]]} onToggleLayer={onToggleLayer} />);
  rerender(<MapControls coordinates={[[6.25, -75.59], [6.27, -75.60]]} onToggleLayer={onToggleLayer} />);
  expect(map.fitBounds).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Centrar mapa" }));
  const bounds = map.fitBounds.mock.calls[0][0];
  expect(bounds.contains([6.25, -75.59])).toBe(true);
  expect(bounds.contains([6.27, -75.60])).toBe(true);
});

test("provides zoom and layer controls without changing the selection", () => {
  const onToggleLayer = jest.fn();
  render(<MapControls onToggleLayer={onToggleLayer} cleanLayer />);
  fireEvent.click(screen.getByRole("button", { name: "Acercar mapa" }));
  fireEvent.click(screen.getByRole("button", { name: "Alejar mapa" }));
  fireEvent.click(screen.getByRole("button", { name: "Cambiar capa del mapa" }));
  expect(map.zoomIn).toHaveBeenCalledTimes(1);
  expect(map.zoomOut).toHaveBeenCalledTimes(1);
  expect(onToggleLayer).toHaveBeenCalledTimes(1);
  expect(map.fitBounds).not.toHaveBeenCalled();
});

test("shows a recoverable message when the user denies location access", () => {
  const original = navigator.geolocation;
  let rejectLocation: () => void;
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_: any, reject: () => void) => { rejectLocation = reject; } } });
  render(<MapControls onToggleLayer={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Ir a mi ubicación" }));
  expect(screen.getByRole("button", { name: "Ir a mi ubicación" })).toBeDisabled();
  act(() => rejectLocation());
  expect(screen.getByRole('status')).toHaveTextContent('No pudimos obtener tu ubicación');
  expect(screen.getByRole("button", { name: "Ir a mi ubicación" })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(map.flyTo).not.toHaveBeenCalled();
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: original });
});
