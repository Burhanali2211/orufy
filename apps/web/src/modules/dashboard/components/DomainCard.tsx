import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';
import { normalizeUrl } from '@/utils/stringFormatting';
import { Globe, ShieldCheck, Zap, X, AlertCircle, Star } from 'lucide-react';

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
      className="text-xs text-blue-600 hover:text-blue-700 font-bold ml-2 flex-shrink-0 transition-colors"
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
  const addTimeoutRef = useRef<NodeJS.Timeout>();

  const subdomain = tenant?.slug
    ? `${tenant.slug}.${import.meta.env.VITE_ROOT_DOMAIN ?? 'orufy.com'}`
    : null;

  const storefrontUrl = subdomain ? `https://${subdomain}` : null;

  useEffect(() => {
    loadDomains();
    return () => {
      if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
      setVerifyResults({});
    };
  }, []);

  async function loadDomains() {
    try {
      const res = await apiClient.get<DomainsResponse>('/dashboard/tenant/domain');
      setDomains(res.data ?? []);
    } catch {
      // silently fail — empty list is fine
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const domain = normalizeUrl(newDomain);
    if (!domain) return;

    setAdding(true);
    setAddError(null);
    try {
      const res = await apiClient.post<AddDomainResponse>('/dashboard/tenant/domain', { domain });
      setDomains((prev) => [
        ...prev,
        { id: crypto.randomUUID(), domain: res.domain, verified: false, verificationToken: res.verificationToken },
      ]);
      setNewDomain('');
      if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
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
      const res = await apiClient.post<VerifyResponse>('/dashboard/tenant/domain/verify', { domain });
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
      await apiClient.delete('/dashboard/tenant/domain', { domain });
      setDomains((prev) => prev.filter((d) => d.domain !== domain));
    } catch {
      alert('Failed to remove domain. Please try again.');
    } finally {
      setDeletingDomain(null);
    }
  }

  const canAddCustomDomain = tenant?.plan === 'standard' || tenant?.plan === 'premium';

  return (
    <div className="space-y-8">
      {/* Subdomain Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Default Subdomain</h3>
        </div>
        
        {storefrontUrl ? (
          <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 group hover:bg-white hover:border-blue-200 transition-all shadow-inner">
            <span className="text-base text-slate-900 font-bold truncate">{storefrontUrl}</span>
            <div className="flex items-center gap-4 flex-shrink-0">
              <CopyButton text={storefrontUrl} />
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 font-bold hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              >
                Visit Store ↗
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Subdomain generation pending...</p>
        )}
        <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          This URL is always active and secure by default.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Custom domains */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Custom Domain</h3>
          </div>
          {!canAddCustomDomain && (
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              Premium Only
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-400 font-bold animate-pulse">Loading domains...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {domains.length > 0 && (
              <div className="space-y-4">
                {domains.map((d) => (
                  <div key={d.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${d.verified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                          <Globe className={`w-5 h-5 ${d.verified ? 'text-emerald-600' : 'text-amber-600'}`} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{d.domain}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {d.verified ? (
                              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1 h-1 bg-amber-500 rounded-full" />
                                Pending Setup
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(d.domain)}
                        disabled={deletingDomain === d.domain}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                        title="Remove Domain"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {!d.verified && (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                          DNS Configuration Required
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase w-16">Type</span>
                            <span className="text-sm font-bold text-slate-900">TXT</span>
                            <div className="w-8" />
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase w-16">Name</span>
                            <span className="text-sm font-bold text-slate-900">_verify</span>
                            <CopyButton text="_verify" />
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase w-16">Value</span>
                            <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{d.verificationToken}</span>
                            <CopyButton text={d.verificationToken} />
                          </div>
                        </div>
                        
                        <div className="pt-4 flex items-center justify-between">
                          <button
                            onClick={() => handleVerify(d.domain)}
                            disabled={verifyingId === d.domain}
                            className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/10 active:scale-95"
                          >
                            {verifyingId === d.domain ? 'Checking Records...' : 'Verify DNS Records'}
                          </button>
                          {verifyResults[d.domain] && verifyResults[d.domain] !== 'verified' && (
                            <span className="text-[10px] text-rose-500 font-bold">{verifyResults[d.domain]}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canAddCustomDomain ? (
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 border-dashed">
                <form onSubmit={handleAdd} className="space-y-4">
                  {addError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-xl p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {addError}
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => { setNewDomain(e.target.value); setAddError(null); }}
                        placeholder="e.g. store.com"
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={adding || !newDomain.trim()}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10 flex-shrink-0 active:scale-95"
                    >
                      {adding ? 'Processing...' : 'Add Domain'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-100">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Connect Your Own Domain</h4>
                <p className="text-sm text-slate-600 font-medium mb-6 max-w-sm mx-auto">
                  Upgrade to Orufy Standard or Premium to use a custom domain and build a stronger brand.
                </p>
                <button className="px-8 py-3 bg-amber-600 text-white text-sm font-bold rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">
                  Upgrade My Plan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

