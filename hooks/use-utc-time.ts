import { useEffect, useState } from 'react';
import { formatUtc } from '@/lib/date';

export function useUtcTime() {
  const [utcString, setUtcString] = useState(() => formatUtc(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcString(formatUtc(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return utcString;
}
