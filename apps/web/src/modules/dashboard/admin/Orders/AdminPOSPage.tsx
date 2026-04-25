import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  Banknote,
  ShoppingCart,
  X,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminLayout } from '../Layout/AdminLayout';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  sku: string;
}

interface CartItem extends Product {
  quantity: number;
}

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

  useEffect(() => {
    if (search.length >= 2) {
      fetchProducts();
    }
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/dashboard/products', {
        search,
        limit: '10'
      });

      if (response.success) {
        setProducts(response.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock ?? 0,
          images: p.images || [],
          sku: p.sku || ''
        })));
      }
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
    if (!customer.name || !customer.phone) {
      showError('Customer name and phone are required');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        customerName: customer.name,
        customerEmail: customer.email || undefined,
        customerPhone: customer.phone,
        shippingAddress: {
          address: 'POS Order',
          city: 'In-Store',
          state: 'In-Store',
          pincode: '000000',
          type: 'home'
        },
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod.toLowerCase(),
        discountAmount: discount
      };

      const response = await apiClient.post<{ success: boolean; data: any; error?: string }>('/shop/orders', payload);

      if (response.success) {
        showSuccess('Order created successfully');
        setSuccessOrder({
          id: response.data.id,
          order_number: response.data.orderNumber,
          total_amount: response.data.totalAmount,
          payment_method: paymentMethod
        });
        setCart([]);
        setCustomer({ name: '', email: '', phone: '' });
        setDiscount(0);
      } else {
        throw new Error(response.error || 'Failed to create order');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h2>
            <p className="text-gray-500 mb-6">Order #{successOrder.order_number} has been created and marked as paid.</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-gray-900">₹{Number(successOrder.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment:</span>
                <span className="font-medium text-gray-900">{successOrder.payment_method}</span>
              </div>
            </div>

            <button 
              onClick={() => setSuccessOrder(null)}
              className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
            >
              Create New Order
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Product Search & Selection */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale (POS)</h1>
              <p className="text-gray-500">Quickly create manual orders for customers</p>
            </header>

            {/* Search Bar */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-lg"
              />
              
              {/* Search Results Dropdown */}
              {products.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <img src={product.images[0] || '/placeholder.png'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">₹{Number(product.price).toLocaleString()}</p>
                        <p className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                  Order Items
                </h3>
                <span className="text-sm font-medium text-gray-500">{cart.length} items</span>
              </div>
              <div className="divide-y divide-gray-100">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div key={item.id} className="p-6 flex items-center gap-6">
                      <img src={item.images[0] || '/placeholder.png'} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-amber-600 font-semibold mt-1">₹{Number(item.price).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-bold text-gray-900">₹{Number(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">Cart is empty. Search products to add.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Customer */}
        <div className="w-full lg:w-[400px] bg-white border-l border-gray-100 p-6 flex flex-col shadow-2xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            Customer Details
          </h3>
          
          <div className="space-y-4 mb-8">
            <input
              type="text"
              placeholder="Customer Name"
              value={customer.name}
              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={customer.email}
              onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customer.phone}
              onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            Payment Method
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-8">
            {['Cash', 'Card', 'UPI', 'Other'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  paymentMethod === method 
                    ? 'border-amber-600 bg-amber-50 text-amber-700 font-bold' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mb-6">
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">-₹</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(subtotal, parseInt(e.target.value) || 0))}
                    className="w-20 text-right bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-amber-600">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-amber-200 active:scale-[0.98]"
          >
            {submitting ? 'Creating Order...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};
