"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface TimeWindow {
  open: string;
  close: string;
}

interface RestaurantStatusData {
  isOpen: boolean;
  useSchedule: boolean;
  manualIsOpen: boolean;
  windows: TimeWindow[];
}

interface RestaurantStatusContextValue {
  isOpen: boolean;
  rawSettings: RestaurantStatusData | null;
  refresh: () => Promise<void>;
}

const RestaurantStatusContext = createContext<RestaurantStatusContextValue>({
  isOpen: true,
  rawSettings: null,
  refresh: async () => {},
});

export function RestaurantStatusProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RestaurantStatusData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/restaurant-status");
      if (res.ok) {
        const json: RestaurantStatusData = await res.json();
        setData({ ...json, windows: json.windows ?? [] });
      }
    } catch {
      // silently fail — default to open
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  return (
    <RestaurantStatusContext.Provider
      value={{
        isOpen: data?.isOpen ?? true,
        rawSettings: data,
        refresh: fetchStatus,
      }}
    >
      {children}
    </RestaurantStatusContext.Provider>
  );
}

export function useRestaurantStatus() {
  return useContext(RestaurantStatusContext);
}
