import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit, Trash2, Power, Users as UsersIcon, Filter, X, Loader2, ChevronLeft, ChevronRight, Shield, ShoppingBag } from 'lucide-react';
import { ConfirmModal } from '@/components/Common/Modal';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
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
  const map: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    seller: 'bg-blue-100 text-blue-700 border border-blue-200',
    customer: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return map[role] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

// Module-level cache – survives SPA navigation, cleared on hard refresh
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

  const pageSize = 10;

  useEffect(() => {
    const background = isFirstMount.current && _usersCache !== null;
    isFirstMount.current = false;
    fetchUsers(background);
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const res = await apiClient.get<{ success: boolean; data: User[]; total: number; error?: string }>(`/dashboard/users?${params}`);
      if (!res.success || res.error) throw new Error(res.error || 'Failed to fetch users');

      const rows = res.data;
      const ti = res.total;
      const tp = Math.max(1, Math.ceil(ti / pageSize));
      setUsers(rows);
      setTotalItems(ti);
      setTotalPages(tp);
      if (currentPage === 1 && !searchTerm && !roleFilter && !statusFilter) {
        _usersCache = { users: rows, totalItems: ti, totalPages: tp };
      }
    } catch (error: any) {
      if (!background) showError('Error', error.message || 'Failed to load users');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setDeleteLoading(true);
      const res = await apiClient.patch<{ success: boolean; error?: string }>(`/dashboard/users/${selectedUser.id}`, { is_active: false });
      if (!res.success || res.error) throw new Error(res.error || 'Failed to deactivate user');
      showSuccess('Done', 'User deactivated successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to deactivate user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await apiClient.patch<{ success: boolean; error?: string }>(`/dashboard/users/${user.id}`, { is_active: !user.is_active });
      if (!res.success || res.error) throw new Error(res.error || 'Failed to update user status');
      showSuccess('Updated', `User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update user status');
    }
  };

  const clearFilters = () => { setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); setCurrentPage(1); };
  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  const activeCount = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const sellerCount = users.filter(u => u.role === 'seller').length;

  const statCards = [
    { label: 'Total', value: totalItems, icon: UsersIcon, iconCls: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Active', value: activeCount, icon: UsersIcon, iconCls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Admins', value: adminCount, icon: Shield, iconCls: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Sellers', value: sellerCount, icon: ShoppingBag, iconCls: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  ];

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-700">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-gray-700">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-700">{totalItems}</span>
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
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
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
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
            <UsersIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Stat Cards — compact 4-col always */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 sm:p-4`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm`}>
              <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.iconCls}`} />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
          {hasActiveFilters && <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-600">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{user.full_name || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleStatus(user)}
                      className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}>
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${getRoleBadge(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${user.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(user.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Orders</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Spent</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Joined</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{user.full_name || '—'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getRoleBadge(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{user.order_count || 0}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{Number(user.total_spent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${user.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}>
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination />
        </div>
      )}

      {/* User Form Modal */}
      {showFormModal && (
        <UserForm
          user={selectedUser}
          onClose={() => { setShowFormModal(false); setSelectedUser(null); }}
          onSuccess={() => { setShowFormModal(false); setSelectedUser(null); fetchUsers(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
        onConfirm={handleDelete}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${selectedUser?.full_name}"?`}
        confirmText="Deactivate"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
