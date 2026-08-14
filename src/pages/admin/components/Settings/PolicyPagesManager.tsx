import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ExternalLink, Plus, Edit2, Globe, AlertCircle, RefreshCw, X } from 'lucide-react';

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
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  opens_new_tab: boolean;
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
    razorpayUrl: 'https://aah-teal.vercel.app/shipping-policy',
  },
  {
    id: 'terms',
    name: 'Terms and Conditions',
    route: '/terms-of-service',
    razorpayUrl: 'https://aah-teal.vercel.app/terms-of-service',
  },
  {
    id: 'refund',
    name: 'Cancellations and Refunds',
    route: '/refund-policy',
    razorpayUrl: 'https://aah-teal.vercel.app/refund-policy',
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    route: '/privacy-policy',
    razorpayUrl: 'https://aah-teal.vercel.app/privacy-policy',
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
    link_text: '',
    section_name: 'Customer Care',
    opens_new_tab: false,
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
      const data = await apiClient.get('/admin/settings/footer');
      
      
      setFooterLinks(data || []);
      updatePolicyPagesStatus(data || []);
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
          (link) => link.link_url === page.route || link.link_url === page.razorpayUrl
        );
        return {
          ...page,
          inFooter: !!matchingLink,
          footerLinkId: matchingLink?.id,
          footerLinkText: matchingLink?.link_text,
          section: matchingLink?.section_name,
        };
      })
    );
  };

  const openAddModal = (page: PolicyPage) => {
    setSelectedPage(page);
    setFormData({
      link_text: page.name,
      section_name: 'Customer Care',
      opens_new_tab: false,
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedPage(null);
    setFormData({
      link_text: '',
      section_name: 'Customer Care',
      opens_new_tab: false,
    });
  };

  const handleAddToFooter = async () => {
    if (!selectedPage || !formData.link_text) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      // Check if link already exists
      const existingLink = footerLinks.find(
        (link) => link.link_url === selectedPage.route || link.link_url === selectedPage.razorpayUrl
      );

      if (existingLink) {
        showError('This page is already in the footer links');
        return;
      }

      // Get the highest display_order for the section
      const sectionLinks = footerLinks.filter((link) => link.section_name === formData.section_name);
      const maxOrder = sectionLinks.length > 0 
        ? Math.max(...sectionLinks.map((link) => link.display_order))
        : 0;

      const newLink = {
        section_name: formData.section_name,
        link_text: formData.link_text,
        link_url: selectedPage.route,
        display_order: maxOrder + 1,
        is_active: true,
        opens_new_tab: formData.opens_new_tab,
      };

      await apiClient.post('/admin/settings/footer', newLink);

      
      
      showSuccess(`${formData.link_text} added to footer links successfully!`);
      await fetchFooterLinks();
      closeAddModal();
    } catch (error: any) {
      showError(error.message || 'Error adding link to footer');
    }
  };

  const handleUpdateFooterLink = async (page: PolicyPage) => {
    if (!page.footerLinkId) return;

    openAddModal(page);
  };

  const getSections = (): string[] => {
    const sections = new Set(footerLinks.map((link) => link.section_name));
    return Array.from(sections).sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <></>
          <p className="text-white/60">Loading policy pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8f0fe] rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Policy Pages Manager</h1>
            <p className="text-[13px] text-[#5f6368] font-medium mt-1">Manage required policy pages for Razorpay compliance</p>
          </div>
        </div>
        <button
          onClick={checkRouteExistence}
          disabled={checkingRoutes}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#f8f9fa] transition-colors disabled:opacity-50 text-[14px] font-medium shadow-sm min-h-[44px]"
        >
          <RefreshCw className={`h-5 w-5 ${checkingRoutes ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-[#e8f0fe] border border-[#d2e3fc] rounded-[24px] p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#1a73e8] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[14px] font-medium text-[#1a73e8] mb-1" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Razorpay Compliance</h3>
            <p className="text-[13px] text-[#1a73e8]">
              These policy pages are required for Razorpay verification. Make sure all pages exist and are linked in your footer.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Pages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policyPages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-[24px] border border-[#e8eaed] p-6 hover:border-[#1a73e8] transition-all shadow-sm flex flex-col"
          >
            <div className="flex-1">
              <div className="flex flex-col gap-3 mb-4">
                <h3 className="text-[18px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{page.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {page.exists ? (
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6] rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Page Exists
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] rounded-full flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Missing
                    </span>
                  )}
                  {page.inFooter ? (
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] rounded-full">
                      In Footer
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-[#fef7e0] text-[#b06000] border border-[#fce8b2] rounded-full">
                      Not in Footer
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-[12px] text-[#5f6368] font-medium mb-1 uppercase tracking-wider">Route</p>
                  <code className="text-[13px] text-[#202124] bg-[#f8f9fa] px-2 py-1 rounded-[8px] border border-[#e8eaed]">
                    {page.route}
                  </code>
                </div>

                {page.razorpayUrl && (
                  <div>
                    <p className="text-[12px] text-[#5f6368] font-medium mb-1 uppercase tracking-wider">Razorpay URL</p>
                    <a
                      href={page.razorpayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-[#1a73e8] hover:text-[#1557b0] flex items-center gap-1"
                    >
                      View Live <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {page.inFooter && page.footerLinkText && (
                  <div>
                    <p className="text-[12px] text-[#5f6368] font-medium mb-1 uppercase tracking-wider">Footer Link</p>
                    <p className="text-[14px] text-[#202124]">
                      {page.footerLinkText} <span className="text-[#5f6368]">({page.section})</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8eaed] mt-auto">
              {page.inFooter ? (
                <button
                  onClick={() => handleUpdateFooterLink(page)}
                  className="w-full px-5 py-2.5 bg-white text-[#1a73e8] border border-[#d2e3fc] rounded-full hover:bg-[#e8f0fe] transition-colors flex items-center justify-center gap-2 text-[14px] font-medium"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Update Footer Link</span>
                </button>
              ) : (
                <button
                  onClick={() => openAddModal(page)}
                  disabled={!page.exists}
                  className="w-full px-5 py-2.5 bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[14px] font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Footer</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add to Footer Modal */}
      {showAddModal && selectedPage && (
        <div className="fixed inset-0 bg-[#202124]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-lg max-w-md w-full border border-[#e8eaed] overflow-hidden">
            <div className="bg-white border-b border-[#e8eaed] px-6 py-5 flex items-center justify-between">
              <h2 className="text-[18px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>
                {selectedPage.inFooter ? 'Update' : 'Add'} Footer Link
              </h2>
              <button
                onClick={closeAddModal}
                className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors text-[#5f6368]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-[24px] p-5">
                <p className="text-[13px] font-medium text-[#5f6368] mb-1">Page Route:</p>
                <code className="text-[14px] text-[#202124]">{selectedPage.route}</code>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">
                  Link Text (Display Name) *
                </label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link_text: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all hover:bg-[#f8f9fa] focus:bg-white"
                  placeholder="e.g., Contact Us, Privacy Policy"
                  required
                />
                <p className="text-[12px] text-[#5f6368] mt-2 ml-2">
                  This is the text that will appear in the footer.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#5f6368] mb-2">Section *</label>
                <select
                  value={formData.section_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, section_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-[#e8eaed] rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] transition-all hover:bg-[#f8f9fa] focus:bg-white appearance-none pr-10"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  <option value="Customer Care">Customer Care</option>
                  <option value="Company">Company</option>
                  <option value="Legal">Legal</option>
                  <option value="Shop">Shop</option>
                  {getSections()
                    .filter((s) => !['Customer Care', 'Company', 'Legal', 'Shop'].includes(s))
                    .map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="opens_new_tab"
                    checked={formData.opens_new_tab}
                    onChange={(e) => setFormData((prev) => ({ ...prev, opens_new_tab: e.target.checked }))}
                    className="peer appearance-none w-5 h-5 border-2 border-[#5f6368] rounded-[4px] checked:bg-[#1a73e8] checked:border-[#1a73e8] transition-colors cursor-pointer"
                  />
                  <CheckSquare className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <span className="text-[14px] text-[#202124]">Open in new tab</span>
              </label>
            </div>

            <div className="bg-[#f8f9fa] px-6 py-4 flex items-center justify-end gap-3 border-t border-[#e8eaed]">
              <button
                onClick={closeAddModal}
                className="px-6 py-2.5 bg-white border border-[#e8eaed] text-[#5f6368] rounded-full hover:bg-[#f8f9fa] transition-colors text-[14px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToFooter}
                disabled={!formData.link_text}
                className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-[14px] font-medium"
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
