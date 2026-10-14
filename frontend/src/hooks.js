import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

// Charge une URL de l'API et expose { data, loading, error, reload, setData }
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await api(path);
      setState({ data, loading: false, error: '' });
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: load, setData };
}

// Offres sauvegardées par le candidat (stockées dans le navigateur, par utilisateur)
export function useSavedJobs() {
  const { user } = useAuth();
  const key = `savedJobs:${user?.id}`;
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(ids));
  }, [ids, key]);

  const isSaved = (id) => ids.includes(String(id));
  const toggle = (id) => {
    const value = String(id);
    setIds((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };
  return { ids, isSaved, toggle };
}
