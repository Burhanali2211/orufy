import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Home,
  Building,
  Phone,
  X,
  Navigation,
  Loader2,
  Sparkles
} from 'lucide-react';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useCustomerAddresses } from '@/shared/hooks/customer/useCustomerAddresses';

interface Address {
  id: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  type: string;
}

const initialFormData = {
  fullName: '',
  streetAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  isDefault: false,
  type: 'home'
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh'
];

export const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { data: addresses = [], isLoading: loading, createAddress, updateAddress, deleteAddress, setDefaultAddress, isSaving } = useCustomerAddresses();
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [locating, setLocating] = useState(false);

  const handleOpenModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        fullName: address.fullName || '',
        streetAddress: address.streetAddress || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        phone: address.phone || '',
        isDefault: address.isDefault || false,
        type: address.type || 'home'
      });
    } else {
      setEditingAddress(null);
      setFormData({
        ...initialFormData,
        fullName: user?.fullName || user?.name || '',
        phone: user?.phone || '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    setFormData(initialFormData);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved address?')) return;
    await deleteAddress(id);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  const handleDetectLocation = async () => {
    if (!('geolocation' in navigator)) {
      showError('Not Supported', 'Geolocation is not supported by your browser.');
      return;
    }

    try {
      setLocating(true);
      showInfo('Detecting location...', 'Please allow browser location permission if prompted.');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await res.json();

            if (data && data.address) {
              const addr = data.address;
              const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
              const house = addr.house_number ? `${addr.house_number}, ` : '';
              const detectedStreet = `${house}${road}`.trim() || data.display_name?.split(',')[0] || '';
              const detectedCity = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
              const detectedState = addr.state || '';
              const detectedPostcode = addr.postcode || '';

              // Match with nearest Indian State from list
              const matchedState = INDIAN_STATES.find(
                s => s.toLowerCase() === detectedState.toLowerCase() || detectedState.toLowerCase().includes(s.toLowerCase())
              ) || detectedState;

              setFormData(prev => ({
                ...prev,
                streetAddress: detectedStreet || prev.streetAddress,
                city: detectedCity || prev.city,
                state: matchedState || prev.state,
                postalCode: detectedPostcode || prev.postalCode,
                country: addr.country || 'India'
              }));

              showSuccess('Location detected', 'Address fields populated from your GPS location.');
            } else {
              showError('Location lookup failed', 'Could not resolve address from coordinates.');
            }
          } catch (fetchErr) {
            console.error('Reverse geocode error:', fetchErr);
            showError('Lookup Error', 'Unable to fetch street details for your coordinates.');
          } finally {
            setLocating(false);
          }
        },
        (geoErr) => {
          setLocating(false);
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            showError('Permission Denied', 'Please allow location permission in your browser settings to use auto-fill.');
          } else {
            showError('Location Error', geoErr.message || 'Unable to retrieve location.');
          }
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } catch (err: any) {
      setLocating(false);
      showError('Error', err.message || 'Failed to detect location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingAddress) {
      await updateAddress({ id: editingAddress.id, ...formData, type: (formData.type as 'shipping' | 'billing') || 'shipping' });
    } else {
      await createAddress({ ...formData, type: (formData.type as 'shipping' | 'billing') || 'shipping' });
    }
    handleCloseModal();
  };

  return (
    <CustomerDashboardLayout title="Saved Addresses" subtitle="Manage your shipping destinations">
      <div className="space-y-6">
        {/* ── Top Action Bar ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-stone-500">
            {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} registered
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* ── Address Cards Grid ── */}
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                  address.isDefault ? 'border-stone-900 ring-1 ring-stone-900/10' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{address.fullName}</span>
                      {address.type && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {address.type}
                        </span>
                      )}
                    </div>
                    {address.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                    <p>{address.streetAddress || address.address_line1}</p>
                    <p>{address.city}, {address.state} {address.postalCode || address.postal_code}</p>
                    <p>{address.country || 'India'}</p>
                    {address.phone && <p className="pt-1 text-stone-500 font-medium">Contact: {address.phone}</p>}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(address)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">No saved addresses</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Save shipping destinations for fast one-click checkout.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Address</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Address Modal ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10 space-y-5 border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
                </h3>
                <button onClick={handleCloseModal} className="p-1 rounded-lg text-stone-400 hover:text-stone-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* GPS Auto-Fill Button */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Navigation className="w-4 h-4 text-stone-900 flex-shrink-0" />
                  <span>Auto-detect your current live address</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 shadow-2xs"
                >
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  <span>{locating ? 'Detecting...' : 'Use My GPS'}</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Full Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Street Address / House #</label>
                  <input
                    type="text"
                    required
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    placeholder="Flat / House No., Building Name, Street"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Postal Code (PIN)</label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="PIN Code"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-stone-900 rounded"
                    />
                    <span>Set as primary default address</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default AddressesPage;
