import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, Save, X, Mail, MapPin, MessageCircle, Star, Eye, EyeOff, CheckSquare, Square, Filter, Search } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';

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
}

const contactTypes = [
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'address', label: 'Address', icon: MapPin },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }
];

export const ContactInfoSettings: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
  const [formData, setFormData] = useState({ contact_type: '', label: '', value: '', icon_name: '' });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/contact');
      
      setContacts((data || []).sort((a: ContactInfo, b: ContactInfo) => (a.display_order ?? 0) - (b.display_order ?? 0)));
    } catch (error: any) {
      showError(error.message || 'Failed to fetch contact information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const openModal = (contact?: ContactInfo) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({ contact_type: contact.contact_type, label: contact.label, value: contact.value, icon_name: contact.icon_name });
    } else {
      setEditingContact(null);
      setFormData({ contact_type: '', label: '', value: '', icon_name: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({ contact_type: '', label: '', value: '', icon_name: '' });
  };

  const handleTypeChange = (type: string) => {
    const selected = contactTypes.find(t => t.value === type);
    if (selected) setFormData(prev => ({ ...prev, contact_type: type, icon_name: type }));
  };

  const handleSave = async () => {
    try {
      const payload = { contact_type: formData.contact_type, label: formData.label, value: formData.value, icon_name: formData.icon_name || formData.contact_type };
      if (editingContact) {
        await apiClient.put(`/admin/settings/contact/${editingContact.id}`, payload);
        
      } else {
        const maxOrder = contacts.length > 0 ? Math.max(...contacts.map(c => c.display_order ?? 0)) + 1 : 1;
        await apiClient.post('/admin/settings/contact', { ...payload, display_order: maxOrder, is_active: true, is_primary: false });
        
      }
      showSuccess(`Contact ${editingContact ? 'updated' : 'added'} successfully!`);
      await fetchContacts();
      closeModal();
    } catch (error: any) {
      showError(error.message || 'Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact information?')) return;
    try {
      await apiClient.delete(`/admin/settings/contact/${id}`);
      
      showSuccess('Contact deleted successfully!');
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error deleting contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} contact information entry/entries?`)) return;
    try {
      await apiClient.post('/admin/settings/contact/batch-delete', { ids: Array.from(selectedIds) });
      
      showSuccess(`${count} contact(s) deleted successfully!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error deleting contacts');
    }
  };

  const toggleSelectionMode = () => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); };
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const selectAll = () => setSelectedIds(new Set(contacts.map(c => c.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/settings/contact/${id}`, { is_active: !currentStatus });
      
      showSuccess(`Contact ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error updating contact status');
    }
  };

  const setPrimary = async (id: string) => {
    try {
      const { error: clearError } = await supabase.from('contact_information').update({ is_primary: false }).neq('id', id);
      if (clearError) throw clearError;
      await apiClient.put(`/admin/settings/contact/${id}`, { is_primary: true });
      
      showSuccess('Contact set as primary');
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error setting primary contact');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || contact.contact_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.contact_type]) acc[contact.contact_type] = [];
    acc[contact.contact_type].push(contact);
    return acc;
  }, {} as Record<string, ContactInfo[]>);

  const contactTypesList = Array.from(new Set(contacts.map(c => c.contact_type))).sort();
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.is_active).length;
  const primaryContacts = contacts.filter(c => c.is_primary).length;
  const totalTypes = contactTypesList.length;

  const getIcon = (type: string) => {
    const iconMap: Record<string, any> = { phone: Phone, email: Mail, address: MapPin, whatsapp: MessageCircle };
    return iconMap[type] || Phone;
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <></>
          <p className="text-sm text-gray-500">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8f0fe] rounded-2xl flex items-center justify-center">
            <Phone className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Contact Information</h2>
            <p className="text-[13px] text-[#5f6368] font-medium mt-1">Manage your contact details</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectionMode && selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-5 py-2.5 bg-[#ea4335] text-white rounded-full font-medium hover:bg-[#d93025] transition-colors text-[14px] shadow-sm min-h-[44px]">
              <Trash2 className="h-5 w-5" /><span>Delete ({selectedIds.size})</span>
            </button>
          )}
          <button onClick={toggleSelectionMode} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-[14px] transition-colors min-h-[44px] ${selectionMode ? 'bg-[#e8eaed] text-[#202124] hover:bg-[#dadce0]' : 'bg-white border border-[#e8eaed] text-[#5f6368] hover:bg-[#f8f9fa] shadow-sm'}`}>
            {selectionMode ? <><X className="h-5 w-5" /><span>Cancel</span></> : <><CheckSquare className="h-5 w-5" /><span className="hidden sm:inline">Select</span></>}
          </button>
          {!selectionMode && (
            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[14px] transition-colors shadow-sm min-h-[44px]">
              <Plus className="h-5 w-5" /><span>Add Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: totalContacts },
          { label: 'Active', value: activeContacts },
          { label: 'Primary', value: primaryContacts },
          { label: 'Types', value: totalTypes },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-[#e8eaed] rounded-[24px] p-5 shadow-sm">
            <p className="text-[13px] text-[#5f6368] font-medium">{label}</p>
            <p className="text-2xl font-semibold text-[#202124] mt-1" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-[#5f6368]" />
          <h3 className="text-[14px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Filters</h3>
          {(searchTerm || typeFilter) && (
            <button onClick={() => { setSearchTerm(''); setTypeFilter(''); }} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
              <X className="w-4 h-4" />Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] transition-all hover:bg-[#f8f9fa] focus:bg-white appearance-none pr-10" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Types</option>
            {contactTypesList.map((type) => (
              <option key={type} value={type} className="capitalize">{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className="bg-[#e8f0fe] border border-[#d2e3fc] rounded-[24px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="text-[14px] font-medium text-[#1a73e8]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{selectedIds.size} of {contacts.length} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="px-4 py-2 text-[14px] font-medium bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#f8f9fa] transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-4 py-2 text-[14px] font-medium bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#f8f9fa] transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* Grouped Contacts */}
      {Object.keys(groupedContacts).length === 0 ? (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-12 text-center shadow-sm">
          <Phone className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
          <p className="text-[#5f6368] font-medium mb-1">No contact information found</p>
          {searchTerm || typeFilter
            ? <p className="text-[14px] text-[#5f6368]">Try adjusting your filters</p>
            : <p className="text-[14px] text-[#5f6368]">Get started by adding your first contact</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedContacts).map(([type, typeContacts]) => {
            const Icon = getIcon(type);
            return (
              <div key={type} className="bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#e8eaed] bg-[#f8f9fa] flex flex-row items-center justify-between">
                  <h3 className="font-medium text-[#202124] capitalize flex items-center gap-2 text-[16px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>
                    <Icon className="w-5 h-5 text-[#5f6368]" /> {type}
                  </h3>
                  <span className="bg-[#e8eaed] text-[#5f6368] text-[12px] font-medium px-2.5 py-0.5 rounded-full">{typeContacts.length}</span>
                </div>
                <div className="divide-y divide-[#e8eaed]">
                  {typeContacts.sort((a, b) => a.display_order - b.display_order).map((contact) => (
                    <div key={contact.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between transition-colors ${!contact.is_active ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(contact.id) ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8f9fa]'}`}>
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {selectionMode && (
                          <button onClick={() => toggleSelect(contact.id)} className="mt-1 flex-shrink-0 text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                            {selectedIds.has(contact.id)
                              ? <CheckSquare className="w-5 h-5 text-[#1a73e8]" />
                              : <Square className="w-5 h-5" />}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-[#202124] text-[15px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{contact.label}</span>
                            {contact.is_primary && (
                              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />Primary
                              </span>
                            )}
                            {!contact.is_active && (
                              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-[#f8f9fa] text-[#5f6368] border-[#e8eaed]">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] text-[#5f6368] break-all">{contact.value}</p>
                        </div>
                      </div>
                      {!selectionMode && (
                        <div className="flex items-center gap-3 sm:ml-auto border-t border-[#e8eaed] sm:border-t-0 pt-3 sm:pt-0 flex-shrink-0">
                          <button onClick={() => toggleActive(contact.id, contact.is_active)} title={contact.is_active ? 'Deactivate' : 'Activate'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${contact.is_active ? 'bg-[#f8f9fa] text-[#5f6368] hover:bg-[#e8eaed]' : 'bg-[#e6f4ea] text-[#137333] hover:bg-[#ceead6]'}`}>
                            {contact.is_active ? <><EyeOff className="h-4 w-4" /><span className="hidden xl:inline">Deactivate</span></> : <><Eye className="h-4 w-4" /><span className="hidden xl:inline">Activate</span></>}
                          </button>
                          {!contact.is_primary && contact.is_active && (
                            <button onClick={() => setPrimary(contact.id)} title="Set as primary"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] text-[#5f6368] rounded-full text-[13px] font-medium hover:bg-[#e8eaed] transition-colors">
                              <Star className="h-4 w-4" /><span className="hidden xl:inline">Set Primary</span>
                            </button>
                          )}
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => openModal(contact)}
                              className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(contact.id)} title="Delete"
                              className="p-2 text-[#5f6368] hover:text-[#ea4335] hover:bg-[#fce8e6] rounded-full transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contacts.length === 0 && !loading && (
        <div className="text-center py-16 bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] rounded-[24px]">
          <Phone className="h-12 w-12 text-[#dadce0] mx-auto mb-4" />
          <p className="text-[#5f6368] font-medium mb-5">No contact information added yet</p>
          <button onClick={() => openModal()} className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-[14px] font-medium inline-flex items-center gap-2 transition-colors">
            <Plus className="h-5 w-5" />Add Your First Contact
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#202124]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-lg max-w-md w-full border border-[#e8eaed] overflow-hidden">
            <div className="bg-white border-b border-[#e8eaed] px-6 py-5 flex items-center justify-between">
              <h2 className="text-[18px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{editingContact ? 'Edit' : 'Add'} Contact Information</h2>
              <button onClick={closeModal} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors text-[#5f6368]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Contact Type *</label>
                <select value={formData.contact_type} onChange={(e) => handleTypeChange(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] transition-all hover:bg-[#f8f9fa] focus:bg-white appearance-none pr-10" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }} required>
                  <option value="">Select a type</option>
                  {contactTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Label *</label>
                <input type="text" value={formData.label} onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" placeholder="e.g., Customer Support, Main Office" required />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Value *</label>
                <input type="text" value={formData.value} onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white"
                  placeholder={formData.contact_type === 'email' ? 'email@example.com' : formData.contact_type === 'phone' ? '+1 234 567 8900' : formData.contact_type === 'address' ? '123 Main St, City' : 'Contact value'}
                  required />
              </div>
            </div>
            <div className="bg-[#f8f9fa] px-6 py-4 flex items-center justify-end gap-3 border-t border-[#e8eaed]">
              <button onClick={closeModal} className="px-6 py-2.5 bg-white border border-[#e8eaed] text-[#5f6368] rounded-full hover:bg-[#f8f9fa] transition-colors text-[14px] font-medium">Cancel</button>
              <button onClick={handleSave} disabled={!formData.contact_type || !formData.label || !formData.value}
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-[14px] font-medium">
                <Save className="h-4 w-4" />{editingContact ? 'Update' : 'Add'} Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

