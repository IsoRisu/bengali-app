import { useState, useEffect } from 'preact/hooks';

export function useStore(get, subscribe) {
  const [state, setState] = useState(get);

  useEffect(() => {
    setState(get());
    return subscribe(() => {
      setState(get());
    });
  }, [get, subscribe]);

  return state;
}