"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANDING_CONTENT,
  LANDING_CONTENT_LANGUAGES,
  type LandingContent,
  type LandingContentLanguage,
} from "@/lib/marketing/landing-content";

const STORAGE_KEY = "landing-content-language";

type LandingLanguageContextValue = {
  language: LandingContentLanguage;
  setLanguage: (language: LandingContentLanguage) => void;
  content: LandingContent;
};

const LandingLanguageContext = createContext<LandingLanguageContextValue | null>(null);

function readStoredLanguage(): LandingContentLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANDING_CONTENT_LANGUAGES.includes(stored as LandingContentLanguage)) {
      return stored as LandingContentLanguage;
    }
  } catch {
    // ignore
  }
  return "en";
}

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LandingContentLanguage>("en");

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  const setLanguage = useCallback((next: LandingContentLanguage) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    document.documentElement.lang = next === "am" ? "am" : "en";
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "am" ? "am" : "en";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      content: LANDING_CONTENT[language],
    }),
    [language, setLanguage]
  );

  return (
    <LandingLanguageContext.Provider value={value}>{children}</LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage() {
  const context = useContext(LandingLanguageContext);
  if (!context) {
    throw new Error("useLandingLanguage must be used within LandingLanguageProvider");
  }
  return context;
}
