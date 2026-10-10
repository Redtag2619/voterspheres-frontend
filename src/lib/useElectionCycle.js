import {useEffect, useState} from 'react';
import {initialCycle} from './electionCycleOptions.js';
export function useElectionCycle(key) {
  const [cycle, setCycle] = useState(() => initialCycle(key, {historical:true}));
  useEffect(() => { try { localStorage.setItem('vs-cycle:' + key, String(cycle)); } catch {} }, [key, cycle]);
  return [cycle, setCycle];
}
