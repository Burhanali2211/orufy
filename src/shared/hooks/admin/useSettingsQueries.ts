import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// --- Site Settings ---
export const useSiteSettingsQuery = () => {
  return useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const data = await apiClient.get('/admin/settings/site');
      
      return data;
    },
  });
};

export const useUpdateSiteSettingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: any) => {
      await apiClient.post('/admin/settings/site', setting);
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
    },
  });
};

// --- Social Media ---
export const useSocialAccountsQuery = () => {
  return useQuery({
    queryKey: ['admin-social-accounts'],
    queryFn: async () => {
      const data = await apiClient.get('/admin/settings/social');
      
      return data;
    },
  });
};

export const useUpdateSocialAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiClient.put(`/admin/settings/social/${id}`, data);
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-accounts'] });
    },
  });
};

export const useUpsertSocialAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: any) => {
      const { id, ...data } = account;
      if (id) {
        await apiClient.put(`/admin/settings/social/${id}`, data);
        
      } else {
        await apiClient.post('/admin/settings/social', data);
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-accounts'] });
    },
  });
};

export const useDeleteSocialAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/settings/social/${id}`);
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-accounts'] });
    },
  });
};

export const useDeleteSocialAccountsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post('/admin/settings/social/batch-delete', { ids: ids });
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-accounts'] });
    },
  });
};

// --- Footer Links ---
export const useFooterLinksQuery = () => {
  return useQuery({
    queryKey: ['admin-footer-links'],
    queryFn: async () => {
      const data = await apiClient.get('/admin/settings/footer');
      
      return data;
    },
  });
};

// --- Contact Info ---
export const useContactInfoQuery = () => {
  return useQuery({
    queryKey: ['admin-contact-info'],
    queryFn: async () => {
      const data = await apiClient.get('/admin/settings/contact');
      
      return data;
    },
  });
};
