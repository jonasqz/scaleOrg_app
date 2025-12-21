import { describe, it, expect } from 'vitest';
import { average, median, standardDeviation, percentile, zScore, sum } from './statistics';

describe('Statistics Utilities', () => {
  describe('average', () => {
    it('should calculate average of numbers', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20, 30])).toBe(20);
      expect(average([100])).toBe(100);
    });

    it('should return 0 for empty array', () => {
      expect(average([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(average([-5, -10, -15])).toBe(-10);
      expect(average([-10, 0, 10])).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(average([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
    });
  });

  describe('median', () => {
    it('should calculate median of odd-length array', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
      expect(median([5, 1, 3])).toBe(3);
    });

    it('should calculate median of even-length array', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
      expect(median([10, 20])).toBe(15);
    });

    it('should return 0 for empty array', () => {
      expect(median([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(median([42])).toBe(42);
    });

    it('should handle unsorted arrays', () => {
      expect(median([5, 2, 8, 1, 9])).toBe(5);
      expect(median([100, 1, 50, 25])).toBe(37.5);
    });

    it('should not mutate original array', () => {
      const original = [5, 2, 8, 1, 9];
      const copy = [...original];
      median(original);
      expect(original).toEqual(copy);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate standard deviation', () => {
      const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(2, 0);
    });

    it('should return 0 for identical values', () => {
      expect(standardDeviation([5, 5, 5, 5])).toBe(0);
    });

    it('should handle single value', () => {
      expect(standardDeviation([42])).toBe(0);
    });

    it('should handle two values', () => {
      const result = standardDeviation([10, 20]);
      expect(result).toBeCloseTo(5, 0);
    });
  });

  describe('percentile', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('should calculate 50th percentile (median)', () => {
      expect(percentile(data, 50)).toBe(5);
    });

    it('should calculate 25th percentile', () => {
      expect(percentile(data, 25)).toBe(3);
    });

    it('should calculate 75th percentile', () => {
      expect(percentile(data, 75)).toBe(8);
    });

    it('should calculate 90th percentile', () => {
      expect(percentile(data, 90)).toBe(9);
    });

    it('should return 0 for empty array', () => {
      expect(percentile([], 50)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(percentile([100], 50)).toBe(100);
      expect(percentile([1, 2], 0)).toBe(1);
      expect(percentile([1, 2, 3], 100)).toBe(3);
    });

    it('should handle unsorted arrays', () => {
      expect(percentile([10, 1, 5, 8, 3], 50)).toBe(5);
    });

    it('should not mutate original array', () => {
      const original = [10, 1, 5, 8, 3];
      const copy = [...original];
      percentile(original, 50);
      expect(original).toEqual(copy);
    });
  });

  describe('zScore', () => {
    it('should calculate z-score', () => {
      expect(zScore(10, 10, 2)).toBe(0); // At mean
      expect(zScore(12, 10, 2)).toBe(1); // 1 std dev above
      expect(zScore(8, 10, 2)).toBe(-1); // 1 std dev below
      expect(zScore(14, 10, 2)).toBe(2); // 2 std devs above
    });

    it('should return 0 when standard deviation is 0', () => {
      expect(zScore(100, 50, 0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(zScore(-5, 0, 5)).toBe(-1);
      expect(zScore(5, 0, 5)).toBe(1);
    });

    it('should handle decimal values', () => {
      expect(zScore(11.5, 10, 2)).toBeCloseTo(0.75);
    });
  });

  describe('sum', () => {
    it('should calculate sum of numbers', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
      expect(sum([10, 20, 30])).toBe(60);
      expect(sum([100])).toBe(100);
    });

    it('should return 0 for empty array', () => {
      expect(sum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(sum([-5, -10, -15])).toBe(-30);
      expect(sum([-10, 10])).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(sum([1.5, 2.5, 3.5])).toBeCloseTo(7.5);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      expect(sum(largeArray)).toBe(499500);
    });
  });
});
