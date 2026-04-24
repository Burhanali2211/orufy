import { useState, useEffect } from 'react';

export interface ShopSettings {
  name: string;
  slug: string;
  plan: string;
  settings: {
    bannerUrl?: string;
    logo?: string;
    primaryColor?: string;
    [key: string]: unknown;
  };
}

export function useShopSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/shop/settings')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load shop settings');
        return r.json() as Promise<ShopSettings | { data: ShopSettings }>;
      })
      .then(res => {
        const data = 'data' in res ? res.data : res;
        setSettings(data);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading, error };
}
