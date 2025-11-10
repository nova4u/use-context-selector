import {
  render,
  screen,
  waitFor,
  fireEvent,
  type RenderResult,
} from '@testing-library/react';
import { act } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore, createUseStore, useStoreSelector } from '../src/context';
import shallow from '../utils/shallow';

type Store<T> = ReturnType<typeof createStore<T>>;
type UseStoreHook<T> = ReturnType<typeof createUseStore<T>>;
type TestState = { count: number; name: string };

function renderWithProvider<T>(
  store: ReturnType<typeof createStore<T>>,
  component: React.ReactElement
): RenderResult {
  return render(<store.Provider>{component}</store.Provider>);
}

function mockFetch<T>(data: T, delay = 150): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
}

describe('Provider & Error Handling', () => {
  let store: Store<TestState>;

  beforeEach(() => {
    store = createStore({ count: 0, name: 'test' });
  });

  test('should render children within Provider', () => {
    const TestComponent = () => <div>test content</div>;
    const { container } = renderWithProvider(store, <TestComponent />);
    expect(container.textContent).toBe('test content');
  });

  test('should throw error when used outside Provider', () => {
    const TestComponent = () => {
      useStoreSelector(store.context, state => state.count);
      return <div>test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useStoreSelector must be used within a Provider'
    );
  });
});

