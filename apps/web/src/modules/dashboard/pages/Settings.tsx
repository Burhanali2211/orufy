import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';
import { DomainCard } from '../components/DomainCard';

// ─── Store info ───────────────────────────────────────────────────────────────

interface StoreInfoForm {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
}

function StoreInfoCard({
  initial,
  onSave,
}: {
  initial: StoreInfoForm;
  onSave: (data: StoreInfoForm) => Promise<void>;
}) {
  const [form, setForm] = useState<StoreInfoForm>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Store info</h2>
      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Store name</label>
          <input
            name="storeName"
            value={form.storeName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Contact email
          </label>
          <input
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Contact phone
          </label>
          <input
            name="contactPhone"
            type="tel"
            value={form.contactPhone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Changes saved.</span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Appearance ───────────────────────────────────────────────────────────────

interface AppearanceForm {
  primaryColor: string;
  aboutText: string;
}

function AppearanceCard({
  initial,
  onSave,
}: {
  initial: AppearanceForm;
  onSave: (data: AppearanceForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AppearanceForm>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Appearance</h2>
      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Primary color
          </label>
          <div className="flex items-center gap-3">
            <input
              name="primaryColor"
              type="color"
              value={form.primaryColor}
              onChange={handleChange}
              className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-500 font-mono">
              {form.primaryColor}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">About text</label>
          <textarea
            name="aboutText"
            value={form.aboutText}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Changes saved.</span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────

interface SubscriptionInfo {
  plan: string;
  status: string;
  renewalDate?: string;
}

function SubscriptionCard({ info }: { info: SubscriptionInfo }) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Cancel your subscription? Your store will stop working at the end of the billing period.'
      )
    )
      return;
    setCancelling(true);
    try {
      await apiClient.delete('/api/dashboard/subscription');
      window.location.reload();
    } catch {
      alert('Could not cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Subscription</h2>
      <dl className="space-y-2 text-sm mb-5">
        <div className="flex gap-2">
          <dt className="text-gray-500 w-28 flex-shrink-0">Current plan</dt>
          <dd className="text-gray-900 font-medium capitalize">{info.plan}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500 w-28 flex-shrink-0">Status</dt>
          <dd className="capitalize">{info.status}</dd>
        </div>
        {info.renewalDate && (
          <div className="flex gap-2">
            <dt className="text-gray-500 w-28 flex-shrink-0">Renews on</dt>
            <dd className="text-gray-900">
              {new Date(info.renewalDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/billing"
          className="text-sm text-blue-600 hover:underline"
        >
          Upgrade / downgrade plan
        </Link>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="text-sm text-red-500 hover:underline disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel subscription'}
        </button>
      </div>
    </div>
  );
}

// ─── Danger zone ──────────────────────────────────────────────────────────────

function DangerZoneCard() {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllProducts = async () => {
    if (
      !window.confirm(
        'Delete ALL products? This cannot be undone.'
      )
    )
      return;
    const confirmed = window.confirm(
      'Are you absolutely sure? All product data will be permanently deleted.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.delete('/api/dashboard/products/all');
      alert('All products deleted.');
    } catch {
      alert('Failed to delete products. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Danger zone</h2>
      <p className="text-xs text-gray-500 mb-4">
        These actions cannot be undone.
      </p>
      <button
        onClick={handleDeleteAllProducts}
        disabled={deleting}
        className="border border-red-400 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-100 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete all products'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { user, tenant } = useDashboardAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const storeInfoInitial: StoreInfoForm = {
    storeName: tenant?.name ?? '',
    contactEmail: String(tenant?.settings?.contactEmail ?? user.email ?? ''),
    contactPhone: String(tenant?.settings?.contactPhone ?? ''),
  };

  const appearanceInitial: AppearanceForm = {
    primaryColor: String(tenant?.settings?.primaryColor ?? '#2563eb'),
    aboutText: String(tenant?.settings?.aboutText ?? ''),
  };

  const subscriptionInfo: SubscriptionInfo = {
    plan: tenant?.plan ?? 'basic',
    status: tenant?.status ?? 'active',
    renewalDate: tenant?.settings?.renewalDate as string | undefined,
  };

  const handleSaveStoreInfo = async (data: StoreInfoForm) => {
    await apiClient.patch('/api/dashboard/tenant', {
      name: data.storeName,
      settings: {
        ...tenant?.settings,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      },
    });
  };

  const handleSaveAppearance = async (data: AppearanceForm) => {
    await apiClient.patch('/api/dashboard/tenant', {
      settings: {
        ...tenant?.settings,
        primaryColor: data.primaryColor,
        aboutText: data.aboutText,
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <StoreInfoCard initial={storeInfoInitial} onSave={handleSaveStoreInfo} />
      <AppearanceCard initial={appearanceInitial} onSave={handleSaveAppearance} />
      <DomainCard />
      <SubscriptionCard info={subscriptionInfo} />
      <DangerZoneCard />
    </div>
  );
};

export default SettingsPage;
