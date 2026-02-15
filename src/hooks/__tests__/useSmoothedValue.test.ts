import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSmoothedValue } from '../useSmoothedValue';

describe('useSmoothedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with the provided value', () => {
    const { result } = renderHook(() => useSmoothedValue(50));
    expect(result.current).toBe(50);
  });

  it('should smoothly transition from 0 to 100', async () => {
    const { result, rerender } = renderHook(
      ({ value, duration }) => useSmoothedValue(value, duration),
      { initialProps: { value: 0, duration: 300 } }
    );

    expect(result.current).toBe(0);

    // Update target value
    rerender({ value: 100, duration: 300 });

    // Fast-forward halfway through animation
    await waitFor(() => {
      vi.advanceTimersByTime(150);
    });

    // Value should be between 0 and 100 (approximately halfway due to easing)
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);

    // Fast-forward to completion
    await waitFor(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBeCloseTo(100, 1);
  });

  it('should apply easeOutCubic easing function', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 100 });

    // At 50% progress, easeOutCubic should give ~0.875 progress
    // So value should be ~87.5
    await waitFor(() => {
      vi.advanceTimersByTime(150);
    });

    // Due to easing, value should be more than simple linear interpolation (50)
    expect(result.current).toBeGreaterThan(50);
  });

  it('should handle rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 0 } }
    );

    // Change value multiple times quickly
    rerender({ value: 50 });
    await waitFor(() => vi.advanceTimersByTime(50));

    rerender({ value: 100 });
    await waitFor(() => vi.advanceTimersByTime(50));

    rerender({ value: 75 });
    await waitFor(() => vi.advanceTimersByTime(50));

    // Should still animate to final value
    await waitFor(() => vi.advanceTimersByTime(300));

    expect(result.current).toBeCloseTo(75, 1);
  });

  it('should handle zero duration as instant change', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 0),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 100 });

    // With zero duration, should complete immediately
    await waitFor(() => vi.advanceTimersByTime(1));

    expect(result.current).toBe(100);
  });

  it('should handle negative values correctly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 0 } }
    );

    rerender({ value: -50 });

    await waitFor(() => vi.advanceTimersByTime(300));

    expect(result.current).toBeCloseTo(-50, 1);
  });

  it('should cleanup animation frame on unmount', () => {
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 100 });

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should not animate if target value has not changed', () => {
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 50 } }
    );

    const initialCallCount = requestAnimationFrameSpy.mock.calls.length;

    // Rerender with same value
    rerender({ value: 50 });

    // Should not trigger new animation
    expect(requestAnimationFrameSpy.mock.calls.length).toBe(initialCallCount);
  });

  it('should handle decimal values correctly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useSmoothedValue(value, 300),
      { initialProps: { value: 0.5 } }
    );

    rerender({ value: 1.5 });

    await waitFor(() => vi.advanceTimersByTime(300));

    expect(result.current).toBeCloseTo(1.5, 2);
  });
});
