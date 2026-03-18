'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ru' | 'kz';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ru: string, kz: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'ru',
  setLang: () => {},
  t: (ru) => ru,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru');
  const t = (ru: string, kz: string) => lang === 'ru' ? ru : kz;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
