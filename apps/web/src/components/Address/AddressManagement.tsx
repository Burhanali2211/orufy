import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAddresses } from '../../contexts/AddressContext';
import { Address } from '../../types';
import { Modal } from '../Common/Modal';
import { AddressForm } from './AddressForm';

export const AddressManagement: React.FC = () => {
  const { addresses, deleteAddress, setDefaultAddress, loading } = useAddresses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string, type: 'shipping' | 'billing') => {
    await setDefaultAddress(addressId, type);
  };

  if (loading) {
    return (
      <div className="p-6">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-600 mt-1">Manage your shipping and billing addresses</p>
        </div>
        <motion.button
          onClick={handleAddAddress}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          Add Address
        </motion.button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
          <p className="text-gray-600 mb-6">Add your first address to get started</p>
          <motion.button
            onClick={handleAddAddress}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Address
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-900 capitalize">
                    {address.type || 'shipping'}
                  </span>
                  {address.isDefault && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id!)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="font-medium text-gray-900">{address.fullName}</p>
                <p className="text-gray-600 text-sm">
                  {address.streetAddress || address.street}
                </p>
                <p className="text-gray-600 text-sm">
                  {address.city}, {address.state} {address.postalCode || address.zipCode}
                </p>
                <p className="text-gray-600 text-sm">{address.country}</p>
                {address.phone && (
                  <p className="text-gray-600 text-sm">{address.phone}</p>
                )}
              </div>

              {!address.isDefault && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSetDefault(address.id!, 'shipping')}
                    className="flex-1 text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Set as Default Shipping
                  </button>
                  <button
                    onClick={() => handleSetDefault(address.id!, 'billing')}
                    className="flex-1 text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Set as Default Billing
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <AddressForm
          address={editingAddress}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
