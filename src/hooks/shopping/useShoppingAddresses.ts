import { useState, useCallback, useEffect } from 'react';
import { Address } from '../../types';
import { db } from '../../lib/legacyDb';
import { mapDbAddressToAppAddress } from '../../utils/shoppingMapper';

export const useShoppingAddresses = (user: any, showNotification: any) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) { setAddresses([]); return; }
    setLoading(true);
    try {
      const data = await db.getAddresses(user.id);
      setAddresses(data ? data.map(mapDbAddressToAppAddress) : []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to fetch addresses' });
    } finally { setLoading(false); }
  }, [user, showNotification]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to add an address' });
      return;
    }
    try {
      const addressData = {
        user_id: user.id, full_name: address.fullName, street_address: address.streetAddress,
        city: address.city, state: address.state, postal_code: address.postalCode,
        country: address.country, phone: address.phone, is_default: address.isDefault || false,
        type: address.type || 'shipping'
      };
      await db.createAddress(addressData);
      await fetchAddresses();
      showNotification({ type: 'success', title: 'Address Added', message: 'Your address has been added successfully' });
    } catch (error) {
      console.error('Error adding address:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add address' });
    }
  };

  const updateAddress = async (address: Address) => {
    if (!address.id) return;
    try {
      const addressData = {
        full_name: address.fullName, street_address: address.streetAddress,
        city: address.city, state: address.state, postal_code: address.postalCode,
        country: address.country, phone: address.phone, is_default: address.isDefault, type: address.type
      };
      await db.updateAddress(address.id, addressData);
      await fetchAddresses();
      showNotification({ type: 'success', title: 'Address Updated', message: 'Your address has been updated successfully' });
    } catch (error) {
      console.error('Error updating address:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to update address' });
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await db.deleteAddress(addressId);
      await fetchAddresses();
      showNotification({ type: 'success', title: 'Address Deleted', message: 'Your address has been deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to delete address' });
    }
  };

  const setDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    if (!user) return;
    try {
      await db.setDefaultAddress(user.id, addressId);
      await fetchAddresses();
      showNotification({ type: 'success', title: 'Default Address Set', message: `Default ${type} address has been updated` });
    } catch (error) {
      console.error('Error setting default address:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to set default address' });
    }
  };

  return { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress, fetchAddresses };
};
