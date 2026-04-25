import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ExternalLink, Plus, Edit2, Globe, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface PolicyPage {
  id: string;
  name: string;
  route: string;
  razorpayUrl?: string;
  exists: boolean;
  inFooter: boolean;
  footerLinkId?: string;
  footerLinkText?: string;
  section?: string;
}

interface FooterLink {
  id: string;
  section: string;
  title: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}

const REQUIRED_POLICY_PAGES: Omit<PolicyPage, 'exists' | 'inFooter' | 'footerLinkId' | 'footerLinkText' | 'section'>[] = [
  {
    id: 'contact',
    name: 'Contact Us',
    route: '/contact',
  },
  {
    id: 'shipping',
    name: 'Shipping Policy',
    route: '/shipping-policy',
    razorpayUrl: 'https://orufy.com/shipping-policy',
  },
  {
    id: 'terms',
    name: 'Terms and Conditions',
    route: '/terms-of-service',
    razorpayUrl: 'https://orufy.com/terms-of-service',
  },
  {
    id: 'refund',
    name: 'Cancellations and Refunds',
    route: '/refund-policy',
    razorpayUrl: 'https://orufy.com/refund-policy',
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    route: '/privacy-policy',
    razorpayUrl: 'https://orufy.com/privacy-policy',
  },
];

