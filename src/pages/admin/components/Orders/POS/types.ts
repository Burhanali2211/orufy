export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  sku: string;
}

export interface CartItem extends Product {
  quantity: number;
}
