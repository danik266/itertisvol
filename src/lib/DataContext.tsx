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
}

const DataContext = createContext<DataContextType>({
  directions: [],
  loadingDirs: true,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [directions, setDirections] = useState<DirectionData[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(true);

  useEffect(() => {
    fetch('/api/directions')
      .then(res => res.json())
      .then(data => {
        if (data.directions) {
          setDirections(data.directions);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDirs(false));
  }, []);

  return (
    <DataContext.Provider value={{ directions, loadingDirs }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
