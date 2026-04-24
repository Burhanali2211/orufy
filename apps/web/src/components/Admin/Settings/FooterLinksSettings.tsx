import React, { useState, useEffect } from 'react';
import { Link2, Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, CheckSquare, Square, Loader2, Filter, Search } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface FooterLink {
  id: string;
  section: string;
  title: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export const FooterLinksSettings: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({ section: '', title: '', url: '' });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: FooterLink[] }>('/api/dashboard/settings/footer-links');
      const data: FooterLink[] = response.data || [];
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setLinks(data);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const openModal = (link?: FooterLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({ section: link.section, title: link.title, url: link.url });
    } else {
      setEditingLink(null);
      setFormData({ section: '', title: '', url: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({ section: '', title: '', url: '' });
  };

  const handleSave = async () => {
    try {
      if (editingLink) {
        await apiClient.patch(`/api/dashboard/settings/footer-links/${editingLink.id}`, formData);
      } else {
        const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.displayOrder || 0)) + 1 : 1;
        await apiClient.post('/api/dashboard/settings/footer-links', { ...formData, displayOrder: maxOrder, isActive: true });
      }
      showSuccess(`Link ${editingLink ? 'updated' : 'added'} successfully!`);
      await fetchLinks();
      closeModal();
    } catch (error: any) {
      showError(error.message || 'Error saving link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer link?')) return;
    try {
      await apiClient.delete(`/api/dashboard/settings/footer-links/${id}`);
      showSuccess('Link deleted successfully!');
      await fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Error deleting link');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} footer link(s)?`)) return;
    try {
      await apiClient.post('/api/dashboard/settings/footer-links/bulk-delete', { ids: Array.from(selectedIds) });
      showSuccess(`${count} link(s) deleted successfully!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Error deleting links');
    }
  };

  const toggleSelectionMode = () => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); };
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const selectAll = () => setSelectedIds(new Set(links.map(l => l.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/dashboard/settings/footer-links/${id}`, { isActive: !currentStatus });
      await fetchLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    const sectionLinks = links.filter(l => l.section === link.section);
    const index = sectionLinks.findIndex(l => l.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionLinks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [sectionLinks[index]!, sectionLinks[targetIndex]!] = [sectionLinks[targetIndex]!, sectionLinks[index]!];
    sectionLinks.forEach((link, idx) => { link.displayOrder = idx + 1; });
    const newLinks = links.map(l => { const updated = sectionLinks.find(sl => sl.id === l.id); return updated || l; });
    setLinks(newLinks);
    try {
      for (const link of sectionLinks) {
        await apiClient.patch(`/api/dashboard/settings/footer-links/${link.id}`, { displayOrder: link.displayOrder });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      await fetchLinks();
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchTerm ||
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !sectionFilter || link.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const groupedLinks = filteredLinks.reduce((acc: Record<string, FooterLink[]>, link: FooterLink) => {
    if (!acc[link.section]) acc[link.section] = [];
    acc[link.section]!.push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const sections = Array.from(new Set(links.map(link => link.section))).sort();
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.isActive).length;
  const totalSections = sections.length;

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading footer links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
            <Link2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Footer Links</h2>
            <p className="text-xs text-gray-500">Manage footer navigation links and sections</p>
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
              <Plus className="h-4 w-4" /><span>Add Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Total Links', value: totalLinks, icon: Link2, bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', valueColor: 'text-indigo-800' },
          { label: 'Active Links', value: activeLinks, icon: Eye, bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-800' },
          { label: 'Sections', value: totalSections, icon: Filter, bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-800' },
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
          {(searchTerm || sectionFilter) && (
            <button onClick={() => { setSearchTerm(''); setSectionFilter(''); }} className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search links..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 placeholder-gray-400" />
          </div>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 sm:w-44">
            <option value="">All Sections</option>
            {sections.map((section) => <option key={section} value={section}>{section}</option>)}
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.size} of {links.length} selected</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* Grouped Links */}
      {Object.keys(groupedLinks).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Link2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No footer links found</p>
          {searchTerm || sectionFilter
            ? <p className="text-xs text-gray-400">Try adjusting your filters</p>
            : <p className="text-xs text-gray-400">Get started by adding your first footer link</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLinks).map(([section, sectionLinks]) => (
            <div key={section} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                  <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{section}</h2>
                <span className="ml-auto text-xs text-gray-400">{sectionLinks.length} {sectionLinks.length === 1 ? 'link' : 'links'}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {sectionLinks.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((link, index) => (
                  <div key={link.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!link.isActive ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(link.id) ? 'bg-slate-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {selectionMode && (
                          <button onClick={() => toggleSelect(link.id)} className="mt-0.5 flex-shrink-0">
                            {selectedIds.has(link.id)
                              ? <CheckSquare className="h-4 w-4 text-slate-700" />
                              : <Square className="h-4 w-4 text-gray-400" />}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{link.title}</span>
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${link.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 block truncate">
                            {link.url}
                          </a>
                        </div>
                      </div>
                      {!selectionMode && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => moveLink(link.id, 'up')} disabled={index === 0} title="Move up"
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => moveLink(link.id, 'down')} disabled={index === sectionLinks.length - 1} title="Move down"
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => toggleActive(link.id, link.isActive)} title={link.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-md transition-colors ${link.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200'}`}>
                            {link.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => openModal(link)}
                            className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors border border-slate-200">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(link.id)} title="Delete"
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
          ))}
        </div>
      )}

      {links.length === 0 && !loading && (
        <div className="text-center py-10 bg-white border-2 border-dashed border-gray-200 rounded-xl">
          <Link2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">No footer links added yet</p>
          <button onClick={() => openModal()} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />Add Your First Link
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-base font-bold text-gray-900">{editingLink ? 'Edit' : 'Add'} Footer Link</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Section Name *</label>
                <input type="text" value={formData.section} onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  className={inputCls} placeholder="e.g., Shop, Customer Care, Company" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Link Text *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={inputCls} placeholder="e.g., About Us, Contact" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Link URL *</label>
                <input type="text" value={formData.url} onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className={inputCls} placeholder="/about or https://example.com" required />
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3.5 flex items-center justify-end gap-2 border-t border-gray-200 rounded-b-xl">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={!formData.section || !formData.title || !formData.url}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium">
                <Save className="h-3.5 w-3.5" />{editingLink ? 'Update' : 'Add'} Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
