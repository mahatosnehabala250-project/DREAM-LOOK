'use client';

import React, { useState, useEffect, useCallback } from 'react';

export function useFetch<T>(url: string | null, options?: RequestInit) {
  type FetchState = { data: T | null; loading: boolean; error: string | null };
  type FetchAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: T }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'SET_NO_URL' };

  const [state, dispatch] = React.useReducer(
    (prev: FetchState, action: FetchAction): FetchState => {
      switch (action.type) {
        case 'FETCH_START': return { ...prev, loading: true, error: null };
        case 'FETCH_SUCCESS': return { data: action.payload, loading: false, error: null };
        case 'FETCH_ERROR': return { data: null, loading: false, error: action.payload };
        case 'SET_NO_URL': return { data: null, loading: false, error: null };
      }
    },
    { data: null, loading: true, error: null }
  );

  useEffect(() => {
    if (!url) { dispatch({ type: 'SET_NO_URL' }); return; }
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    fetch(url, options)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: e.message }); });
    return () => { cancelled = true; };
  }, [url]);

  const refetch = useCallback(() => {
    if (!url) return;
    dispatch({ type: 'FETCH_START' });
    fetch(url, options)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { dispatch({ type: 'FETCH_ERROR', payload: e.message }); });
  }, [url, options]);

  return { ...state, refetch };
}

export function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  return value;
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0] || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}
