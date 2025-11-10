import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore } from '../src/context';

type Store<T> = ReturnType<typeof createStore<T>>;
type TestState = { count: number; name: string };

describe('Store - Core Functionality', () => {
  let store: Store<TestState>;

  beforeEach(() => {
    store = createStore({ count: 0, name: 'test' });
  });

  test('should create store with initial value', () => {
    expect(store.get()).toEqual({ count: 0, name: 'test' });
  });

  test('should update state with set method', () => {
    store.set({ count: 1 });
    expect(store.get()).toEqual({ count: 1, name: 'test' });
  });

  test('should merge partial state updates', () => {
    const store = createStore({
      count: 0,
      name: 'test',
      age: 25,
    });
    store.set({ count: 5 });
    expect(store.get()).toEqual({ count: 5, name: 'test', age: 25 });
    store.set({ name: 'updated' });
    expect(store.get()).toEqual({ count: 5, name: 'updated', age: 25 });
  });

  test('should support function updater', () => {
    store.set(state => ({ count: state.count + 1 }));
    expect(store.get()).toEqual({ count: 1, name: 'test' });
  });
});

describe('Store - Subscriptions', () => {
  let store: Store<TestState>;

  beforeEach(() => {
    store = createStore({ count: 0, name: 'test' });
  });

  test('should notify subscribers when selected value changes', () => {
    const callback = vi.fn();
    const selector = (state: TestState) => state.count;

    store.subscribe(callback, selector);
    store.set({ count: 1 });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should not notify subscribers when selected value does not change', () => {
    const callback = vi.fn();
    const selector = (state: TestState) => state.count;

    store.subscribe(callback, selector);
    store.set({ name: 'updated' });

    expect(callback).not.toHaveBeenCalled();
  });

  test('should unsubscribe correctly', () => {
    const callback = vi.fn();
    const selector = (state: TestState) => state.count;

    const unsubscribe = store.subscribe(callback, selector);
    unsubscribe();
    store.set({ count: 1 });

    expect(callback).not.toHaveBeenCalled();
  });

  test('should handle multiple subscribers with different selectors', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const selector1 = (state: TestState) => state.count;
    const selector2 = (state: TestState) => state.name;

    store.subscribe(callback1, selector1);
    store.subscribe(callback2, selector2);

    store.set({ count: 1 });
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    store.set({ name: 'updated' });
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('should maintain referential equality for unchanged objects', () => {
    const complexStore = createStore({
      user: { name: 'John', age: 30 },
      count: 0,
    });

    const callback = vi.fn();
    const selector = (state: {
      user: { name: string; age: number };
      count: number;
    }) => state.user;

    complexStore.subscribe(callback, selector);
    complexStore.set({ count: 1 });

    expect(callback).not.toHaveBeenCalled();
  });

  test('should use custom equality function', () => {
    const callback = vi.fn();
    const selector = (state: TestState) => ({ count: state.count });
    const shallowEqual = (a: TestState, b: TestState) => {
      return a.count === b.count;
    };

    store.subscribe(callback, selector, shallowEqual);
    store.set({ count: 0 }); // Same value

    expect(callback).not.toHaveBeenCalled();

    store.set({ count: 1 }); // Different value
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
