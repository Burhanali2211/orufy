import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefrontCart } from '../StorefrontCartContext';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  pincode: string;
}

const emptyForm: FormState = {
  fullName: '', email: '', phone: '',
  address1: '', city: '', state: '', pincode: '',
};

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} {...props} />
    </div>
  );
}

export default function StorefrontCheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useStorefrontCart();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = (): string => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.phone.trim()) return 'Phone is required.';
    if (!form.address1.trim()) return 'Address is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.state.trim()) return 'State is required.';
    if (!form.pincode.trim()) return 'Pincode is required.';
    if (items.length === 0) return 'Your cart is empty.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerName: form.fullName,
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: {
          line1: form.address1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: 'IN',
        },
        items: items.map((i: any) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        total,
      };

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed to place order');
      }

      const body = await res.json() as { data?: { orderNumber?: string; id?: string }; orderNumber?: string; id?: string };
      const order = body.data ?? body;
      clearCart();
      navigate(`/order-confirmation/${order.orderNumber ?? order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Section 1 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Your details</h2>
          <div className="space-y-3">
            <Field label="Full name" type="text" placeholder="Jane Smith" value={form.fullName} onChange={set('fullName')} disabled={loading} autoComplete="name" />
            <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} disabled={loading} autoComplete="email" />
            <Field label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} disabled={loading} autoComplete="tel" />
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Delivery address</h2>
          <div className="space-y-3">
            <Field label="Address" type="text" placeholder="House no., Street, Area" value={form.address1} onChange={set('address1')} disabled={loading} autoComplete="street-address" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" type="text" placeholder="Mumbai" value={form.city} onChange={set('city')} disabled={loading} autoComplete="address-level2" />
              <Field label="State" type="text" placeholder="Maharashtra" value={form.state} onChange={set('state')} disabled={loading} autoComplete="address-level1" />
            </div>
            <Field label="Pincode" type="text" placeholder="400001" value={form.pincode} onChange={set('pincode')} disabled={loading} autoComplete="postal-code" />
          </div>
        </section>

        {/* Section 3 - Order summary */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Order summary</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between px-4 py-3 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-700 truncate max-w-[70%]">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900 flex-shrink-0">
                  ₹{((item.product.price * item.quantity) / 100).toFixed(0)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-gray-50 text-sm font-semibold">
              <span>Total</span>
              <span>₹{(total / 100).toFixed(0)}</span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-3 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
