'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

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

// ─── CONFETTI HOOK ───────────────────────────────────────────
const CONFETTI_COLORS = [
  '#f43f5e', // rose-500
  '#fb7185', // rose-400
  '#ec4899', // pink-500
  '#f472b6', // pink-400
  '#d946ef', // fuchsia-500
  '#eab308', // yellow-500 (gold)
  '#facc15', // yellow-400 (gold light)
];

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'rect' | 'triangle';
  delay: number;
  duration: number;
}

export function useConfetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const fire = useCallback(() => {
    const newParticles: ConfettiParticle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -(Math.random() * 20 + 5),
      rotation: Math.random() * 360,
      scale: Math.random() * 0.6 + 0.4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: (['circle', 'rect', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      delay: Math.random() * 0.4,
      duration: Math.random() * 1.5 + 2,
    }));
    setParticles(newParticles);
    setIsAnimating(true);
    // Auto-cleanup after animation
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 4500);
  }, []);

  const confettiElement = useMemo(() => {
    if (!isAnimating || particles.length === 0) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            }}
          >
            {p.shape === 'circle' && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                }}
              />
            )}
            {p.shape === 'rect' && (
              <div
                style={{
                  width: 8,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: p.color,
                }}
              />
            )}
            {p.shape === 'triangle' && (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: `10px solid ${p.color}`,
                }}
              />
            )}
          </div>
        ))}
        <style>{`
          @keyframes confetti-fall {
            0% {
              opacity: 1;
              transform: translateY(0) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg);
            }
          }
        `}</style>
      </div>
    );
  }, [isAnimating, particles]);

  return { fire, confettiElement };
}
