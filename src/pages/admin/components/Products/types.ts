export interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | null;
  sku: string;
  category: string;
  category_id: string;
  brand: string;
  dimensions: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
  color_variants: string[];
  size_variants: string[];
  shipping_info: {
    free_shipping: boolean;
    shipping_class: string;
  };
  seo_keywords: string[];
  seo_title: string;
  seo_description: string;
  gallery_images: string[];
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  discount_percentage: number;
  tags: string[];
  inventory_quantity: number;
  inventory_policy: string;
  track_inventory: boolean;
  stock_quantity: number;
  status: 'draft' | 'published' | 'out_of_stock';
  weight_g: number | null;
  meta_title: string;
  meta_description: string;
  model: string;
  barcode: string;
  featured_image_url: string;
  video_url: string;
  compare_at_price: number | null;
  cost_price: number | null;
}

export const initialProductData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  sale_price: null,
  sku: '',
  category: '',
  category_id: '',
  brand: '',
  dimensions: { length: null, width: null, height: null },
  color_variants: [],
  size_variants: [],
  shipping_info: { free_shipping: false, shipping_class: 'standard' },
  seo_keywords: [],
  seo_title: '',
  seo_description: '',
  gallery_images: [],
  images: [],
  is_active: true,
  is_featured: false,
  is_bestseller: false,
  is_new_arrival: false,
  discount_percentage: 0,
  tags: [],
  inventory_quantity: 0,
  inventory_policy: 'deny',
  track_inventory: true,
  stock_quantity: 0,
  status: 'draft',
  weight_g: null,
  meta_title: '',
  meta_description: '',
  model: '',
  barcode: '',
  featured_image_url: '',
  video_url: '',
  compare_at_price: null,
  cost_price: null,
};
