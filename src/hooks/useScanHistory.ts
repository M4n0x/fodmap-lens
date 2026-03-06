import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getScanHistory, addScanHistoryItem, clearScanHistory } from '@/src/db/queries';
import type { ScanHistoryItem } from '@/src/types/product';

export function useScanHistory() {
  const db = useSQLiteContext();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getScanHistory(db);
      setHistory(items);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item: Omit<ScanHistoryItem, 'id'>) => {
      await addScanHistoryItem(db, item);
      await refresh();
    },
    [db, refresh]
  );

  const clearAll = useCallback(async () => {
    await clearScanHistory(db);
    setHistory([]);
  }, [db]);

  return { history, isLoading, refresh, addItem, clearAll };
}
