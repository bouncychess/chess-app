import { useState } from "react";

interface UseLocalStorageOptions<T> {
  key: string;
  defaultValue: T;
  serialize: (v: T) => string;
  deserialize: (s: string) => T | undefined;
}

export function useLocalStorage<T>({ key, defaultValue, serialize, deserialize }: UseLocalStorageOptions<T>): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = deserialize(saved);
      if (parsed !== undefined) return parsed;
    }
    return defaultValue;
  });

  const set = (v: T) => {
    setValue(v);
    localStorage.setItem(key, serialize(v));
  };

  return [value, set];
}
