import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { AdminLayout } from './layout/AdminLayout';

// Modular Components
import { POSProductSearch } from './components/Orders/POS/POSProductSearch';
import { POSCart } from './components/Orders/POS/POSCart';
import { POSSidebar } from './components/Orders/POS/POSSidebar';
import { POSSuccessView } from './components/Orders/POS/POSSuccessView';
import { Product, CartItem } from './components/Orders/POS/types';

export const AdminPOSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    if (search.length >= 2) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/products');
      
      setProducts((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock: p.stock ?? 0,
        images: p.images || [],
        sku: p.sku || ''
      })));
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showError('Product is out of stock');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showError('Cannot add more than available stock');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearch('');
    setProducts([]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) {
          showError('Cannot exceed available stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const userId = user?.id;
    if (!userId) {
      showError('Please log in to create orders');
      return;
    }

    try {
      setSubmitting(true);
      const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const shippingAddress = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      };

      const { data: order, error: orderError } = await apiClient.post('/orders', [{
          user_id: userId,
          order_number: orderNumber,
          total_amount: total,
          subtotal,
          tax_amount: 0,
          shipping_amount: 0,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          billing_address: shippingAddress
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await apiClient.post('/order-items', orderItems);
      if (itemsError) throw itemsError;

      showSuccess('Order created successfully');
      setSuccessOrder({ id: order.id, order_number: orderNumber, total_amount: total, payment_method: paymentMethod });
      setCart([]);
      setCustomer({ name: '', email: '', phone: '' });
      setDiscount(0);
    } catch (error: any) {
      showError(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      {successOrder ? (
        <POSSuccessView 
          successOrder={successOrder} 
          onNewOrder={() => setSuccessOrder(null)} 
        />
      ) : (
        <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side: Product Search & Selection */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Point of Sale (POS)</h1>
                <p className="text-gray-500">Quickly create manual orders for customers</p>
              </header>

              <POSProductSearch 
                search={search}
                setSearch={setSearch}
                products={products}
                addToCart={addToCart}
                loading={loading}
              />

              <POSCart 
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
            </div>
          </div>

          <POSSidebar 
            customer={customer}
            setCustomer={setCustomer}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            subtotal={subtotal}
            discount={discount}
            setDiscount={setDiscount}
            total={total}
            handleCheckout={handleCheckout}
            submitting={submitting}
            cartLength={cart.length}
          />
        </div>
      )}
    </AdminLayout>
  );
};

