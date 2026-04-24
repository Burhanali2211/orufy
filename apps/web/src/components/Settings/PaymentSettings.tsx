import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, Star, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { PaymentMethod } from '../../types';

const getUserPaymentMethods = async (): Promise<PaymentMethod[]> => [];
const deletePaymentMethod = async (_id: string): Promise<boolean> => true;
const setDefaultPaymentMethod = async (_id: string): Promise<boolean> => true;

export const PaymentSettings: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Load payment methods from database
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const methods = await getUserPaymentMethods();
        setPaymentMethods(methods);
      } catch (err) {
        console.error('Error loading payment methods:', err);
        setError('Failed to load payment methods. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, [user]);

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    setSaving(true);
    try {
      await setDefaultPaymentMethod(id);
      setPaymentMethods(prev =>
        prev.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
      showNotification({
        type: 'success',
        title: 'Default Payment Method',
        message: 'Default payment method has been updated'
      });
    } catch (err) {
      console.error('Error setting default payment method:', err);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to set default payment method'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    setSaving(true);
    try {
      await deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      showNotification({
        type: 'success',
        title: 'Payment Method Deleted',
        message: 'Payment method has been deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting payment method:', err);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete payment method'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = () => {
    showNotification({ type: 'info', title: 'Add payment method functionality coming soon' });
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    showNotification({ type: 'info', title: `Edit payment method ${method.provider} functionality coming soon` });
  };



  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
      case 'american express':
        return '💳';
      case 'paypal':
        return '💰';
      default:
        return '💳';
    }
  };



  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
          <p className="text-gray-600 mt-1">Manage your payment methods and billing information</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
        <p className="text-gray-600 mt-1">Manage your payment methods and billing information</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Add New Payment Method */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Payment Method</h3>
          <p className="text-gray-600 mb-4">Add a credit card, debit card, or PayPal account</p>
          <motion.button
            className="btn-primary flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddPaymentMethod}
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </motion.button>
        </div>

        {/* Existing Payment Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Payment Methods</h3>
          <div className="space-y-4">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getCardIcon(method.provider)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {method.provider} •••• {method.lastFour}
                        </span>
                        {method.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {method.holderName} • Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id!)}
                        className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPaymentMethod(method)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      disabled={saving}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Billing Information</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Billing Address:</span>
              <span>Same as shipping address</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ID:</span>
              <span>Not provided</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span>USD ($)</span>
            </div>
          </div>
          <button className="mt-4 text-sm text-blue-700 hover:text-blue-800 font-medium">
            Update Billing Information
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Security & Privacy</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• All payment information is encrypted and secure</li>
            <li>• We never store your full credit card numbers</li>
            <li>• Payments are processed by trusted payment providers</li>
            <li>• You can remove payment methods at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
