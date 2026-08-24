"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { SaveStatus } from "@/hooks/use-canvas-autosave";

interface SaveContextType {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (date: Date | null) => void;
  registerSaveHandler: (handler: () => Promise<boolean>) => void;
  triggerSave: () => Promise<boolean>;
}

const SaveContext = createContext<SaveContextType>({
  saveStatus: "idle",
  lastSavedAt: null,
  setSaveStatus: () => {},
  setLastSavedAt: () => {},
  registerSaveHandler: () => {},
  triggerSave: async () => false,
});

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);

  const registerSaveHandler = useCallback((handler: () => Promise<boolean>) => {
    saveHandlerRef.current = handler;
  }, []);

  const triggerSave = useCallback(async () => {
    if (saveHandlerRef.current) {
      return await saveHandlerRef.current();
    }
    return false;
  }, []);

  return (
    <SaveContext.Provider
      value={{
        saveStatus,
        lastSavedAt,
        setSaveStatus,
        setLastSavedAt,
        registerSaveHandler,
        triggerSave,
      }}
    >
      {children}
    </SaveContext.Provider>
  );
}

export function useSaveContext() {
  return useContext(SaveContext);
}
