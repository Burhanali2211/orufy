import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Address, AddressContextType } from '../types';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (!context) throw new Error('useAddresses must be used within an AddressProvider');
  return context;
};

export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const mapDbAddressToAppAddress = (dbAddress: any): Address => ({
    id: dbAddress.id,
    userId: dbAddress.user_id,
    fullName: dbAddress.full_name,
    streetAddress: dbAddress.street_address,
    city: dbAddress.city,
    state: dbAddress.state,
    postalCode: dbAddress.postal_code,
    country: dbAddress.country,
    phone: dbAddress.phone,
    isDefault: dbAddress.is_default,
    type: dbAddress.type,
    createdAt: new Date(dbAddress.created_at),
    updatedAt: dbAddress.updated_at ? new Date(dbAddress.updated_at) : undefined,
  });

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }

    setLoading(true);
    try {
      // TODO: Connect to local postgres API when ready
      setAddresses([]);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      // TODO: Connect to local postgres API
      await fetchAddresses();
      showNotification({ type: 'success', title: 'Address Added', message: 'Your address has been added successfully' });
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const updateAddress = async (address: Address) => {
    if (!address.id) return;
    try {
      // TODO: Connect to local postgres API
      await fetchAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      // TODO: Connect to local postgres API
      await fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const setDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    if (!user) return;
    try {
      // TODO: Connect to local postgres API
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const value: AddressContextType = {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    fetchAddresses,
    loading
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};
