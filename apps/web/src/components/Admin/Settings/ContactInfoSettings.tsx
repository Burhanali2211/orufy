import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, Save, X, Mail, MapPin, MessageCircle, Star, Eye, EyeOff, CheckSquare, Square, Loader2, Filter, Search } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface ContactInfo {
  id: string;
  type: string;
  label: string;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
  displayOrder: number;
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
  const [formData, setFormData] = useState({ type: '', label: '', value: '' });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ContactInfo[]>('/api/dashboard/settings/contact-info');
      setContacts((data || []).sort((a: ContactInfo, b: ContactInfo) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
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
      setFormData({ type: contact.type, label: contact.label, value: contact.value });
    } else {
      setEditingContact(null);
      setFormData({ type: '', label: '', value: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({ type: '', label: '', value: '' });
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSave = async () => {
    try {
      const payload = { type: formData.type, label: formData.label, value: formData.value };
      if (editingContact) {
        await apiClient.patch(`/api/dashboard/settings/contact-info/${editingContact.id}`, payload);
      } else {
        const maxOrder = contacts.length > 0 ? Math.max(...contacts.map(c => c.displayOrder ?? 0)) + 1 : 1;
        await apiClient.post('/api/dashboard/settings/contact-info', { ...payload, displayOrder: maxOrder, isActive: true, isPrimary: false });
      }
      showSuccess(`Contact ${editingContact ? 'updated' : 'added'} successfully!`);
      await fetchContacts();
      closeModal();
    } catch (error: any) {
      showError(error.message || 'Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact information?')) return;
    try {
      await apiClient.delete(`/api/dashboard/settings/contact-info/${id}`);
      showSuccess('Contact deleted successfully!');
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error deleting contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to delete ${count} contact information entry/entries?`)) return;
    try {
      await apiClient.post('/api/dashboard/settings/contact-info/bulk-delete', { ids: Array.from(selectedIds) });
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
      await apiClient.patch(`/api/dashboard/settings/contact-info/${id}`, { isActive: !currentStatus });
      showSuccess(`Contact ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchContacts();
    } catch (error: any) {
      showError(error.message || 'Error updating contact status');
    }
  };

  const setPrimary = async (id: string) => {
    try {
      await apiClient.post(`/api/dashboard/settings/contact-info/${id}/primary`, {});
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
      contact.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || contact.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.type]) acc[contact.type] = [];
    acc[contact.type].push(contact);
    return acc;
  }, {} as Record<string, ContactInfo[]>);

  const contactTypesList = Array.from(new Set(contacts.map(c => c.type))).sort();
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.isActive).length;
  const primaryContacts = contacts.filter(c => c.isPrimary).length;
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
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
            <Phone className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            <p className="text-xs text-gray-500">Manage your contact details</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectionMode && selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              <Trash2 className="h-4 w-4" /><span>Delete ({selectedIds.size})</span>
            </button>
          )}
          <button onClick={toggleSelectionMode} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectionMode ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {selectionMode ? <><X className="h-4 w-4" /><span>Cancel</span></> : <><CheckSquare className="h-4 w-4" /><span className="hidden sm:inline">Select</span></>}
          </button>
          {!selectionMode && (
            <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" /><span>Add Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Contacts', value: totalContacts, icon: Phone, bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-800' },
          { label: 'Active', value: activeContacts, icon: Eye, bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-800' },
          { label: 'Primary', value: primaryContacts, icon: Star, bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-800' },
          { label: 'Types', value: totalTypes, icon: Filter, bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-800' },
        ].map(({ label, value, icon: Icon, bg, border, iconBg, iconColor, valueColor }) => (
          <div key={label} className={`${bg} border ${border} rounded-lg p-3`}>
            <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          {(searchTerm || typeFilter) && (
            <button onClick={() => { setSearchTerm(''); setTypeFilter(''); }} className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 placeholder-gray-400" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 sm:w-44">
            <option value="">All Types</option>
            {contactTypesList.map((type) => (
              <option key={type} value={type} className="capitalize">{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.size} of {contacts.length} selected</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* Grouped Contacts */}
      {Object.keys(groupedContacts).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Phone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No contact information found</p>
          {searchTerm || typeFilter
            ? <p className="text-xs text-gray-400">Try adjusting your filters</p>
            : <p className="text-xs text-gray-400">Get started by adding your first contact</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedContacts).map(([type, typeContacts]) => {
            const Icon = getIcon(type);
            return (
              <div key={type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <div className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900 capitalize">{type}</h2>
                  <span className="ml-auto text-xs text-gray-400">{typeContacts.length} {typeContacts.length === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {typeContacts.sort((a, b) => a.displayOrder - b.displayOrder).map((contact) => (
                    <div key={contact.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!contact.isActive ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(contact.id) ? 'bg-slate-50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {selectionMode && (
                            <button onClick={() => toggleSelect(contact.id)} className="mt-0.5 flex-shrink-0">
                              {selectedIds.has(contact.id)
                                ? <CheckSquare className="h-4 w-4 text-slate-700" />
                                : <Square className="h-4 w-4 text-gray-400" />}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">{contact.label}</span>
                              {contact.isPrimary && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                                  <Star className="h-2.5 w-2.5 fill-current" />Primary
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${contact.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {contact.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2.5 py-1.5 rounded-md break-all border border-gray-100">{contact.value}</p>
                          </div>
                        </div>
                        {!selectionMode && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!contact.isPrimary && contact.isActive && (
                              <button onClick={() => setPrimary(contact.id)} title="Set as primary"
                                className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors border border-amber-200">
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => toggleActive(contact.id, contact.isActive)} title={contact.isActive ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-md transition-colors ${contact.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200'}`}>
                              {contact.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => openModal(contact)}
                              className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors border border-slate-200">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(contact.id)} title="Delete"
                              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors border border-red-200">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contacts.length === 0 && !loading && (
        <div className="text-center py-10 bg-white border-2 border-dashed border-gray-200 rounded-xl">
          <Phone className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">No contact information added yet</p>
          <button onClick={() => openModal()} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />Add Your First Contact
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-base font-bold text-gray-900">{editingContact ? 'Edit' : 'Add'} Contact Information</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Contact Type *</label>
                <select value={formData.type} onChange={(e) => handleTypeChange(e.target.value)} className={inputCls} required>
                  <option value="">Select a type</option>
                  {contactTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Label *</label>
                <input type="text" value={formData.label} onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className={inputCls} placeholder="e.g., Customer Support, Main Office" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Value *</label>
                <input type="text" value={formData.value} onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className={inputCls}
                  placeholder={formData.type === 'email' ? 'email@example.com' : formData.type === 'phone' ? '+1 234 567 8900' : formData.type === 'address' ? '123 Main St, City' : 'Contact value'}
                  required />
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3.5 flex items-center justify-end gap-2 border-t border-gray-200 rounded-b-xl">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={!formData.type || !formData.label || !formData.value}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium">
                <Save className="h-3.5 w-3.5" />{editingContact ? 'Update' : 'Add'} Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
