import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface ContactInfo {
  id?: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  is_active: boolean;
  display_order: number;
  icon_name: string;
  additional_info: any;
}

interface ContactInfoFormProps {
  contact: ContactInfo | null;
  onClose: () => void;
}

const contactTypes = [
  { value: 'phone', label: 'Phone Number', icon: 'Phone' },
  { value: 'email', label: 'Email Address', icon: 'Mail' },
  { value: 'address', label: 'Physical Address', icon: 'MapPin' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'support', label: 'Support', icon: 'Headphones' },
];

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ contact, onClose }) => {
  const [formData, setFormData] = useState<ContactInfo>({
    contact_type: '',
    label: '',
    value: '',
    is_primary: false,
    is_active: true,
    display_order: 0,
    icon_name: '',
    additional_info: {},
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    }
  }, [contact]);

  const handleTypeChange = (type: string) => {
    const selected = contactTypes.find(t => t.value === type);
    if (selected) {
      setFormData({
        ...formData,
        contact_type: type,
        icon_name: selected.icon,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        contact_type: formData.contact_type,
        label: formData.label,
        value: formData.value,
        is_primary: formData.is_primary,
        is_active: formData.is_active,
        display_order: formData.display_order ?? 0,
        icon_name: formData.icon_name,
        additional_info: formData.additional_info || {}
      };
      if (contact?.id) {
        await apiClient.patch(`/api/dashboard/settings/contact-info/${contact.id}`, payload);
        if (payload.is_primary) {
          await apiClient.post(`/api/dashboard/settings/contact-info/${contact.id}/primary`, {});
        }
      } else {
        const createdContact = await apiClient.post<{ id?: string }>('/api/dashboard/settings/contact-info', payload);
        if (payload.is_primary && createdContact?.id) {
          await apiClient.post(`/api/dashboard/settings/contact-info/${createdContact.id}/primary`, {});
        }
      }
      showSuccess(contact?.id ? 'Contact information updated successfully' : 'Contact information created successfully');
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to save contact information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {contact?.id ? 'Edit Contact Information' : 'Add Contact Information'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Type */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Contact Type *
            </label>
            <select
              value={formData.contact_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white transition-all"
              required
            >
              <option value="" className="bg-gray-900">Select a type</option>
              {contactTypes.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Label *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Customer Support, Main Office"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
              required
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {formData.contact_type === 'email' ? 'Email Address' :
               formData.contact_type === 'phone' || formData.contact_type === 'whatsapp' ? 'Phone Number' :
               formData.contact_type === 'address' ? 'Address' : 'Value'} *
            </label>
            {formData.contact_type === 'address' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                rows={3}
                placeholder="123 Main Street, City, State, ZIP"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all resize-none"
                required
              />
            ) : (
              <input
                type={formData.contact_type === 'email' ? 'email' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={
                  formData.contact_type === 'email' ? 'support@example.com' :
                  formData.contact_type === 'phone' || formData.contact_type === 'whatsapp' ? '+1 (555) 123-4567' :
                  'Enter value'
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                required
              />
            )}
          </div>

          {/* Additional Info - Department */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Department (Optional)
            </label>
            <input
              type="text"
              value={formData.additional_info?.department || ''}
              onChange={(e) => setFormData({
                ...formData,
                additional_info: { ...formData.additional_info, department: e.target.value }
              })}
              placeholder="e.g., Sales, Support, General"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
            />
          </div>

          {/* Additional Info - Hours */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Business Hours (Optional)
            </label>
            <input
              type="text"
              value={formData.additional_info?.hours || ''}
              onChange={(e) => setFormData({
                ...formData,
                additional_info: { ...formData.additional_info, hours: e.target.value }
              })}
              placeholder="e.g., Mon-Fri 9AM-6PM"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white transition-all"
            />
            <p className="text-sm text-white/50 mt-1">Lower numbers appear first</p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="w-4 h-4 text-amber-500 border-white/20 rounded focus:ring-amber-500 bg-white/5"
              />
              <label htmlFor="is_primary" className="text-sm font-medium text-white/80">
                Primary contact (featured prominently)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-amber-500 border-white/20 rounded focus:ring-amber-500 bg-white/5"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-white/80">
                Active (visible on website)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Saving...' : contact?.id ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

