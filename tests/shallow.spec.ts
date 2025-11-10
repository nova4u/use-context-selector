import { describe, expect, test } from 'vitest';
import shallow from '../utils/shallow';

describe('shallow', () => {
  describe('primitives', () => {
    test('should return true for identical primitives', () => {
      expect(shallow(1, 1)).toBe(true);
      expect(shallow('test', 'test')).toBe(true);
      expect(shallow(true, true)).toBe(true);
      expect(shallow(null, null)).toBe(true);
      expect(shallow(undefined, undefined)).toBe(true);
    });

    test('should return false for different primitives', () => {
      expect(shallow(1, 2)).toBe(false);
      expect(shallow('test', 'other')).toBe(false);
      expect(shallow(true, false)).toBe(false);
      expect(shallow(null, undefined)).toBe(false);
    });

    test('should handle NaN correctly', () => {
      expect(shallow(NaN, NaN)).toBe(true);
    });
  });

  describe('objects', () => {
    test('should return true for same object reference', () => {
      const obj = { a: 1, b: 2 };
      expect(shallow(obj, obj)).toBe(true);
    });

    test('should return true for shallow equal objects', () => {
      expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallow({ x: 'test' }, { x: 'test' })).toBe(true);
    });

    test('should return false for objects with different keys', () => {
      expect(shallow({ a: 1 }, { b: 1 })).toBe(false);
      expect(shallow({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    test('should return false for objects with different values', () => {
      expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
      expect(shallow({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    });

    test('should return false for nested objects with different references', () => {
      expect(shallow({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
    });

    test('should return true for nested objects with same reference', () => {
      const nested = { b: 1 };
      expect(shallow({ a: nested }, { a: nested })).toBe(true);
    });

    test('should handle empty objects', () => {
      expect(shallow({}, {})).toBe(true);
    });
  });

  describe('arrays', () => {
    test('should return true for same array reference', () => {
      const arr = [1, 2, 3];
      expect(shallow(arr, arr)).toBe(true);
    });

    test('should return true for shallow equal arrays', () => {
      expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(shallow(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    test('should return false for arrays with different lengths', () => {
      expect(shallow([1, 2], [1, 2, 3])).toBe(false);
      expect(shallow([1], [])).toBe(false);
    });

    test('should return false for arrays with different values', () => {
      expect(shallow([1, 2], [1, 3])).toBe(false);
      expect(shallow(['a', 'b'], ['a', 'c'])).toBe(false);
    });

    test('should return false for nested arrays with different references', () => {
      expect(shallow([[1, 2]], [[1, 2]])).toBe(false);
    });

    test('should return true for nested arrays with same reference', () => {
      const nested = [1, 2];
      expect(shallow([nested], [nested])).toBe(true);
    });

    test('should handle empty arrays', () => {
      expect(shallow([], [])).toBe(true);
    });

    test('should return false when comparing array to object', () => {
      expect(shallow([1, 2], { 0: 1, 1: 2 } as any)).toBe(false);
    });
  });

  describe('special objects', () => {
    test('should handle Date objects', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      const date3 = new Date('2024-01-02');

      expect(shallow(date1, date1)).toBe(true);
      expect(shallow(date1, date2)).toBe(true);
      expect(shallow(date1, date3)).toBe(false);
    });

    test('should handle RegExp objects', () => {
      const regex1 = /test/gi;
      const regex2 = /test/gi;
      const regex3 = /test/g;

      expect(shallow(regex1, regex1)).toBe(true);
      expect(shallow(regex1, regex2)).toBe(true);
      expect(shallow(regex1, regex3)).toBe(false);
    });

    test('should handle Map objects', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map3 = new Map([
        ['a', 1],
        ['b', 3],
      ]);
      const map4 = new Map([['a', 1]]);

      expect(shallow(map1, map1)).toBe(true);
      expect(shallow(map1, map2)).toBe(true);
      expect(shallow(map1, map3)).toBe(false);
      expect(shallow(map1, map4)).toBe(false);
    });

    test('should handle Set objects', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);
      const set4 = new Set([1, 2]);

      expect(shallow(set1, set1)).toBe(true);
      expect(shallow(set1, set2)).toBe(true);
      expect(shallow(set1, set3)).toBe(false);
      expect(shallow(set1, set4)).toBe(false);
    });
  });

  describe('mixed types', () => {
    test('should return false for different types', () => {
      expect(shallow(1, '1' as any)).toBe(false);
      expect(shallow(null, {} as any)).toBe(false);
      expect(shallow([], {} as any)).toBe(false);
      expect(shallow(true, 1 as any)).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(shallow(null, null)).toBe(true);
      expect(shallow(undefined, undefined)).toBe(true);
      expect(shallow(null, undefined)).toBe(false);
      expect(shallow(null, {} as any)).toBe(false);
      expect(shallow(undefined, {} as any)).toBe(false);
    });
  });
});
