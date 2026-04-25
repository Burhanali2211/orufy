import React, { useEffect, useState } from 'react';
import {
  Search, Eye, Filter, X, Mail, Clock,
  CheckCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, MessageSquare, Archive
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { ContactSubmissionDetails } from './ContactSubmissionDetails';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  admin_notes?: string;
  user_id?: string;
  replied_at?: string;
  replied_by?: string;
  replied_by_name?: string;
  created_at: string;
  updated_at: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'read': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'replied': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'archived': return 'bg-gray-100 text-gray-600 border border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatDateShort = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

export const ContactSubmissionsList: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const pageSize = 20;

  useEffect(() => { fetchSubmissions(); }, [currentPage, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ContactSubmission[]>('/api/dashboard/settings/contact-submissions');
      
      let filteredData = data || [];
      if (statusFilter) {
        filteredData = filteredData.filter(s => s.status === statusFilter);
      }
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = filteredData.filter(s => 
          (s.name || '').toLowerCase().includes(lowerSearch) ||
          (s.email || '').toLowerCase().includes(lowerSearch) ||
          (s.subject || '').toLowerCase().includes(lowerSearch) ||
          (s.message || '').toLowerCase().includes(lowerSearch)
        );
      }
      
      // Sort descending by created_at
      filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const count = filteredData.length;
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredData.slice(from, to);
      
      setSubmissions(paginatedData);
      setTotalItems(count);
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (error: any) {
      showNotification({ type: 'error', title: 'Error', message: error.message || 'Failed to load contact submissions' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;
      await apiClient.patch(`/api/dashboard/settings/contact-submissions/${id}`, updates);
      showNotification({ type: 'success', title: 'Success', message: 'Submission updated successfully' });
      fetchSubmissions();
      if (selectedSubmissionId === id) setSelectedSubmissionId(null);
    } catch (error: any) {
      showNotification({ type: 'error', title: 'Error', message: error.message || 'Failed to update submission' });
    }
  };

  if (selectedSubmissionId) {
    const sub = submissions.find(s => s.id === selectedSubmissionId);
    if (sub) {
      return <ContactSubmissionDetails submission={sub} onBack={() => setSelectedSubmissionId(null)} onUpdate={updateStatus} />;
    }
  }

  const newCount = submissions.filter(s => s.status === 'new').length;
  const readCount = submissions.filter(s => s.status === 'read').length;
  const repliedCount = submissions.filter(s => s.status === 'replied').length;
  const archivedCount = submissions.filter(s => s.status === 'archived').length;

  const statCards = [
    { label: 'Total', value: totalItems, icon: MessageSquare, iconCls: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'New', value: newCount, icon: Mail, iconCls: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Replied', value: repliedCount, icon: CheckCircle, iconCls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Archived', value: archivedCount, icon: Archive, iconCls: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  ];

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-700">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-gray-700">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-700">{totalItems}</span>
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
              return (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-slate-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {p}
                </button>
              );
            }
            if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="px-1 text-gray-400 text-sm">…</span>;
            return null;
          })}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Inquiries</h2>
            <p className="text-sm text-gray-500">Manage customer inquiries and messages</p>
          </div>
        </div>
        <button onClick={fetchSubmissions} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stat Cards — compact 4-col */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 sm:p-4`}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
              <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.iconCls}`} />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['', 'new', 'read', 'replied', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-slate-300 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'new' && newCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{newCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          {(searchTerm || statusFilter) && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">No submissions found</p>
          <p className="text-gray-500 text-sm">{searchTerm || statusFilter ? 'Try adjusting your filters' : 'No contact submissions yet'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {submissions.map((sub) => (
              <div key={sub.id} className={`p-4 ${sub.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{sub.name}</p>
                      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{sub.email}</p>
                  </div>
                  <button onClick={() => setSelectedSubmissionId(sub.id)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex-shrink-0">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate mb-0.5">{sub.subject}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{sub.message.substring(0, 80)}…</p>
                <p className="text-xs text-gray-400 mt-2">{formatDateShort(sub.created_at)}</p>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Contact</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Subject</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((sub) => (
                  <tr key={sub.id} className={`hover:bg-gray-50 transition-colors ${sub.status === 'new' ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-gray-900">{sub.name}</p>
                      <p className="text-xs text-gray-500">{sub.email}</p>
                      {sub.phone && <p className="text-xs text-gray-400">{sub.phone}</p>}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-gray-900 font-medium truncate">{sub.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{sub.message.substring(0, 60)}…</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(sub.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setSelectedSubmissionId(sub.id)}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium border border-gray-200">
                        <Eye className="h-4 w-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination />
        </div>
      )}
    </div>
  );
};
