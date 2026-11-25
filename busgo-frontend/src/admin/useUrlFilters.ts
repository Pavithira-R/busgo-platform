import { useSearchParams } from 'react-router';

/**
 * Reads and updates list filters kept in the URL (so they survive reloads
 * and the back button). Changing a filter goes back to page 1.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const get = (key: string) => params.get(key) ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const set = (changes: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          if (value && !(key === 'page' && value === '1')) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  return { get, page, set };
}
