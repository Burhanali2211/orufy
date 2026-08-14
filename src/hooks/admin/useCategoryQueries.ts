import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export const useCategoriesQuery = () => {
  return useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const [{ data: cats, error }, { data: products }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('products').select('category_id'),
      ]);

      

      // Build product count map
      const countMap = (products || []).reduce((acc: Record<string, number>, p: any) => {
        if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
        return acc;
      }, {});

      // Resolve parent names client-side
      return (cats || []).map((c: any) => ({
        ...c,
        parent_name: (cats || []).find((p: any) => p.id === c.parent_id)?.name || null,
        product_count: countMap[c.id] || 0,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCategoryQuery = (id: string | undefined) => {
  return useQuery<Category | null>({
    queryKey: ['admin-category', id],
    queryFn: async () => {
      if (!id) return null;
      const data = await apiClient.get('/categories');
      
      
      return data as Category;
    },
    enabled: !!id,
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const data = await apiClient.post('/categories', category)
        .select()
        .single();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Partial<Category> }) => {
      const data = await apiClient.put(`/categories/${id}`, category)
        .select()
        .single();
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-category', data.id] });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      // Also invalidate products if they might have changed category references
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
};
