"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PrivacyContextType {
  isHidden: boolean;
  toggleHidden: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isHidden: false,
  toggleHidden: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      const stored = localStorage.getItem("cuan-privacy-mode");
      setIsHidden(stored !== "false");
    }, 0);
  }, []);

  const toggleHidden = () => {
    setIsHidden((prev) => {
      localStorage.setItem("cuan-privacy-mode", String(!prev));
      return !prev;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isHidden, toggleHidden }}>
      {isMounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);

// Utility for masking amounts
export const maskAmount = (amount: number | string | undefined, isHidden: boolean, prefix = "") => {
  if (amount === undefined || amount === null) return "";
  if (isHidden) return `${prefix}••••••`;
  // if amount is a number, we format it, if it's already a string, we assume it's formatted
  if (typeof amount === "number") {
    return `${prefix}${amount.toLocaleString("id-ID", { maximumFractionDigits: 10 })}`;
  }
  return `${prefix}${amount}`;
};
