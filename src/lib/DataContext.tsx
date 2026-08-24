'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export interface DirectionData {
  id: string;
  icon: string;
  color: string;
  bg: string;
  labelRu: string;
  labelKz: string;
  descRu: string;
  descKz: string;
  tagsRu: string[];
  tagsKz: string[];
  image?: string;
  _id?: string;
}

interface DataContextType {
  directions: DirectionData[];
  loadingDirs: boolean;
  errorDirs: boolean;
}

const DataContext = createContext<DataContextType>({
  directions: [],
  loadingDirs: true,
  errorDirs: false,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [directions, setDirections] = useState<DirectionData[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(true);
  const [errorDirs, setErrorDirs] = useState(false);

  useEffect(() => {
    fetch('/api/directions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load directions');
        return res.json();
      })
      .then(data => {
        setDirections(data.directions || []);
      })
      .catch(err => {
        console.error(err);
        setErrorDirs(true);
      })
      .finally(() => setLoadingDirs(false));
  }, []);

  return (
    <DataContext.Provider value={{ directions, loadingDirs, errorDirs }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
