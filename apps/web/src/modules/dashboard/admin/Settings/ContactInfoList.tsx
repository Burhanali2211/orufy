import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, MessageCircle, Eye, EyeOff, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { ContactInfoForm } from './ContactInfoForm';

interface ContactInfo {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  is_active: boolean;
  display_order: number;
  icon_name: string;
  additional_info: any;
  created_at: string;
  updated_at: string;
}

export const ContactInfoList: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ContactInfo[]>('/api/dashboard/settings/contact-info');
      setContacts(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact information?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/dashboard/settings/contact-info/${id}`);
      showSuccess('Contact information deleted successfully');
      fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Failed to delete contact information');
    }
  };

  const handleEdit = (contact: ContactInfo) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
    fetchContacts();
  };

  const toggleActive = async (contact: ContactInfo) => {
    try {
      await apiClient.patch(`/api/dashboard/settings/contact-info/${contact.id}`, { is_active: !contact.is_active });
      showSuccess(`Contact information ${!contact.is_active ? 'activated' : 'deactivated'}`);
      fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Failed to update contact information');
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'phone':
        return <Phone className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'address':
        return <MapPin className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.contact_type]) {
      acc[contact.contact_type] = [];
    }
    acc[contact.contact_type].push(contact);
    return acc;
  }, {} as Record<string, ContactInfo[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your business contact details</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
          <span className="hidden sm:inline">Add Contact</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Grouped Contacts */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedContacts).map(([type, items]) => (
          <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-600 flex-shrink-0">{getIcon(type)}</span>
                <h3 className="font-semibold text-xs sm:text-base text-gray-900 capitalize truncate">{type}</h3>
                <span className="text-xs text-gray-500 flex-shrink-0">({items.length})</span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-200">
              {items.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 sm:p-6 transition-all ${contact.is_active ? '' : 'opacity-60 bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-xs sm:text-base text-gray-900 truncate">{contact.label}</h4>
                        {contact.is_primary && (
                          <span className="flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="hidden sm:inline">Primary</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 sm:py-1 text-xs rounded-full flex-shrink-0 ${contact.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {contact.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-base text-gray-700 mb-2 break-all">{contact.value}</p>
                      {contact.additional_info && (
                        <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                          {contact.additional_info.department && (
                            <div>Department: {contact.additional_info.department}</div>
                          )}
                          {contact.additional_info.hours && (
                            <div>Hours: {contact.additional_info.hours}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(contact)}
                        className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${contact.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                          }`}
                        title={contact.is_active ? 'Active' : 'Inactive'}
                      >
                        {contact.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 active:bg-purple-300 transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:bg-red-300 transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <Phone className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contact Information</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first contact detail</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Contact
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ContactInfoForm
          contact={editingContact}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

