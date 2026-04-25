import { useState, useCallback } from 'react';

export function usePasswordVisibility() {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return { showPassword, togglePasswordVisibility };
}

export function useMultiplePasswordVisibility(fields: number = 2) {
  const [visibility, setVisibility] = useState<Record<number, boolean>>({});

  const toggleField = useCallback((index: number) => {
    setVisibility(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const getVisibility = (index: number) => visibility[index] ?? false;

  return { getVisibility, toggleField };
}
