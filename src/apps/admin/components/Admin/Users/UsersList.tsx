import { apiClient } from '@/shared/lib/apiClient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Search, Edit, Trash2, Power, Users as UsersIcon, X, ChevronLeft, ChevronRight,
  ShieldCheck, ShoppingBag, UserCheck, Mail, RefreshCw, CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '@/shared/components/Common/Modal';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { UserForm } from './UserForm';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  order_count: number;
  total_spent: string;
}

const getRoleBadge = (role: string) => {
  if (role === 'admin' || role === 'merchant') {
    return 'bg-stone-900 text-white font-bold';
  }
  return 'bg-stone-100 text-stone-700 border border-stone-200';
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

let _usersCache: { users: User[]; totalItems: number; totalPages: number } | null = null;

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(_usersCache?.users ?? []);
  const [loading, setLoading] = useState(_usersCache === null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(_usersCache?.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(_usersCache?.totalItems ?? 0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const isFirstMount = useRef(true);

  const pageSize = 12;

  useEffect(() => {
    const background = isFirstMount.current && _usersCache !== null;
    isFirstMount.current = false;
    fetchUsers(background);
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      const response = await apiClient.get('/merchant/orders/customers/list');
      let data = Array.isArray(response) ? response : (response?.data || []);
      
      if (roleFilter) data = data.filter((u: User) => u.role === roleFilter);
      if (statusFilter === 'active') data = data.filter((u: User) => u.is_active !== false);
      if (statusFilter === 'inactive') data = data.filter((u: User) => u.is_active === false);
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter((u: User) => 
          (u.full_name || '').toLowerCase().includes(term) || 
          (u.email || '').toLowerCase().includes(term)
        );
      }
      
      const rows = data.map((p: User) => ({
        id: p.id,
        email: p.email || '',
        full_name: p.full_name || '',
        role: p.role || 'customer',
        is_active: p.is_active !== false,
        email_verified: true,
        created_at: p.created_at || new Date().toISOString(), 
        order_count: p.order_count || 0,
        total_spent: p.total_spent || '0'
      }));
      
      const ti = rows.length;
      const tp = Math.max(1, Math.ceil(ti / pageSize));
      
      const from = (currentPage - 1) * pageSize;
      const paginatedRows = rows.slice(from, from + pageSize);
      
      setUsers(paginatedRows);
      setTotalItems(ti);
      setTotalPages(tp);
      
      if (currentPage === 1 && !searchTerm && !roleFilter && !statusFilter) {
        _usersCache = { users: paginatedRows, totalItems: ti, totalPages: tp };
      }
    } catch (error: any) {
      if (!background) showError(error?.message || 'Failed to load users');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setDeleteLoading(true);
      await apiClient.put(`/profiles/${selectedUser.id}`, { is_active: false });
      
      showSuccess('User status updated');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Failed to deactivate user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiClient.put(`/profiles/${user.id}`, { is_active: !user.is_active });
      showSuccess('Updated', `User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers(true);
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to update user status');
    }
  };

  const [sendingVerificationId, setSendingVerificationId] = useState<string | null>(null);

  const handleResendVerification = async (targetUser: User) => {
    try {
      setSendingVerificationId(targetUser.id);
      const res = await apiClient.post<any>(`/merchant/orders/customers/${targetUser.id}/resend-verification`, {});
      showSuccess('Verification Dispatched', res.message || `Verification email sent to ${targetUser.email}`);
    } catch (err: any) {
      showError('Failed to Send', err.message || 'Failed to dispatch verification email');
    } finally {
      setSendingVerificationId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchTerm || roleFilter || statusFilter);

  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'merchant').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Customer Accounts & Users</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage customer profiles, store roles, permissions, and purchase histories.</p>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setShowFormModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{totalItems}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Customers</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{activeCount}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Admin Staff</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{adminCount}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Verified</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{totalItems}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium">Loading user profiles...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <UsersIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No users found</h3>
            <p className="text-xs text-stone-500 mt-1">Customers who create accounts during checkout will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Customer Profile</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Orders</th>
                  <th className="py-3.5 px-5">Total Spent</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs flex-shrink-0">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-stone-900 truncate max-w-xs">{user.full_name || 'Customer'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-stone-400 truncate max-w-xs">{user.email}</p>
                            {user.email_verified ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-stone-900">
                      {user.order_count || 0}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-stone-900">
                      ₹{Number(user.total_spent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to toggle status"
                      >
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-stone-500 font-medium">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResendVerification(user)}
                          disabled={sendingVerificationId === user.id}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                          title="Resend verification email"
                        >
                          {sendingVerificationId === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Deactivate user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/50">
            <p className="text-xs font-semibold text-stone-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} users
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-stone-900">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Form Modal ── */}
      {showFormModal && (
        <UserForm
          user={selectedUser}
          onClose={() => { setShowFormModal(false); setSelectedUser(null); }}
          onSuccess={() => { setShowFormModal(false); setSelectedUser(null); fetchUsers(); }}
        />
      )}

      {/* ── Delete/Deactivate Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Deactivate User Account"
        message={`Are you sure you want to deactivate ${selectedUser?.full_name || selectedUser?.email}? They will no longer be able to log in.`}
        confirmText="Deactivate Account"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UsersList;
