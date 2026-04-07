/**
 * Shared date utilities for Pacific Time zone handling.
 * All quota resets and date comparisons use Pacific Time (America/Los_Angeles).
 */

export function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  return pacificTime.toISOString().split("T")[0];
}

export function getTimeUntilPacificMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  const midnight = new Date(pacificTime);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);

  const diff = midnight.getTime() - pacificTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
