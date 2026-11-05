import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  formatAlertDateTime,
  normalizeLiveAlert,
  useLiveAlerts,
} from "./useLiveAlerts";

let mockClientOptions: any;
let mockSubscriptionCallback: ((event: { body: string }) => void) | undefined;

jest.mock("sockjs-client", () => jest.fn(() => ({})));
jest.mock("@stomp/stompjs", () => ({
  Client: class {
    constructor(options: any) {
      mockClientOptions = options;
    }

    activate() {
      mockClientOptions?.onConnect?.();
    }

    subscribe(_destination: string, callback: (event: { body: string }) => void) {
      mockSubscriptionCallback = callback;
      return { unsubscribe: jest.fn() };
    }

    deactivate() {}
  },
}));

const tokenFor = (claims: Record<string, unknown>) => {
  const payload = window.btoa(JSON.stringify(claims));
  return `header.${payload}.signature`;
};

function AlertProbe() {
  const { alerts, dismissAlert } = useLiveAlerts();
  return (
    <div>
      <div data-testid="messages">{alerts.map((alert) => <span key={alert.id}>{alert.message}</span>)}</div>
      <button type="button" onClick={() => alerts[0] && dismissAlert(alerts[0].id)}>Dismiss first</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockClientOptions = undefined;
  mockSubscriptionCallback = undefined;
});

test("adds the event date directly to geofence alert messages", () => {
  const occurredAt = new Date("2026-11-05T15:30:00.000Z");
  const alert = normalizeLiveAlert({
    id: "geo-1",
    ownerId: 42,
    type: "GEOFENCE_EXIT",
    message: "Rocky left the safe zone",
    timestamp: occurredAt.toISOString(),
  }, occurredAt);

  expect(alert.type).toBe("geofence");
  expect(alert.message).toContain(formatAlertDateTime(occurredAt));
  expect(alert.receivedAt).toBe(formatAlertDateTime(occurredAt));
});

test("only subscribes to the authenticated owner's channel and dismisses alerts", async () => {
  localStorage.setItem("token", tokenFor({ id: 42, role: "USER" }));
  render(<AlertProbe />);
  await act(async () => Promise.resolve());

  expect(mockClientOptions).toBeDefined();
  expect(mockSubscriptionCallback).toBeDefined();

  act(() => {
    mockSubscriptionCallback?.({
      body: JSON.stringify({ id: "other", ownerId: 7, message: "Other owner left a geofence", type: "GEOFENCE_EXIT" }),
    });
    mockSubscriptionCallback?.({
      body: JSON.stringify({ id: "mine", ownerId: 42, message: "Rocky left a geofence", type: "GEOFENCE_EXIT" }),
    });
  });

  expect(screen.getByTestId("messages")).toHaveTextContent("Rocky left a geofence");
  expect(screen.getByTestId("messages")).not.toHaveTextContent("Other owner");

  fireEvent.click(screen.getByRole("button", { name: "Dismiss first" }));
  expect(screen.getByTestId("messages")).not.toHaveTextContent("Rocky left a geofence");
  expect(JSON.parse(sessionStorage.getItem("firuapp-alerts:42") || "[]")).toHaveLength(0);
});

test("does not load or subscribe to alerts without an authenticated identity", async () => {
  render(<AlertProbe />);
  await act(async () => Promise.resolve());

  expect(mockClientOptions).toBeUndefined();
  expect(screen.getByTestId("messages")).toBeEmptyDOMElement();
});
