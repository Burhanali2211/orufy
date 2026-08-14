import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, User, Phone, Clock, MessageSquare, 
  CheckCircle, X, Save, Archive
} from 'lucide-react';

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
  user_name?: string;
  user_email?: string;
  replied_at?: string;
  replied_by?: string;
  replied_by_name?: string;
  created_at: string;
  updated_at: string;
}

interface ContactSubmissionDetailsProps {
  submission: ContactSubmission;
  onBack: () => void;
  onUpdate: (id: string, status: string, adminNotes?: string) => Promise<void>;
}

export const ContactSubmissionDetails: React.FC<ContactSubmissionDetailsProps> = ({
  submission,
  onBack,
  onUpdate
}) => {
  const [status, setStatus] = useState(submission.status);
  const [adminNotes, setAdminNotes] = useState(submission.admin_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(submission.id, status, adminNotes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickAction = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onUpdate(submission.id, newStatus, adminNotes);
      setStatus(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to List
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickAction('read')}
            disabled={isUpdating || status === 'read'}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            Mark as Read
          </button>
          <button
            onClick={() => handleQuickAction('replied')}
            disabled={isUpdating || status === 'replied'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            Mark as Replied
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{submission.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">Submitted on {formatDate(submission.created_at)}</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{submission.message}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 resize-none"
                  placeholder="Add internal notes about this submission..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <a 
                    href={`mailto:${submission.email}`}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    {submission.email}
                  </a>
                </div>
              </div>
              {submission.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <a 
                      href={`tel:${submission.phone}`}
                      className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      {submission.phone}
                    </a>
                  </div>
                </div>
              )}
              {submission.user_id && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">Registered User</div>
                  <div className="text-sm font-medium text-gray-900">
                    {submission.user_name || submission.user_email || 'User Account'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Current Status</div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    status === 'read' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    status === 'replied' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </div>
              {submission.replied_at && (
                <div>
                  <div className="text-sm text-gray-500">Replied On</div>
                  <div className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(submission.replied_at)}
                  </div>
                  {submission.replied_by_name && (
                    <div className="text-xs text-gray-500 mt-1">
                      by {submission.replied_by_name}
                    </div>
                  )}
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(submission.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