export const PolicyPagesManager: React.FC = () => {
  const [policyPages, setPolicyPages] = useState<PolicyPage[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingRoutes, setCheckingRoutes] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PolicyPage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    section: 'Customer Care',
  });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchFooterLinks(), checkRouteExistence()]);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFooterLinks = async () => {
    try {
      const response = await apiClient.get<{ data: FooterLink[] }>('/api/dashboard/settings/footer-links');
      const data: FooterLink[] = response.data || [];
      // Sort client-side by displayOrder
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setFooterLinks(data);
      updatePolicyPagesStatus(data);
    } catch (error: any) {
      console.error('Error fetching footer links:', error);
    }
  };

  const checkRouteExistence = async () => {
    setCheckingRoutes(true);
    try {
      // Check if routes exist by trying to access them
      const pagesWithStatus = await Promise.all(
        REQUIRED_POLICY_PAGES.map(async (page) => {
          // For now, we'll check if the route is in our known routes
          // In a real scenario, you might want to check the actual route configuration
          const exists = await checkIfRouteExists(page.route);
          return {
            ...page,
            exists,
            inFooter: false,
          };
        })
      );
      setPolicyPages(pagesWithStatus);
    } catch (error: any) {
      console.error('Error checking routes:', error);
    } finally {
      setCheckingRoutes(false);
    }
  };

  const checkIfRouteExists = async (route: string): Promise<boolean> => {
    // Known routes from App.tsx - these are the actual routes that exist
    const knownRoutes = [
      '/privacy-policy',
      '/terms-of-service',
      '/refund-policy',
      '/shipping-policy',
      '/about', // Contact page doesn't exist yet, only About page
    ];
    return knownRoutes.includes(route);
  };

  const updatePolicyPagesStatus = (links: FooterLink[]) => {
    setPolicyPages((prevPages) =>
      prevPages.map((page) => {
        const matchingLink = links.find(
          (link) => link.url === page.route || link.url === page.razorpayUrl
        );
        return {
          ...page,
          inFooter: !!matchingLink,
          footerLinkId: matchingLink?.id,
          footerLinkText: matchingLink?.title,
          section: matchingLink?.section,
        };
      })
    );
  };

  const openAddModal = (page: PolicyPage) => {
    setSelectedPage(page);
    setFormData({
      title: page.name,
      section: 'Customer Care',
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedPage(null);
    setFormData({
      title: '',
      section: 'Customer Care',
    });
  };

  const handleAddToFooter = async () => {
    if (!selectedPage || !formData.title) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      // Check if link already exists
      const existingLink = footerLinks.find(
        (link) => link.url === selectedPage.route || link.url === selectedPage.razorpayUrl
      );

      if (existingLink) {
        showError('This page is already in the footer links');
        return;
      }

      // Get the highest displayOrder for the section
      const sectionLinks = footerLinks.filter((link) => link.section === formData.section);
      const maxOrder = sectionLinks.length > 0 
        ? Math.max(...sectionLinks.map((link) => link.displayOrder || 0))
        : 0;

      const newLink = {
        section: formData.section,
        title: formData.title,
        url: selectedPage.route,
        displayOrder: maxOrder + 1,
        isActive: true,
      };

      await apiClient.post('/api/dashboard/settings/footer-links', newLink);
      
      showSuccess(`${formData.title} added to footer links successfully!`);
      await fetchFooterLinks();
      closeAddModal();
    } catch (error: any) {
      showError(error.response?.data?.error || error.message || 'Error adding link to footer');
    }
  };

  const handleUpdateFooterLink = async (page: PolicyPage) => {
    if (!page.footerLinkId) return;

    openAddModal(page);
  };

  const getSections = (): string[] => {
    const sections = new Set(footerLinks.map((link) => link.section));
    return Array.from(sections).sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading policy pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Policy Pages Manager</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage required policy pages for Razorpay compliance</p>
            </div>
          </div>
        </div>
        <button
          onClick={checkRouteExistence}
          disabled={checkingRoutes}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${checkingRoutes ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Razorpay Compliance</h3>
            <p className="text-xs text-white/60">
              These policy pages are required for Razorpay verification. Make sure all pages exist and are linked in your footer.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Pages List */}
      <div className="space-y-4">
        {policyPages.map((page) => (
          <div
            key={page.id}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-white">{page.name}</h3>
                  <div className="flex items-center gap-2">
                    {page.exists ? (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Page Exists
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Missing
                      </span>
                    )}
                    {page.inFooter ? (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                        In Footer
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">
                        Not in Footer
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Route:</p>
                    <code className="text-sm text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                      {page.route}
                    </code>
                  </div>

                  {page.razorpayUrl && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Razorpay URL:</p>
                      <a
                        href={page.razorpayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {page.razorpayUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {page.inFooter && page.footerLinkText && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Footer Link:</p>
                      <p className="text-sm text-white">
                        {page.footerLinkText} ({page.section})
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {page.inFooter ? (
                  <button
                    onClick={() => handleUpdateFooterLink(page)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Update</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openAddModal(page)}
                    disabled={!page.exists}
                    className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Footer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add to Footer Modal */}
      {showAddModal && selectedPage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {selectedPage.inFooter ? 'Update' : 'Add'} Footer Link
              </h2>
              <button
                onClick={closeAddModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-white/60 mb-1">Page Route:</p>
                <code className="text-sm text-blue-400">{selectedPage.route}</code>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Link Text (Display Name) *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="e.g., Contact Us, Privacy Policy"
                  required
                />
                <p className="text-xs text-white/40 mt-1">
                  This is the text that will appear in the footer. The route ({selectedPage.route}) will be used as the link URL.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Section *</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white transition-all"
                >
                  <option value="Customer Care" className="bg-gray-900">Customer Care</option>
                  <option value="Company" className="bg-gray-900">Company</option>
                  <option value="Legal" className="bg-gray-900">Legal</option>
                  <option value="Shop" className="bg-gray-900">Shop</option>
                  {getSections()
                    .filter((s) => !['Customer Care', 'Company', 'Legal', 'Shop'].includes(s))
                    .map((section) => (
                       <option key={section} value={section} className="bg-gray-900">
                        {section}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="bg-white/5 px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10 rounded-b-2xl">
              <button
                onClick={closeAddModal}
                className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToFooter}
                disabled={!formData.title}
                className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-semibold"
              >
                <Plus className="h-4 w-4" />
                {selectedPage.inFooter ? 'Update' : 'Add'} Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

