import { apiClient } from '@/shared/lib/apiClient';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink, Plus, Edit2, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/Common/Modal';
import { FormInput, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';

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
  { id: 'contact', name: 'Contact Us', route: '/contact' },
  { id: 'shipping', name: 'Shipping Policy', route: '/shipping-policy', razorpayUrl: 'https://AligarhAttarHouse.com/shipping-policy' },
  { id: 'terms', name: 'Terms and Conditions', route: '/terms-of-service', razorpayUrl: 'https://AligarhAttarHouse.com/terms-of-service' },
  { id: 'refund', name: 'Cancellations and Refunds', route: '/refund-policy', razorpayUrl: 'https://AligarhAttarHouse.com/refund-policy' },
  { id: 'privacy', name: 'Privacy Policy', route: '/privacy-policy', razorpayUrl: 'https://AligarhAttarHouse.com/privacy-policy' },
];

const schema = z.object({
  link_text: z.string().min(1, 'Link text is required'),
  section_name: z.string().min(1, 'Section is required'),
  opens_new_tab: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export const PolicyPagesManager: React.FC = () => {
  const [checkingRoutes, setCheckingRoutes] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PolicyPage | null>(null);
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const { data: footerLinks = [], isLoading } = useQuery<FooterLink[]>({
    queryKey: ['admin-footer-links'],
    queryFn: () => apiClient.get('/admin/settings/footer').then(res => res || []),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { link_text: '', section_name: 'Customer Care', opens_new_tab: false },
  });

  const [routesExist, setRoutesExist] = useState<Record<string, boolean>>({
    '/privacy-policy': true,
    '/terms-of-service': true,
    '/refund-policy': true,
    '/shipping-policy': true,
    '/about': true,
  });

  const checkRouteExistence = async () => {
    setCheckingRoutes(true);
    // In a real app this might ping the server or router, for now we mock
    await new Promise(resolve => setTimeout(resolve, 500));
    setCheckingRoutes(false);
  };

  const addLinkMutation = useMutation({
    mutationFn: (newLink: Partial<FooterLink>) => apiClient.post('/admin/settings/footer', newLink),
    onSuccess: (_, variables) => {
      showSuccess(`${variables.link_text} added to footer links successfully!`);
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      closeAddModal();
    },
    onError: (error: Error) => {
      showError(error.message || 'Error adding link to footer');
    },
  });

  const policyPages = REQUIRED_POLICY_PAGES.map((page) => {
    const exists = routesExist[page.route] || false;
    const matchingLink = footerLinks.find(
      (link) => link.link_url === page.route || link.link_url === page.razorpayUrl
    );
    return {
      ...page,
      exists,
      inFooter: !!matchingLink,
      footerLinkId: matchingLink?.id,
      footerLinkText: matchingLink?.link_text,
      section: matchingLink?.section_name,
    };
  });

  const openAddModal = (page: PolicyPage) => {
    setSelectedPage(page);
    reset({
      link_text: page.name,
      section_name: 'Customer Care',
      opens_new_tab: false,
    });
  };

  const closeAddModal = () => {
    setSelectedPage(null);
    reset();
  };

  const onSubmit = (data: FormValues) => {
    if (!selectedPage) return;

    const existingLink = footerLinks.find(
      (link) => link.link_url === selectedPage.route || link.link_url === selectedPage.razorpayUrl
    );

    if (existingLink) {
      showError('This page is already in the footer links');
      return;
    }

    const sectionLinks = footerLinks.filter((link) => link.section_name === data.section_name);
    const maxOrder = sectionLinks.length > 0 ? Math.max(...sectionLinks.map((link) => link.display_order)) : 0;

    addLinkMutation.mutate({
      section_name: data.section_name,
      link_text: data.link_text,
      link_url: selectedPage.route,
      display_order: maxOrder + 1,
      is_active: true,
      opens_new_tab: data.opens_new_tab,
    });
  };

  const getSections = (): string[] => {
    const sections = new Set(footerLinks.map((link) => link.section_name));
    return Array.from(sections).sort();
  };

  const predefinedSections = ['Customer Care', 'Company', 'Legal', 'Shop'];
  const allSections = [...predefinedSections, ...getSections().filter(s => !predefinedSections.includes(s))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-500 mt-2">Loading policy pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Policy Pages Manager</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage required policy pages for Razorpay compliance</p>
            </div>
          </div>
        </div>
        <button
          onClick={checkRouteExistence}
          disabled={checkingRoutes}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${checkingRoutes ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Razorpay Compliance</h3>
            <p className="text-xs text-blue-600">
              These policy pages are required for Razorpay verification. Make sure all pages exist and are linked in your footer.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {policyPages.map((page) => (
          <div key={page.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 transition-all shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{page.name}</h3>
                  <div className="flex items-center gap-2">
                    {page.exists ? (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Page Exists
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Missing
                      </span>
                    )}
                    {page.inFooter ? (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        In Footer
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                        Not in Footer
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Route:</p>
                    <code className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">{page.route}</code>
                  </div>
                  {page.razorpayUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Razorpay URL:</p>
                      <a href={page.razorpayUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1">
                        {page.razorpayUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {page.inFooter && page.footerLinkText && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Footer Link:</p>
                      <p className="text-sm text-gray-900">{page.footerLinkText} ({page.section})</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {page.inFooter ? (
                  <button onClick={() => openAddModal(page)} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2">
                    <Edit2 className="h-4 w-4" /> <span>Update</span>
                  </button>
                ) : (
                  <button onClick={() => openAddModal(page)} disabled={!page.exists} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <Plus className="h-4 w-4" /> <span>Add to Footer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedPage} onClose={closeAddModal} title={selectedPage?.inFooter ? 'Update Footer Link' : 'Add Footer Link'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Page Route:</p>
            <code className="text-sm text-blue-600">{selectedPage?.route}</code>
          </div>

          <Controller
            name="link_text"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Link Text (Display Name)"
                {...field}
                error={errors.link_text?.message}
                placeholder="e.g., Contact Us, Privacy Policy"
              />
            )}
          />

          <Controller
            name="section_name"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Section"
                {...field}
                error={errors.section_name?.message}
                options={allSections.map(s => ({ value: s, label: s }))}
              />
            )}
          />

          <Controller
            name="opens_new_tab"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Open in new tab"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeAddModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || addLinkMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {addLinkMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
              {selectedPage?.inFooter ? 'Update' : 'Add'} Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

