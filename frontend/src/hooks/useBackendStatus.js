import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Polls the backend health every 30 s.
 * Returns 'online' | 'offline' | 'checking'
 */
export function useBackendStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        await api.get('/health', { timeout: 3000 });
        if (mounted) setStatus('online');
      } catch {
        // Try /sectors as fallback ping
        try {
          await api.get('/sectors', { timeout: 3000 });
          if (mounted) setStatus('online');
        } catch {
          if (mounted) setStatus('offline');
        }
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return status;
}
