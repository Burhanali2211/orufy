import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import { CustomerDashboardLayout } from '../Layout/CustomerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  lastFour?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  upiId?: string;
  isDefault: boolean;
}

export const CustomerPaymentsPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'upi'>('card');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: '',
    isDefault: false
  });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await apiClient.get<{ data: PaymentMethod[] }>('/user/payment-methods');
      setPaymentMethods(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      // Don't show error for empty results
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    
    try {
      await apiClient.delete(`/user/payment-methods/${id}`);
      setPaymentMethods(prev => prev.filter(p => p.id !== id));
      showSuccess('Success', 'Payment method removed');
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      showError('Error', 'Failed to remove payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.patch(`/user/payment-methods/${id}/default`, {});
      setPaymentMethods(prev => 
        prev.map(p => ({
          ...p,
          isDefault: p.id === id
        }))
      );
      showSuccess('Success', 'Default payment method updated');
    } catch (error) {
      console.error('Failed to set default:', error);
      showError('Error', 'Failed to update default payment method');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let data: any = {
        type: paymentType,
        isDefault: formData.isDefault
      };

      if (paymentType === 'card') {
        // Parse card number to get last 4 digits
        const cardNumber = formData.cardNumber.replace(/\s/g, '');
        const lastFour = cardNumber.slice(-4);
        
        // Detect card brand
        let cardBrand = 'Unknown';
        if (cardNumber.startsWith('4')) cardBrand = 'Visa';
        else if (cardNumber.startsWith('5')) cardBrand = 'Mastercard';
        else if (cardNumber.startsWith('6')) cardBrand = 'RuPay';
        else if (cardNumber.startsWith('37')) cardBrand = 'Amex';

        // Parse expiry
        const [month, year] = formData.expiryDate.split('/');
        
        data = {
          ...data,
          lastFour,
          cardBrand,
          expiryMonth: parseInt(month),
          expiryYear: parseInt('20' + year),
          cardholderName: formData.cardholderName
        };
      } else {
        data = {
          ...data,
          upiId: formData.upiId
        };
      }

      const response = await apiClient.post<{ data: PaymentMethod }>('/user/payment-methods', data);
      setPaymentMethods(prev => [...prev, response.data]);
      showSuccess('Success', 'Payment method added');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to add payment method:', error);
      showError('Error', 'Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPaymentType('card');
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      upiId: '',
      isDefault: false
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return (
          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-10 h-6 bg-red-500 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full -mr-1" />
            <div className="w-3 h-3 bg-red-600 rounded-full -ml-1" />
          </div>
        );
      case 'rupay':
        return (
          <div className="w-10 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            RuPay
          </div>
        );
      default:
        return (
          <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <CustomerDashboardLayout title="Payment Methods" subtitle="Manage your saved payment methods">
        <div className="max-w-2xl space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-200 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="Payment Methods" subtitle="Manage your saved payment methods">
      <div className="max-w-2xl space-y-6">
        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-900">Your payment information is secure</p>
            <p className="text-sm text-green-700 mt-1">
              All payment data is encrypted and processed securely through our PCI-DSS compliant payment gateway.
            </p>
          </div>
        </div>

        {/* Add Payment Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Payment Method
          </button>
        </div>

        {/* Payment Methods List */}
        {paymentMethods.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-500 mb-6">Add a payment method for faster checkout</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Payment Method
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative bg-white rounded-2xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                  method.isDefault ? 'border-purple-500' : 'border-gray-100'
                }`}
              >
                {/* Default Badge */}
                {method.isDefault && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                    Default
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {method.type === 'card' ? (
                      <>
                        {getCardBrandIcon(method.cardBrand)}
                        <div>
                          <p className="font-semibold text-gray-900">
                            •••• •••• •••• {method.lastFour}
                          </p>
                          <p className="text-sm text-gray-500">
                            {method.cardholderName && `${method.cardholderName} • `}
                            Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">UPI</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{method.upiId}</p>
                          <p className="text-sm text-gray-500">UPI ID</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> You can also pay using other methods like Cash on Delivery, 
              Net Banking, or Wallets during checkout without saving them here.
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Payment Type Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentType === 'card'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentType === 'upi'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold text-sm">UPI</span>
                  <span className="font-medium">ID</span>
                </button>
              </div>

              {paymentType === 'card' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        cardNumber: formatCardNumber(e.target.value) 
                      }))}
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          expiryDate: formatExpiryDate(e.target.value) 
                        }))}
                        maxLength={5}
                        placeholder="MM/YY"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <input
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          cvv: e.target.value.replace(/\D/g, '').slice(0, 4) 
                        }))}
                        maxLength={4}
                        placeholder="123"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      value={formData.cardholderName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        cardholderName: e.target.value 
                      }))}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      upiId: e.target.value 
                    }))}
                    placeholder="username@upi"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    We'll verify your UPI ID before saving
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="setDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isDefault: e.target.checked 
                  }))}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="setDefault" className="text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Add Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerDashboardLayout>
  );
};

export default CustomerPaymentsPage;
