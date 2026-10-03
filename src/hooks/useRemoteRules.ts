import { useEffect } from 'react';
import { fetchRules } from '../services/api/scamService';
import { setRemoteRules } from '../services/engine/localEngine';
import { useConfigStore } from '../store/useConfigStore';

// P2 OTA: refresh offline rules on launch when in auto mode. Silent failure keeps bundled rules.
export const useRemoteRules = () => {
  const engineMode = useConfigStore((state) => state.engineMode);
  useEffect(() => {
    if (engineMode !== 'auto') return;
    fetchRules()
      .then((remote) => setRemoteRules(remote))
      .catch(() => {});
  }, [engineMode]);
};
