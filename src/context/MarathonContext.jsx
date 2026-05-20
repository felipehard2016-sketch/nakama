import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const MarathonContext = createContext(null);

export function MarathonProvider({ children }) {
  const [session, setSession] = useState(null); // { animeId, animeTitle, cover, startEp }
  const [elapsedSec, setElapsedSec] = useState(0);
  const [epsThisSession, setEpsThisSession] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused]   = useState(false);
  const intervalRef = useRef(null);

  /* Timer */
  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, paused]);

  const startMarathon = useCallback((animeId, animeTitle, cover, startEp = 0) => {
    setSession({ animeId, animeTitle, cover, startEp });
    setElapsedSec(0);
    setEpsThisSession(0);
    setRunning(true);
    setPaused(false);
  }, []);

  const stopMarathon = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setSession(null);
    setElapsedSec(0);
    setEpsThisSession(0);
  }, []);

  const togglePause = useCallback(() => setPaused(p => !p), []);

  const incrementEp = useCallback(() => setEpsThisSession(e => e + 1), []);

  return (
    <MarathonContext.Provider value={{ session, elapsedSec, epsThisSession, running, paused, startMarathon, stopMarathon, togglePause, incrementEp }}>
      {children}
    </MarathonContext.Provider>
  );
}

export function useMarathon() {
  const ctx = useContext(MarathonContext);
  if (!ctx) throw new Error('useMarathon must be used inside MarathonProvider');
  return ctx;
}
