"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface RefreshContextType {
  /** Increments every time data changes — components can watch this to refetch */
  refreshKey: number;
  /** Call this after any mutation (add/edit/delete transaction, wallet, etc.) */
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => useContext(RefreshContext);
