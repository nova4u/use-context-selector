# use-context-selector

A lightweight React library for creating context with fine-grained selector-based subscriptions, preventing unnecessary re-renders.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Performance Benefits](#performance-benefits)
- [API Reference](#api-reference)
  - [createStore](#createStorestateinitialvalue)
  - [createUseStore](#createUseStorestore)
  - [useStoreSelector](#useStoreSelectorcontext-selector-equalityfn)
  - [InferState](#inferstatet)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [TypeScript Support](#typescript-support)
- [Comparison with Other Solutions](#comparison-with-other-solutions)
- [Requirements](#requirements)

## Features

- 🎯 **Selector-based subscriptions** - Components only re-render when their selected values change
- ⚡ **Performance optimized** - Efficient updates with minimal re-renders
- 🔒 **Type-safe** - Full TypeScript support with type inference
- 🪶 **Lightweight** - Minimal dependencies, small bundle size
- 🎨 **Simple API** - Easy to use with familiar React patterns
- 🛠️ **Custom equality functions** - Use built-in `shallow` or any custom equality function (e.g., `zustand/shallow`)

## Installation

```bash
pnpm add @dmrk/use-context-selector
```

## Quick Start

```tsx
import { createStore, createUseStore } from '@dmrk/use-context-selector';

// 1. Create your store
const store = createStore({
  count: 0,
  name: 'John',
});

// 2. Create a custom hook (optional but recommended)
const useStore = createUseStore(store);

// 3. Wrap your app with the Provider
function App() {
  return (
    <store.Provider>
      <Counter />
      <Name />
    </store.Provider>
  );
}

// 4. Use selectors in your components
function Counter() {
  const count = useStore(state => state.count);
  // ✅ Only re-renders when count changes
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.set({ count: count + 1 })}>Increment</button>
    </div>
  );
}

function Name() {
  const name = useStore(state => state.name);
  // ✅ Only re-renders when name changes
  return <p>Name: {name}</p>;
}

// When you update count:
store.set({ count: 1 });
// ✅ Only Counter re-renders, Name does not!
```

**Note:** For non-primitive selectors (objects/arrays), use a custom equality function like `shallow` or `zustand/shallow` to prevent unnecessary re-renders.

## API Reference

### `createStore<State>(initialValue)`

Creates a new context store with the given initial state.

**Parameters:**

- `initialValue`: The initial state object

**Returns:**
An object containing:

- `Provider`: React component to wrap your app
- `context`: The React context (for advanced usage)
- `get()`: Function to get current state
- `set(partial | updater)`: Function to update state. Accepts either:
  - A partial state object: `set({ count: 10 })`
  - An updater function: `set((state) => ({ count: state.count + 1 }))`
- `subscribe()`: Function to subscribe to state changes (for advanced usage)

**Example:**

```tsx
const store = createStore({
  user: { name: 'Alice', age: 25 },
  theme: 'dark',
});

// Update with object
store.set({ theme: 'light' });

// Update with function (useful when update depends on current state)
store.set(state => ({
  user: { ...state.user, age: state.user.age + 1 },
}));
```

### `createUseStore(store)`

Creates a custom hook for the given store with a cleaner API.

**Parameters:**

- `store`: A store created by `createStore`

**Returns:**
A hook function that accepts:

- `selector`: Function to select a value from state
- `equalityFn` (optional): Custom equality function. Defaults to `Object.is`. Use `shallow` or `zustand/shallow` for objects/arrays.

**Example:**

```tsx
import shallow from '@dmrk/use-context-selector/shallow';

const useStore = createUseStore(store);

function MyComponent() {
  const userName = useStore(state => state.user.name);
  const user = useStore(state => state.user, shallow);
  return <div>{userName}</div>;
}
```

### `useStoreSelector(context, selector, equalityFn?)`

Low-level hook for using context with selectors. Use `createUseStore` for a better API.

**Parameters:**

- `context`: The React context from the store
- `selector`: Function to select a value from state
- `equalityFn` (optional): Custom equality function. Defaults to `Object.is`.

**Returns:**
The selected value

**Example:**

```tsx
import shallow from '@dmrk/use-context-selector/shallow';

function MyComponent() {
  const count = useStoreSelector(store.context, state => state.count);
  const user = useStoreSelector(store.context, state => state.user, shallow);
  return <div>{count}</div>;
}
```

### `InferState<T>`

Type utility to extract the State type from a store instance.

```tsx
import type { InferState } from '@dmrk/use-context-selector';

const store = createStore({ count: 0, name: 'John' });
type StoreState = InferState<typeof store>; // { count: number; name: string }
```

## Advanced Usage

### Derived Values

You can compute derived values in your selectors:

```tsx
const useStore = createUseStore(store);

function DoubledCounter() {
  const doubled = useStore(state => state.count * 2);
  return <div>Doubled: {doubled}</div>;
}
```

### Complex Selectors

Select nested values or combine multiple values:

```tsx
const store = createStore({
  user: { name: 'Alice', age: 25 },
  settings: { theme: 'dark', language: 'en' },
});

const useStore = createUseStore(store);

function UserInfo() {
  const userAge = useStore(state => state.user.age);
  const theme = useStore(state => state.settings.theme);

  return <div className={theme}>User age: {userAge}</div>;
}
```

### Updating State

The `set` method accepts either a partial state object or an updater function:

```tsx
// Partial updates
store.set({ count: 10 });

// Function form (recommended when update depends on current state)
store.set(state => ({ count: state.count + 1 }));

// Update from component
function UpdateButton() {
  const count = useStore(state => state.count);
  return (
    <button onClick={() => store.set(state => ({ count: state.count + 1 }))}>
      Increment
    </button>
  );
}
```

### Direct State Access

Access state directly without subscribing:

```tsx
// Get current state
const currentState = store.get();

// Useful for event handlers or effects
function handleClick() {
  const current = store.get();
  console.log('Current count:', current.count);
  store.set({ count: current.count + 1 });
}
```

## Best Practices

- **Use equality functions for non-primitive selectors**: When selecting objects or arrays, use `shallow` or `zustand/shallow` to prevent unnecessary re-renders.
- **Select specific values when possible**: Prefer selecting individual fields over entire objects when you only need a few values.

## Common Pitfalls

- **Returning new objects/arrays without equality function**: Selectors that return new references cause unnecessary re-renders. Use `shallow` or select individual values.

## TypeScript Support

Full type inference and type safety:

```tsx
const store = createStore({
  user: { name: 'Alice', age: 25 },
  count: 0,
});

const useStore = createUseStore(store);

function MyComponent() {
  // ✅ TypeScript infers return types
  const userName = useStore(state => state.user.name); // string
  const count = useStore(state => state.count); // number

  // ❌ TypeScript error - invalid property
  // const invalid = useStore(state => state.invalid);

  return <div>{userName}</div>;
}
```

Use `InferState<T>` to extract the state type from a store instance.

## Comparison with Other Solutions

### vs React Context + useContext

**Standard Context:**

- ❌ All consumers re-render on any state change
- ❌ Requires manual optimization with useMemo/memo
- ✅ Built into React

**use-context-selector:**

- ✅ Only re-renders when selected values change
- ✅ Automatic optimization
- ✅ Simpler API for complex state

### vs Zustand

**Zustand:**

- ✅ More features (middleware, devtools, etc.)
- ✅ Can be used outside React
- ❌ Larger bundle size
- ❌ More complex API

**use-context-selector:**

- ✅ Smaller bundle size
- ✅ Simpler API
- ✅ Better for React-only projects
- ✅ Uses React Context (familiar pattern)
- ❌ Fewer features (for now)

## Requirements

- React 18.0.0 or higher

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

dmrk
