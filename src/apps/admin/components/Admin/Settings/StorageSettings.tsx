import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import {
  Cloud,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Key,
  Database,
  Globe,
  Eye,
  EyeOff,
  Zap,
  Check,
  ExternalLink,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface StorageFormData {
  storage_provider: 'local' | 'cloudflare_r2';
  r2_account_id: string;
  r2_bucket_name: string;
  r2_access_key_id: string;
  r2_secret_access_key: string;
  r2_public_url: string;
  has_secret?: boolean;
}

const DEFAULT_STORAGE_CONFIG: StorageFormData = {
  storage_provider: 'local',
  r2_account_id: '',
  r2_bucket_name: '',
  r2_access_key_id: '',
  r2_secret_access_key: '',
  r2_public_url: '',
};

export const StorageSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<StorageFormData>(DEFAULT_STORAGE_CONFIG);
  const [showSecret, setShowSecret] = useState(false);
  
  // Test connection feedback state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-storage-settings'],
    queryFn: () => apiClient.get('/admin/settings/storage'),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setForm({
        storage_provider: data.storage_provider === 'cloudflare_r2' ? 'cloudflare_r2' : 'local',
        r2_account_id: data.r2_account_id || '',
        r2_bucket_name: data.r2_bucket_name || '',
        r2_access_key_id: data.r2_access_key_id || '',
        r2_secret_access_key: '',
        r2_public_url: data.r2_public_url || '',
        has_secret: Boolean(data.has_secret),
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: StorageFormData) => apiClient.post('/admin/settings/storage', payload),
    onSuccess: () => {
      showSuccess('Storage settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-storage-settings'] });
    },
    onError: (err: Error) => {
      showError(err?.message || 'Failed to save storage settings');
    }
  });

  const handleTestConnection = async () => {
    if (form.storage_provider === 'cloudflare_r2' && (!form.r2_account_id || !form.r2_bucket_name || !form.r2_access_key_id)) {
      showError('Missing Fields', 'Please fill in Account ID, Bucket Name, and Access Key ID to test.');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const res = await apiClient.post<{ success: boolean; url?: string; message?: string; error?: string }>('/admin/settings/storage/test-r2', {
        provider: 'r2',
        r2_account_id: form.r2_account_id,
        r2_bucket_name: form.r2_bucket_name,
        r2_access_key_id: form.r2_access_key_id,
        r2_secret_access_key: form.r2_secret_access_key,
        r2_public_url: form.r2_public_url,
      });

      if (res?.success) {
        setTestResult({ success: true, message: res.message || 'Connection verified successfully!' });
        showSuccess('Cloudflare R2 Connected!', res.message || 'Bucket connection verified');
      } else {
        setTestResult({ success: false, error: res?.error || 'Connection test failed.' });
        showError('R2 Connection Error', res?.error || 'Test failed');
      }
    } catch (err: unknown) {
      setTestResult({ success: false, error: err?.message || 'Failed to connect to Cloudflare R2' });
      showError('Connection Error', err?.message || 'R2 connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-md sm:rounded-md p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-sans">Cloudflare R2 Storage</h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5 font-medium">Configure cloud media storage bucket, R2 credentials, and test connection.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-stone-900 text-white font-bold text-xs sm:text-sm hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50 uppercase tracking-wider"
        >
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* Provider Selector Card */}
      <div className="bg-white border border-stone-200 rounded-md sm:rounded-md p-5 sm:p-8 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">Media Storage Location</h2>
          <p className="text-xs text-stone-500 mt-0.5">Select where uploaded product images, favicons, and store logos are stored.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setForm(prev => ({ ...prev, storage_provider: 'local' }))}
            className={`p-5 rounded-md border-2 cursor-pointer transition-all ${
              form.storage_provider === 'local'
                ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              {form.storage_provider === 'local' && (
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>
            <h3 className="font-bold text-stone-900 text-base">Local Server Storage</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Files are saved locally on the application server in `/uploads` directory.</p>
          </div>

          <div
            onClick={() => setForm(prev => ({ ...prev, storage_provider: 'cloudflare_r2' }))}
            className={`p-5 rounded-md border-2 cursor-pointer transition-all ${
              form.storage_provider === 'cloudflare_r2'
                ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              {form.storage_provider === 'cloudflare_r2' && (
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>
            <h3 className="font-bold text-stone-900 text-base">Cloudflare R2 Bucket</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">High-performance zero egress fee CDN storage bucket for store media.</p>
          </div>
        </div>
      </div>

      {/* Direct Quick Guide Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-md sm:rounded-md p-5 sm:p-6 text-xs text-stone-700 space-y-3">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-stone-700" />
          <span>Need help finding your Cloudflare R2 Keys?</span>
        </div>
        <p className="leading-relaxed">
          Log in to your Cloudflare Dashboard to retrieve your Account ID, create an R2 Bucket, and generate API Access Tokens with Read/Write permissions.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="https://dash.cloudflare.com/?to=/:account/r2/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 font-bold hover:bg-stone-100 transition-colors shadow-2xs"
          >
            <span>Cloudflare R2 Overview</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </a>
          <a
            href="https://dash.cloudflare.com/?to=/:account/r2/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 font-bold hover:bg-stone-100 transition-colors shadow-2xs"
          >
            <span>Create R2 API Token</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Cloudflare R2 Credentials Form */}
      <div className="bg-white border border-stone-200 rounded-md sm:rounded-md p-5 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-700" />
              Cloudflare R2 Credentials
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Enter S3-compatible API keys and bucket settings below.</p>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50 uppercase tracking-wider"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test R2 Connection
          </button>
        </div>

        {/* Live Test Diagnostic Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-md border text-xs sm:text-sm font-semibold flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">{testResult.success ? 'R2 Connection Verified Successfully' : 'R2 Connection Diagnostic Result'}</p>
              <p className="mt-1 opacity-90 leading-relaxed">{testResult.message || testResult.error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cloudflare Account ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-stone-500" /> Account ID *
              </label>
              <a
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 underline"
              >
                <span>Find Account ID</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={form.r2_account_id}
              onChange={e => setForm({ ...form, r2_account_id: e.target.value })}
              placeholder="e.g. 5a1b2c3d4e5f6g7h8i9j"
              className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs font-mono bg-stone-50 focus:bg-white transition-colors"
            />
            <p className="text-[11px] text-stone-500">Your 32-character Cloudflare Account ID from dashboard overview.</p>
          </div>

          {/* R2 Bucket Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-stone-500" /> Bucket Name *
              </label>
              <a
                href="https://dash.cloudflare.com/?to=/:account/r2/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 underline"
              >
                <span>View Buckets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={form.r2_bucket_name}
              onChange={e => setForm({ ...form, r2_bucket_name: e.target.value })}
              placeholder="e.g. my-store-media"
              className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs font-mono bg-stone-50 focus:bg-white transition-colors"
            />
            <p className="text-[11px] text-stone-500">Name of the Cloudflare R2 bucket created for your store.</p>
          </div>

          {/* Access Key ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-500" /> Access Key ID *
              </label>
              <a
                href="https://dash.cloudflare.com/?to=/:account/r2/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 underline"
              >
                <span>R2 API Tokens</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={form.r2_access_key_id}
              onChange={e => setForm({ ...form, r2_access_key_id: e.target.value })}
              placeholder="Access Key ID from R2 API Token"
              className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs font-mono bg-stone-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Secret Access Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-500" /> Secret Access Key *
              </label>
              <a
                href="https://dash.cloudflare.com/?to=/:account/r2/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 underline"
              >
                <span>Get Secret Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.r2_secret_access_key}
                onChange={e => setForm({ ...form, r2_secret_access_key: e.target.value })}
                placeholder={form.has_secret ? '•••••••••••••••• (Leave blank to keep saved secret)' : 'Secret Access Key'}
                className="w-full px-4 py-2.5 pr-10 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs font-mono bg-stone-50 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Public Custom Domain / URL */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-stone-500" /> Public Domain / R2 Public URL
            </label>
            <a
              href="https://dash.cloudflare.com/?to=/:account/r2/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 underline"
            >
              <span>Enable Public URL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="text"
            value={form.r2_public_url}
            onChange={e => setForm({ ...form, r2_public_url: e.target.value })}
            placeholder="e.g. https://pub-xxxxxxxxxxxxxx.r2.dev or https://cdn.my-store.com"
            className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs font-mono bg-stone-50 focus:bg-white transition-colors"
          />
          <p className="text-[11px] text-stone-500">
            Public domain configured under Bucket Settings $\rightarrow$ Public Access (e.g., `https://pub-xxx.r2.dev` or custom domain).
          </p>
        </div>
      </div>
    </div>
  );
};

