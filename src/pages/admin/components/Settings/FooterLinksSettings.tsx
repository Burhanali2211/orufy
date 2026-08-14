import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { Link2, Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, CheckSquare, Square, Filter, Search } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  opens_new_tab: boolean;
}

export const FooterLinksSettings: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/footer');
      
      setLinks(data || []);
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
      setFormData({ section_name: link.section_name, link_text: link.link_text, link_url: link.link_url, opens_new_tab: link.opens_new_tab });
    } else {
      setEditingLink(null);
      setFormData({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
  };

  const handleSave = async () => {
    try {
      if (editingLink) {
        await apiClient.put(`/admin/settings/footer/${editingLink.id}`, formData);
        
      } else {
        const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.display_order)) + 1 : 1;
        await apiClient.post('/admin/settings/footer', { ...formData, display_order: maxOrder, is_active: true });
        
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
      await apiClient.delete(`/admin/settings/footer/${id}`);
      
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
      await apiClient.post('/admin/settings/footer/batch-delete', { ids: Array.from(selectedIds) });
      
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
      await apiClient.put(`/admin/settings/footer/${id}`, { is_active: !currentStatus });
      
      await fetchLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    const sectionLinks = links.filter(l => l.section_name === link.section_name);
    const index = sectionLinks.findIndex(l => l.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionLinks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [sectionLinks[index]!, sectionLinks[targetIndex]!] = [sectionLinks[targetIndex]!, sectionLinks[index]!];
    sectionLinks.forEach((link, idx) => { link.display_order = idx + 1; });
    const newLinks = links.map(l => { const updated = sectionLinks.find(sl => sl.id === l.id); return updated || l; });
    setLinks(newLinks);
    try {
      for (const link of sectionLinks) {
        await apiClient.put(`/admin/settings/footer/${link.id}`, { display_order: link.display_order });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      await fetchLinks();
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchTerm ||
      link.link_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.link_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.section_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !sectionFilter || link.section_name === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const groupedLinks = filteredLinks.reduce((acc: Record<string, FooterLink[]>, link: FooterLink) => {
    if (!acc[link.section_name]) acc[link.section_name] = [];
    acc[link.section_name]!.push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const sections = Array.from(new Set(links.map(link => link.section_name))).sort();
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.is_active).length;
  const totalSections = sections.length;
  const newTabLinks = links.filter(l => l.opens_new_tab).length;

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <></>
          <p className="text-sm text-gray-500">Loading footer links...</p>
        </div>
import React, { useState, useEffect } from 'react';
import { Link2, Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, CheckSquare, Square, Filter, Search } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  opens_new_tab: boolean;
}

export const FooterLinksSettings: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/footer');
      
      setLinks(data || []);
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
      setFormData({ section_name: link.section_name, link_text: link.link_text, link_url: link.link_url, opens_new_tab: link.opens_new_tab });
    } else {
      setEditingLink(null);
      setFormData({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({ section_name: '', link_text: '', link_url: '', opens_new_tab: false });
  };

  const handleSave = async () => {
    try {
      if (editingLink) {
        await apiClient.put(`/admin/settings/footer/${editingLink.id}`, formData);
        
      } else {
        const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.display_order)) + 1 : 1;
        await apiClient.post('/admin/settings/footer', { ...formData, display_order: maxOrder, is_active: true });
        
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
      await apiClient.delete(`/admin/settings/footer/${id}`);
      
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
      await apiClient.post('/admin/settings/footer/batch-delete', { ids: Array.from(selectedIds) });
      
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
      await apiClient.put(`/admin/settings/footer/${id}`, { is_active: !currentStatus });
      
      await fetchLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    const sectionLinks = links.filter(l => l.section_name === link.section_name);
    const index = sectionLinks.findIndex(l => l.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionLinks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [sectionLinks[index]!, sectionLinks[targetIndex]!] = [sectionLinks[targetIndex]!, sectionLinks[index]!];
    sectionLinks.forEach((link, idx) => { link.display_order = idx + 1; });
    const newLinks = links.map(l => { const updated = sectionLinks.find(sl => sl.id === l.id); return updated || l; });
    setLinks(newLinks);
    try {
      for (const link of sectionLinks) {
        await apiClient.put(`/admin/settings/footer/${link.id}`, { display_order: link.display_order });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      await fetchLinks();
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchTerm ||
      link.link_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.link_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.section_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !sectionFilter || link.section_name === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const groupedLinks = filteredLinks.reduce((acc: Record<string, FooterLink[]>, link: FooterLink) => {
    if (!acc[link.section_name]) acc[link.section_name] = [];
    acc[link.section_name]!.push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const sections = Array.from(new Set(links.map(link => link.section_name))).sort();
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.is_active).length;
  const totalSections = sections.length;
  const newTabLinks = links.filter(l => l.opens_new_tab).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <></>
          <p className="text-sm text-gray-500">Loading footer links...</p>
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
            <Link2 className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Footer Links</h2>
            <p className="text-[13px] text-[#5f6368] font-medium mt-1">Manage footer navigation links and sections</p>
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
              <Plus className="h-5 w-5" /><span>Add Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Links', value: totalLinks },
          { label: 'Active Links', value: activeLinks },
          { label: 'Sections', value: totalSections },
          { label: 'New Tab Links', value: newTabLinks },
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
          {(searchTerm || sectionFilter) && (
            <button onClick={() => { setSearchTerm(''); setSectionFilter(''); }} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
              <X className="w-4 h-4" />Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input type="text" placeholder="Search links..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" />
          </div>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] transition-all hover:bg-[#f8f9fa] focus:bg-white appearance-none pr-10" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Sections</option>
            {sections.map((section) => <option key={section} value={section}>{section}</option>)}
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className="bg-[#e8f0fe] border border-[#d2e3fc] rounded-[24px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="text-[14px] font-medium text-[#1a73e8]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{selectedIds.size} of {links.length} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="px-4 py-2 text-[14px] font-medium bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#f8f9fa] transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-4 py-2 text-[14px] font-medium bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#f8f9fa] transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* Grouped Links */}
      {Object.keys(groupedLinks).length === 0 ? (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-12 text-center shadow-sm">
          <Link2 className="w-12 h-12 text-[#dadce0] mx-auto mb-4" />
          <p className="text-[#5f6368] font-medium mb-1">No footer links found</p>
          {searchTerm || sectionFilter
            ? <p className="text-[14px] text-[#5f6368]">Try adjusting your filters</p>
            : <p className="text-[14px] text-[#5f6368]">Get started by adding your first footer link</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLinks).map(([section, sectionLinks]) => (
            <div key={section} className="bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#e8eaed] bg-[#f8f9fa] flex flex-row items-center justify-between">
                <h3 className="font-medium text-[#202124] capitalize flex items-center gap-2 text-[16px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>
                  <Link2 className="w-5 h-5 text-[#5f6368]" /> {section}
                </h3>
                <span className="bg-[#e8eaed] text-[#5f6368] text-[12px] font-medium px-2.5 py-0.5 rounded-full">{sectionLinks.length}</span>
              </div>
              <div className="divide-y divide-[#e8eaed]">
                {sectionLinks.sort((a, b) => a.display_order - b.display_order).map((link, index) => (
                  <div key={link.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between transition-colors ${!link.is_active ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(link.id) ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8f9fa]'}`}>
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {selectionMode && (
                        <button onClick={() => toggleSelect(link.id)} className="mt-1 flex-shrink-0 text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                          {selectedIds.has(link.id)
                            ? <CheckSquare className="w-5 h-5 text-[#1a73e8]" />
                            : <Square className="w-5 h-5" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-[#202124] text-[15px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{link.link_text}</span>
                          {link.opens_new_tab && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-full flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />New Tab
                            </span>
                          )}
                          {!link.is_active && (
                            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-[#f8f9fa] text-[#5f6368] border-[#e8eaed]">
                              Inactive
                            </span>
                          )}
                        </div>
                        <a href={link.link_url} target="_blank" rel="noopener noreferrer"
                          className="text-[14px] text-[#1a73e8] hover:text-[#1557b0] block truncate">
                          {link.link_url}
                        </a>
                      </div>
                    </div>
                    {!selectionMode && (
                      <div className="flex items-center gap-2 sm:ml-auto border-t border-[#e8eaed] sm:border-t-0 pt-3 sm:pt-0 flex-shrink-0">
                        <button onClick={() => moveLink(link.id, 'up')} disabled={index === 0} title="Move up"
                          className="p-1.5 bg-[#f8f9fa] text-[#5f6368] rounded-full hover:bg-[#e8eaed] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button onClick={() => moveLink(link.id, 'down')} disabled={index === sectionLinks.length - 1} title="Move down"
                          className="p-1.5 bg-[#f8f9fa] text-[#5f6368] rounded-full hover:bg-[#e8eaed] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleActive(link.id, link.is_active)} title={link.is_active ? 'Deactivate' : 'Activate'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${link.is_active ? 'bg-[#f8f9fa] text-[#5f6368] hover:bg-[#e8eaed]' : 'bg-[#e6f4ea] text-[#137333] hover:bg-[#ceead6]'}`}>
                          {link.is_active ? <><EyeOff className="h-4 w-4" /><span className="hidden xl:inline">Deactivate</span></> : <><Eye className="h-4 w-4" /><span className="hidden xl:inline">Activate</span></>}
                        </button>
                        <div className="flex items-center gap-1 ml-1 border-l border-[#e8eaed] pl-2">
                          <button onClick={() => openModal(link)}
                            className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(link.id)} title="Delete"
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
          ))}
        </div>
      )}

      {links.length === 0 && !loading && (
        <div className="text-center py-16 bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] rounded-[24px]">
          <Link2 className="h-12 w-12 text-[#dadce0] mx-auto mb-4" />
          <p className="text-[#5f6368] font-medium mb-5">No footer links added yet</p>
          <button onClick={() => openModal()} className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-[14px] font-medium inline-flex items-center gap-2 transition-colors">
            <Plus className="h-5 w-5" />Add Your First Link
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#202124]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-lg max-w-md w-full border border-[#e8eaed] overflow-hidden">
            <div className="bg-white border-b border-[#e8eaed] px-6 py-5 flex items-center justify-between">
              <h2 className="text-[18px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{editingLink ? 'Edit' : 'Add'} Footer Link</h2>
              <button onClick={closeModal} className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors text-[#5f6368]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Section Name *</label>
                <input type="text" value={formData.section_name} onChange={(e) => setFormData(prev => ({ ...prev, section_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" placeholder="e.g., Shop, Customer Care, Company" required />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Link Text *</label>
                <input type="text" value={formData.link_text} onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" placeholder="e.g., About Us, Contact" required />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Link URL *</label>
                <input type="text" value={formData.link_url} onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white" placeholder="/about or https://example.com" required />
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" id="opens_new_tab" checked={formData.opens_new_tab} onChange={(e) => setFormData(prev => ({ ...prev, opens_new_tab: e.target.checked }))}
                    className="peer appearance-none w-5 h-5 border-2 border-[#5f6368] rounded-[4px] checked:bg-[#1a73e8] checked:border-[#1a73e8] transition-colors cursor-pointer" />
                  <CheckSquare className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-[14px] text-[#202124]">Open in new tab</span>
              </label>
            </div>
            <div className="bg-[#f8f9fa] px-6 py-4 flex items-center justify-end gap-3 border-t border-[#e8eaed]">
              <button onClick={closeModal} className="px-6 py-2.5 bg-white border border-[#e8eaed] text-[#5f6368] rounded-full hover:bg-[#f8f9fa] transition-colors text-[14px] font-medium">Cancel</button>
              <button onClick={handleSave} disabled={!formData.section_name || !formData.link_text || !formData.link_url}
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-[14px] font-medium">
                <Save className="h-4 w-4" />{editingLink ? 'Update' : 'Add'} Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
