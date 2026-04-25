import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { FooterLinkForm } from './FooterLinkForm';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  opens_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export const FooterLinksList: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<FooterLink[]>('/api/dashboard/settings/footer-links');
      setLinks(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer link?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/dashboard/settings/footer-links/${id}`);
      showSuccess('Footer link deleted successfully');
      fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Failed to delete footer link');
    }
  };

  const handleEdit = (link: FooterLink) => {
    setEditingLink(link);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLink(null);
    fetchLinks();
  };

  const toggleActive = async (link: FooterLink) => {
    try {
      await apiClient.patch(`/api/dashboard/settings/footer-links/${link.id}`, { is_active: !link.is_active });
      showSuccess(`Footer link ${!link.is_active ? 'activated' : 'deactivated'}`);
      fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Failed to update footer link');
    }
  };

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.section_name]) {
      acc[link.section_name] = [];
    }
    acc[link.section_name].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Footer Links</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage footer navigation links</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
          <span className="hidden sm:inline">Add Link</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Grouped Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {Object.entries(groupedLinks).map(([section, items]) => (
          <div key={section} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-xs sm:text-base text-gray-900 truncate">{section}</h3>
                <span className="text-xs text-gray-500 flex-shrink-0">({items.length})</span>
              </div>
            </div>

            {/* Links */}
            <div className="divide-y divide-gray-200">
              {items
                .sort((a, b) => a.display_order - b.display_order)
                .map((link) => (
                  <div
                    key={link.id}
                    className={`p-2 sm:p-4 transition-all ${link.is_active ? '' : 'opacity-60 bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate">{link.link_text}</h4>
                          {link.opens_new_tab && (
                            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{link.link_url}</p>
                      </div>
                      <button
                        onClick={() => toggleActive(link)}
                        className={`p-1.5 sm:p-1 rounded transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${link.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                          }`}
                      >
                        {link.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(link)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 sm:py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 active:bg-purple-300 transition-colors min-h-[44px] sm:min-h-auto"
                      >
                        <Edit2 className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="px-2 py-1.5 sm:py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 active:bg-red-300 transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {links.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <Plus className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Footer Links</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first footer link</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Link
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <FooterLinkForm
          link={editingLink}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

