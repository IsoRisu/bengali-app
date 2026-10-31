import { useEffect, useState } from 'preact/hooks';

// Subscribe a component to a store that exposes get() and subscribe(fn).
export function useStore(get, subscribe) {
  const [value, setValue] = useState(get);
  useEffect(() => {
    setValue(get()); // catch changes made between first render and subscribe
    return subscribe(() => setValue(get()));
  }, []);
  return value;
}
