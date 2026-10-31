import { useState, useEffect } from 'preact/hooks';

function getSegments() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash ? hash.split('/').filter(Boolean) : [];
}

export function useHashRoute() {
  const [segments, setSegments] = useState(getSegments);

  useEffect(() => {
    const onHashChange = () => {
      setSegments(getSegments());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return segments;
}