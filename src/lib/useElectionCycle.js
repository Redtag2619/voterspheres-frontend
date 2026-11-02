import {useEffect, useState, useCallback} from 'react';
import {initialCycle} from './electionCycleOptions.js';
import {useOptionalWorkflowScope} from '../context/WorkflowScopeContext.jsx';
export function useElectionCycle(key) {
  const [localCycle, setLocalCycle] = useState(() => initialCycle(key, {historical:true}));
  const workflow = useOptionalWorkflowScope();
  const cycle = workflow?.scope.cycle || localCycle;
  const updateScope = workflow?.updateScope;
  useEffect(() => {
    if (updateScope && !workflow.scope.cycle) updateScope({cycle: localCycle});
  }, [updateScope, workflow?.scope.cycle, localCycle]);
  useEffect(() => { try { localStorage.setItem('vs-cycle:' + key, String(cycle)); } catch {} }, [key, cycle]);
  const setCycle = useCallback(value => {
    setLocalCycle(value);
    updateScope?.({cycle: value, candidate_id: ""});
  }, [updateScope]);
  return [cycle, setCycle];
}