describe('Basic Selection & Rendering', () => {
  let store: Store<TestState>;
  let useStore: UseStoreHook<TestState>;

  beforeEach(() => {
    store = createStore({ count: 0, name: 'test' });
    useStore = createUseStore(store);
  });

  test('should return selected value from context', () => {
    store.set({ count: 5 });

    const TestComponent = () => {
      const count = useStoreSelector(store.context, state => state.count);
      return <div data-testid="count">{count}</div>;
    };

    renderWithProvider(store, <TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('5');
  });

  test('should handle simple and complex selectors', () => {
    const complexStore = createStore({
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark' },
      count: 5,
    });

    const TestComponent = () => {
      const count = useStoreSelector(
        complexStore.context,
        state => state.count
      );
      const userName = useStoreSelector(
        complexStore.context,
        state => state.user.name
      );
      return (
        <>
          <div data-testid="count">{count}</div>
          <div data-testid="name">{userName}</div>
        </>
      );
    };

    renderWithProvider(complexStore, <TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('5');
    expect(screen.getByTestId('name').textContent).toBe('John');
  });

  test('should create a working hook with createUseStore', () => {
    const TestComponent = () => {
      const count = useStore(state => state.count);
      return <div data-testid="count">{count}</div>;
    };

    renderWithProvider(store, <TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  test('should work with derived values', () => {
    store.set({ count: 5 });

    const TestComponent = () => {
      const doubled = useStore(state => state.count * 2);
      return <div data-testid="doubled">{doubled}</div>;
    };

    renderWithProvider(store, <TestComponent />);
    expect(screen.getByTestId('doubled').textContent).toBe('10');
  });
});

describe('Re-rendering Behavior', () => {
  let store: Store<TestState>;

  beforeEach(() => {
    store = createStore({ count: 0, name: 'test' });
  });

  test('should re-render when selected value changes', async () => {
    const TestComponent = () => {
      const count = useStoreSelector(store.context, state => state.count);
      return <div data-testid="count">{count}</div>;
    };

    renderWithProvider(store, <TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('0');

    act(() => {
      store.set({ count: 10 });
    });

    expect(screen.getByTestId('count').textContent).toBe('10');
  });

  test('should not re-render when non-selected value changes', async () => {
    const renderSpy = vi.fn();

    const TestComponent = () => {
      const count = useStoreSelector(store.context, state => state.count);
      renderSpy();
      return <div data-testid="count">{count}</div>;
    };

    renderWithProvider(store, <TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      store.set({ name: 'updated' });
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple components with different selectors', async () => {
    const CountComponent = () => {
      const count = useStoreSelector(store.context, state => state.count);
      return <div data-testid="count">{count}</div>;
    };

    const NameComponent = () => {
      const name = useStoreSelector(store.context, state => state.name);
      return <div data-testid="name">{name}</div>;
    };

    renderWithProvider(
      store,
      <>
        <CountComponent />
        <NameComponent />
      </>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('name').textContent).toBe('test');

    act(() => {
      store.set({ count: 42 });
    });

    expect(screen.getByTestId('name').textContent).toBe('test');
  });
});

describe('Actions in Store', () => {
  type StoreWithActions = {
    count: number;
    name: string;
    setName: (name: string) => void;
    incrementCount: () => void;
  };

  function createTestStore() {
    const store = createStore<StoreWithActions>({
      count: 0,
      name: 'test',
      setName: (name: string) => {
        store.set({ name });
      },
      incrementCount: () => {
        store.set({ count: store.get().count + 1 });
      },
    });
    return store;
  }

  let store: Store<StoreWithActions>;
  let useStore: UseStoreHook<StoreWithActions>;

  beforeEach(() => {
    store = createTestStore();
    useStore = createUseStore(store);
  });

  test('should handle actions stored in state', () => {
    const TestComponent = () => {
      const count = useStore(s => s.count);
      const increment = useStore(s => s.incrementCount);

      return (
        <>
          <div data-testid="count">{count}</div>
          <button data-testid="increment-button" onClick={increment}>
            increment
          </button>
        </>
      );
    };

    renderWithProvider(store, <TestComponent />);

    const buttonEl = screen.getByTestId('increment-button');
    const countEl = screen.getByTestId('count');

    expect(countEl.textContent).toBe('0');

    fireEvent.click(buttonEl);
    expect(countEl.textContent).toBe('1');

    act(() => {
      store.set({ count: 99 });
    });
    expect(countEl.textContent).toBe('99');
  });
});

describe('Equality Functions', () => {
  test('should prevent re-renders with shallow equality', () => {
    const store = createStore({
      countA: 0,
      countB: 0,
      incrementA: () => store.set({ countA: store.get().countA + 1 }),
      incrementB: () => store.set({ countB: store.get().countB + 1 }),
    });
    const useStore = createUseStore(store);

    const countARenderSpy = vi.fn();
    const countBRenderSpy = vi.fn();

    const CountAComponent = () => {
      countARenderSpy();
      const countA = useStore(s => ({
        value: s.countA,
        increment: s.incrementA,
      }));
      return (
        <>
          <div data-testid="countA">{countA.value}</div>
          <button data-testid="increment-buttonA" onClick={countA.increment}>
            increment A
          </button>
        </>
      );
    };

    const CountBComponent = () => {
      countBRenderSpy();
      const countB = useStore(
        s => ({
          value: s.countB,
          increment: s.incrementB,
        }),
        shallow
      );
      return (
        <>
          <div data-testid="countB">{countB.value}</div>
          <button data-testid="increment-buttonB" onClick={countB.increment}>
            increment B
          </button>
        </>
      );
    };

    renderWithProvider(
      store,
      <>
        <CountAComponent />
        <CountBComponent />
      </>
    );

    expect(screen.getByTestId('countA').textContent).toBe('0');
    expect(screen.getByTestId('countB').textContent).toBe('0');

    const initialCountARenders = countARenderSpy.mock.calls.length;
    const initialCountBRenders = countBRenderSpy.mock.calls.length;

    // Click A button - A should re-render (no shallow), B should not
    fireEvent.click(screen.getByTestId('increment-buttonA'));
    expect(screen.getByTestId('countA').textContent).toBe('1');
    expect(screen.getByTestId('countB').textContent).toBe('0');

    // CountA re-renders on every state change (returns new object)
    expect(countARenderSpy.mock.calls.length).toBeGreaterThan(
      initialCountARenders
    );
    // CountB uses shallow equality, so it doesn't re-render
    expect(countBRenderSpy.mock.calls.length).toBe(initialCountBRenders);
  });
});

describe('Async Patterns', () => {
  test('should handle async actions and state updates from within component', async () => {
    const asyncStore = createStore<{
      data?: string;
      fetchData: () => void;
    }>({
      data: undefined,
      fetchData: async () => {
        const data = await mockFetch('some Data');
        asyncStore.set({ data });
      },
    });
    const useAsyncStore = createUseStore(asyncStore);

    const TestComponent = () => {
      const data = useAsyncStore(s => s.data);
      const fetchData = useAsyncStore(s => s.fetchData);

      useEffect(() => {
        if (!data) {
          fetchData();
        }
      }, [data, fetchData]);

      if (!data) {
        return <div>Loading...</div>;
      }

      return <div data-testid="data">{data}</div>;
    };

    render(
      <asyncStore.Provider>
        <TestComponent />
      </asyncStore.Provider>
    );

    expect(screen.getByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('some Data');
    });
  });
});

describe('Advanced Patterns', () => {
  type Data = string;
  type DataStore = {
    data: Data;
    setData: (data: Data) => void;
  };

  function createDataContextWrapper(fetcher: () => Promise<Data>) {
    const StoreContext = createContext<UseStoreHook<DataStore> | null>(null);

    const DataContextWrapper = ({ children }: React.PropsWithChildren) => {
      const [dataStore, setDataStore] = useState<Store<DataStore> | null>(
        () => {
          fetcher().then(data => {
            setDataStore(() => {
              const store = createStore<DataStore>({
                data,
                setData: newData => store.set({ data: newData }),
              });
              return store;
            });
          });
          return null;
        }
      );

      if (!dataStore) {
        return <div>loading...</div>;
      }

      return (
        <StoreContext.Provider value={createUseStore(dataStore)}>
          <dataStore.Provider>{children}</dataStore.Provider>
        </StoreContext.Provider>
      );
    };

    const useDataStore = <T,>(selector: (state: DataStore) => T): T => {
      const ctx = useContext(StoreContext);

      if (!ctx) {
        throw new Error('useDataStore must be used within DataContextWrapper');
      }
      return ctx(selector);
    };

    return { DataContextWrapper, useDataStore };
  }

  test('should handle async store initialization', async () => {
    const expectedData = 'our data';
    const { DataContextWrapper, useDataStore } = createDataContextWrapper(() =>
      Promise.resolve(expectedData)
    );

    const TestComponent = () => {
      const data = useDataStore(state => state.data);
      return <div data-testid="data-view">{data}</div>;
    };

    const { queryByText, getByTestId } = render(
      <DataContextWrapper>
        <TestComponent />
      </DataContextWrapper>
    );

    expect(queryByText('loading...')).toBeTruthy();

    await waitFor(() => {
      expect(queryByText('loading...')).toBeNull();
    });

    const dataElement = getByTestId('data-view');
    expect(dataElement.textContent).toBe(expectedData);
  });

  test('should allow state updates after async initialization', async () => {
    const initialData = 'initial data';
    const updatedData = 'updated data';
    const { DataContextWrapper, useDataStore } = createDataContextWrapper(() =>
      Promise.resolve(initialData)
    );

    const TestComponent = () => {
      const data = useDataStore(state => state.data);
      const setData = useDataStore(state => state.setData);

      return (
        <>
          <div data-testid="data-view">{data}</div>
          <button
            data-testid="update-button"
            onClick={() => setData(updatedData)}
          >
            Update
          </button>
        </>
      );
    };

    const { queryByText, getByTestId } = render(
      <DataContextWrapper>
        <TestComponent />
      </DataContextWrapper>
    );

    await waitFor(() => {
      expect(queryByText('loading...')).toBeNull();
    });

    const dataElement = getByTestId('data-view');
    expect(dataElement.textContent).toBe(initialData);

    const updateButton = getByTestId('update-button');
    fireEvent.click(updateButton);

    expect(dataElement.textContent).toBe(updatedData);
  });
});
