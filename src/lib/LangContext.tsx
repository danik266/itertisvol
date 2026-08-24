'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'ru' | 'kz';

const STORAGE_KEY = 'ertis_lang';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ru: string, kz: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'kz',
  setLang: () => {},
  t: (ru, kz) => kz,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('kz');

  // Читаем сохранённый язык только после монтирования: на сервере
  // localStorage недоступен, а расхождение сломало бы гидратацию.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'kz') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (ru: string, kz: string) => (lang === 'ru' ? ru : kz);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
