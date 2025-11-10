import {
  createContext,
  createElement,
  useContext,
  useRef,
  useSyncExternalStore,
} from 'react';

export type InferState<Z> =
  Z extends ReturnType<typeof createStore<infer S>> ? S : never;

type SelectorFn<State, SelectedState> = (state: State) => SelectedState;
type Store<State> = {
  get: () => State;
  set: (partial: Partial<State> | ((state: State) => Partial<State>)) => void;
  subscribe: <Selector>(
    callback: () => void,
    selector: SelectorFn<State, Selector>,
    equalityFn?: EqualityFn<State>
  ) => () => void;
  context: React.Context<Store<State> | null>;
  Provider: ({ children }: React.PropsWithChildren) => React.JSX.Element;
  $version: number;
};

type EqualityFn<T> = (a: T, b: T) => boolean;
type Entry<State> = {
  callback: () => void;
  selector: SelectorFn<State, any>;
  equalityFn: EqualityFn<State>;
};

export function createUseStore<State>(store: Store<State>) {
  return <Selector>(
    selector: SelectorFn<State, Selector>,
    equalityFn?: EqualityFn<State>
  ) => useStoreSelector(store.context, selector, equalityFn);
}

function createStore<State>(initialValue: State): Store<State> {
  let value = initialValue;
  const listeners = new Set<Entry<State>>();
  const ctx = createContext<Store<State> | null>(null);

  const set: Store<State>['set'] = nextState => {
    const update =
      typeof nextState === 'function' ? nextState(value) : nextState;

    const newState = { ...value, ...update };
    const updateQueue: Entry<State>['callback'][] = [];

    listeners.forEach(entry => {
      if (!entry.equalityFn(entry.selector(newState), entry.selector(value)))
        updateQueue.push(entry.callback);
    });

    value = newState;
    if (updateQueue.length) {
      store.$version++ && updateQueue.forEach(cb => cb());
    }
  };

  const get: Store<State>['get'] = () => {
    return value;
  };

  const subscribe: Store<State>['subscribe'] = (
    callback,
    selector,
    equalityFn = Object.is
  ) => {
    const entry = {
      callback,
      selector,
      equalityFn,
    };
    listeners.add(entry);
    return () => listeners.delete(entry);
  };

  const store = {
    subscribe,
    set,
    get,
    context: ctx,
    Provider: ({ children }: React.PropsWithChildren) =>
      createElement(ctx.Provider, { value: store }, children),
    $version: 1,
  };

  return store;
}

function applySelector<State, SelectedState>(
  store: Store<State>,
  selector?: SelectorFn<State, SelectedState>
): SelectedState | State {
  return selector ? selector(store.get()) : store.get();
}

function useStoreSelector<State, SelectedState>(
  context: Store<State>['context'],
  selector: SelectorFn<State, SelectedState>,
  equalityFn?: EqualityFn<State>
): SelectedState;

function useStoreSelector<State, SelectedState>(
  context: Store<State>['context'],
  selector: SelectorFn<State, SelectedState>,
  equalityFn?: EqualityFn<State>
): SelectedState | State {
  const store = useContext(context);

  if (!store) {
    throw new Error('useStoreSelector must be used within a Provider');
  }

  const lastSnapshotRef = useRef(applySelector(store, selector));
  const lastVersionRef = useRef(store.$version);

  return useSyncExternalStore(
    listener => store.subscribe(listener, selector, equalityFn),
    () => {
      const nextSnapshot = applySelector(store, selector);
      const currentVersion = store.$version;

      if (lastVersionRef.current === currentVersion) {
        return lastSnapshotRef.current;
      }

      lastSnapshotRef.current = nextSnapshot;
      lastVersionRef.current = currentVersion;
      return nextSnapshot;
    }
  );
}

export { useStoreSelector, createStore };
