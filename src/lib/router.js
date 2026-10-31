import { useEffect, useState } from 'preact/hooks';

// Hash routing: "#/letters/ka" -> ["letters", "ka"]
const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

export function useHashRoute() {
  const [segments, setSegments] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setSegments(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return segments;
}
