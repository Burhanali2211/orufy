import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';

interface DomainRecord {
  id: string;
  domain: string;
  verified: boolean | null;
  verificationToken: string;
}

interface DomainsResponse {
  data: DomainRecord[];
}

interface AddDomainResponse {
  domain: string;
  verificationToken: string;
  verified: boolean;
}

interface VerifyResponse {
  verified: boolean;
  error?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-blue-600 hover:underline ml-2 flex-shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export function DomainCard() {
  const { tenant } = useDashboardAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, string>>({});
  const [deletingDomain, setDeletingDomain] = useState<string | null>(null);

  const subdomain = tenant?.slug
    ? `${tenant.slug}.${import.meta.env.VITE_ROOT_DOMAIN ?? 'orufy.com'}`
    : null;

  const storefrontUrl = subdomain ? `https://${subdomain}` : null;

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const res = await apiClient.get<DomainsResponse>('/api/dashboard/tenant/domain');
      setDomains(res.data ?? []);
    } catch {
      // silently fail — empty list is fine
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!domain) return;

    setAdding(true);
    setAddError(null);
    try {
      const res = await apiClient.post<AddDomainResponse>('/api/dashboard/tenant/domain', { domain });
      setDomains((prev) => [
        ...prev,
        { id: crypto.randomUUID(), domain: res.domain, verified: false, verificationToken: res.verificationToken },
      ]);
      setNewDomain('');
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add domain.');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domain: string) {
    setVerifyingId(domain);
    setVerifyResults((prev) => ({ ...prev, [domain]: '' }));
    try {
      const res = await apiClient.post<VerifyResponse>('/api/dashboard/tenant/domain/verify', { domain });
      if (res.verified) {
        setDomains((prev) =>
          prev.map((d) => (d.domain === domain ? { ...d, verified: true } : d))
        );
        setVerifyResults((prev) => ({ ...prev, [domain]: 'verified' }));
      } else {
        setVerifyResults((prev) => ({ ...prev, [domain]: res.error ?? 'Not verified yet.' }));
      }
    } catch (err: unknown) {
      setVerifyResults((prev) => ({
        ...prev,
        [domain]: err instanceof Error ? err.message : 'Verification failed.',
      }));
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(domain: string) {
    if (!window.confirm(`Remove ${domain}? This cannot be undone.`)) return;
    setDeletingDomain(domain);
    try {
      await apiClient.delete('/api/dashboard/tenant/domain', { domain });
      setDomains((prev) => prev.filter((d) => d.domain !== domain));
    } catch {
      alert('Failed to remove domain. Please try again.');
    } finally {
      setDeletingDomain(null);
    }
  }

  const canAddCustomDomain = tenant?.plan === 'standard' || tenant?.plan === 'premium';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-6">
      <h2 className="text-sm font-semibold text-gray-900">Domain</h2>

      {/* Subdomain */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Your store URL
        </p>
        {storefrontUrl ? (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <span className="text-sm text-gray-800 font-mono truncate">{storefrontUrl}</span>
            <CopyButton text={storefrontUrl} />
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex-shrink-0"
            >
              Visit ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not available yet.</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          This URL is always active. Share it with your customers.
        </p>
      </div>

      {/* Custom domains */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Custom domain
          {!canAddCustomDomain && (
            <span className="ml-2 text-xs normal-case font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              Standard / Premium plan required
            </span>
          )}
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            {domains.length > 0 && (
              <ul className="space-y-3 mb-4">
                {domains.map((d) => (
                  <li key={d.id} className="border border-gray-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-mono text-gray-800 truncate">{d.domain}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {d.verified ? (
                          <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                            Pending
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(d.domain)}
                          disabled={deletingDomain === d.domain}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50"
                        >
                          {deletingDomain === d.domain ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>

                    {!d.verified && (
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
                        <p className="text-xs text-gray-600 font-medium">
                          Add this DNS TXT record to verify ownership:
                        </p>
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono">
                          <span className="text-gray-500">Type</span>
                          <span className="text-gray-800">TXT</span>
                          <span className="text-gray-500">Name</span>
                          <div className="flex items-center">
                            <span className="text-gray-800">_verify</span>
                            <CopyButton text="_verify" />
                          </div>
                          <span className="text-gray-500">Value</span>
                          <div className="flex items-center min-w-0">
                            <span className="text-gray-800 truncate">{d.verificationToken}</span>
                            <CopyButton text={d.verificationToken} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          DNS changes can take up to 48 hours to propagate.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleVerify(d.domain)}
                            disabled={verifyingId === d.domain}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {verifyingId === d.domain ? 'Checking…' : 'Check verification'}
                          </button>
                          {verifyResults[d.domain] && verifyResults[d.domain] !== 'verified' && (
                            <span className="text-xs text-red-500">{verifyResults[d.domain]}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canAddCustomDomain ? (
              <form onSubmit={handleAdd} className="space-y-2">
                {addError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {addError}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => { setNewDomain(e.target.value); setAddError(null); }}
                    placeholder="mystore.com"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={adding || !newDomain.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                  >
                    {adding ? 'Adding…' : 'Add domain'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Enter the domain without https:// — e.g. <span className="font-mono">mystore.com</span>
                </p>
              </form>
            ) : (
              <p className="text-sm text-gray-400">
                Upgrade to Standard or Premium to connect a custom domain.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
