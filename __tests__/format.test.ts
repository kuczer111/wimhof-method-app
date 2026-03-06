import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatTimeMs,
  getTemperatureUnitLabel,
  displayTemperature,
  toStorageCelsius,
  formatDuration,
} from '../lib/format';

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats seconds less than a minute', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(120)).toBe('2:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
  });

  it('pads single-digit seconds', () => {
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(69)).toBe('1:09');
  });

  it('handles large values', () => {
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('formatTimeMs', () => {
  it('formats 0 ms', () => {
    expect(formatTimeMs(0)).toBe('00:00');
  });

  it('formats milliseconds to MM:SS with padding', () => {
    expect(formatTimeMs(5000)).toBe('00:05');
    expect(formatTimeMs(65000)).toBe('01:05');
  });

  it('floors partial seconds', () => {
    expect(formatTimeMs(1500)).toBe('00:01');
    expect(formatTimeMs(59999)).toBe('00:59');
  });

  it('pads minutes', () => {
    expect(formatTimeMs(60000)).toBe('01:00');
    expect(formatTimeMs(600000)).toBe('10:00');
  });
});

describe('getTemperatureUnitLabel', () => {
  it('returns °C for celsius', () => {
    expect(getTemperatureUnitLabel('celsius')).toBe('°C');
  });

  it('returns °F for fahrenheit', () => {
    expect(getTemperatureUnitLabel('fahrenheit')).toBe('°F');
  });
});

describe('displayTemperature', () => {
  it('returns celsius value as-is', () => {
    expect(displayTemperature(10, 'celsius')).toBe('10');
    expect(displayTemperature(0, 'celsius')).toBe('0');
  });

  it('converts celsius to fahrenheit', () => {
    expect(displayTemperature(0, 'fahrenheit')).toBe('32');
    expect(displayTemperature(100, 'fahrenheit')).toBe('212');
    expect(displayTemperature(-40, 'fahrenheit')).toBe('-40');
  });

  it('rounds fahrenheit values', () => {
    // 15°C = 59°F
    expect(displayTemperature(15, 'fahrenheit')).toBe('59');
  });
});

describe('toStorageCelsius', () => {
  it('returns celsius value as-is', () => {
    expect(toStorageCelsius(10, 'celsius')).toBe(10);
  });

  it('converts fahrenheit to celsius', () => {
    expect(toStorageCelsius(32, 'fahrenheit')).toBe(0);
    expect(toStorageCelsius(212, 'fahrenheit')).toBe(100);
    expect(toStorageCelsius(-40, 'fahrenheit')).toBe(-40);
  });

  it('rounds the result', () => {
    // 59°F = 15°C
    expect(toStorageCelsius(59, 'fahrenheit')).toBe(15);
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(120)).toBe('2m 0s');
  });

  it('rounds fractional seconds', () => {
    expect(formatDuration(90.7)).toBe('1m 31s');
    expect(formatDuration(0.4)).toBe('0s');
  });
});
