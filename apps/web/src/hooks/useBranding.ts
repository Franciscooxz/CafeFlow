'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useBrandStore, type Branding } from '@/store/brand.store';

const BRANDING_KEY = ['branding'];

/** Trae la marca del negocio y la sincroniza con el store (que aplica las variables CSS). */
export function useBranding() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setBranding = useBrandStore((s) => s.setBranding);

  const query = useQuery({
    queryKey: BRANDING_KEY,
    queryFn: async () => {
      const { data } = await api.get('/tenants/me/branding');
      return data.data as Branding;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) setBranding(query.data);
  }, [query.data, setBranding]);

  return query;
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Pick<Branding, 'brandColor' | 'logoUrl'>>) => {
      const { data } = await api.put('/tenants/me/branding', body);
      return data.data as Branding;
    },
    onSuccess: (branding) => qc.setQueryData(BRANDING_KEY, branding),
  });
}
