'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    const newObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
        }
      });
    }, {
      rootMargin: '100px', // Start loading when 100px away from bottom
      ...options,
    });

    setObserver(newObserver);

    return () => {
      newObserver.disconnect();
    };
  }, [callback, options]);

  return observer;
} 