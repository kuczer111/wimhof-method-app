/** Format seconds as "M:SS" */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format milliseconds as "MM:SS" */
export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Get the temperature unit label based on user preference */
export function getTemperatureUnitLabel(unit: "celsius" | "fahrenheit"): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

/** Convert Celsius to Fahrenheit for display */
export function displayTemperature(celsius: number, unit: "celsius" | "fahrenheit"): string {
  if (unit === "fahrenheit") {
    return `${Math.round(celsius * 9 / 5 + 32)}`;
  }
  return `${celsius}`;
}

/** Convert user-entered temperature to Celsius for storage */
export function toStorageCelsius(value: number, unit: "celsius" | "fahrenheit"): number {
  if (unit === "fahrenheit") {
    return Math.round((value - 32) * 5 / 9);
  }
  return value;
}

/** Convert stored Celsius to display value */
export function fromStorageCelsius(celsius: number, unit: "celsius" | "fahrenheit"): number {
  if (unit === "fahrenheit") {
    return Math.round(celsius * 9 / 5 + 32);
  }
  return celsius;
}

/** Format seconds as human-readable duration, e.g. "2m 30s" or "45s" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
