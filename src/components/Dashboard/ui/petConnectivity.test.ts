import { GPS_ONLINE_TIMEOUT_MS, isGpsOnline } from "./petConnectivity.ts";

const now = new Date(2026, 10, 1, 16, 28).getTime();

test("Peluche's October report is offline while Rocky's recent report is online", () => {
  expect(isGpsOnline("2026-10-06T15:03:00.400963", now)).toBe(false);
  expect(isGpsOnline("2026-11-01T16:26:34", now)).toBe(true);
});

test("expires a report after five minutes", () => {
  const timestamp = new Date(now).toISOString();
  expect(isGpsOnline(timestamp, now + GPS_ONLINE_TIMEOUT_MS)).toBe(true);
  expect(isGpsOnline(timestamp, now + GPS_ONLINE_TIMEOUT_MS + 1)).toBe(false);
});

test.each([undefined, null, "", " ", "invalid", new Date(now + 60_000).toISOString()])(
  "does not treat a missing, invalid, or future timestamp as online: %s",
  (timestamp) => {
    expect(isGpsOnline(timestamp, now)).toBe(false);
  }
);

test("handles timestamps with explicit UTC and timezone offsets", () => {
  const utcNow = new Date("2026-11-01T21:28:00Z").getTime();
  expect(isGpsOnline("2026-11-01T16:26:34-05:00", utcNow)).toBe(true);
  expect(isGpsOnline("2026-11-01T21:26:34Z", utcNow)).toBe(true);
});
