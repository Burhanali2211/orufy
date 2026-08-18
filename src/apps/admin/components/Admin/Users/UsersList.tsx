import { apiClient } from '@/shared/lib/apiClient';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit, Trash2, Power, Users as UsersIcon, X, ChevronLeft, ChevronRight, Shield, ShoppingBag } from 'lucide-react';
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
  const map: Record<string, string> = {
    admin: 'bg-purple-50 text-purple-600 border-purple-200',
    seller: 'bg-blue-50 text-blue-600 border-blue-100',
    customer: 'bg-green-50 text-green-700 border-green-200',
  };
  return map[role] || 'bg-gray-100 text-gray-600 border-gray-200';
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
        id: p.id, email: p.email || '', full_name: p.full_name || '',
        role: p.role || 'customer', is_active: p.is_active !== false,
        email_verified: true, created_at: p.created_at, 
        order_count: p.order_count || 0, total_spent: p.total_spent || '0'
      }));
      
      const ti = rows.length;
      const tp = Math.max(1, Math.ceil(ti / pageSize));
      
      // Client-side pagination
      const from = (currentPage - 1) * pageSize;
      const paginatedRows = rows.slice(from, from + pageSize);
      
      setUsers(paginatedRows);
      setTotalItems(ti);
      setTotalPages(tp);
      
      if (currentPage === 1 && !searchTerm && !roleFilter && !statusFilter) {
        _usersCache = { users: paginatedRows, totalItems: ti, totalPages: tp };
      }
    } catch (error: any) {
      if (!background) showError('Error', error?.message || 'Failed to load users');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setDeleteLoading(true);
      await apiClient.put(`/profiles/${selectedUser.id}`, { is_active: false });
      
      showSuccess('Done', 'User deactivated successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to deactivate user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiClient.put(`/profiles/${user.id}`, { is_active: !user.is_active });
      
      showSuccess('Updated', `User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to update user status');
    }
  };

  const clearFilters = () => { setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); setCurrentPage(1); };
  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  const activeCount = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  const statCards = [
    { label: 'Total Users', value: totalItems, icon: UsersIcon, iconCls: 'text-gray-600', bg: 'bg-gray-50', valCls: 'text-gray-900' },
    { label: 'Active', value: activeCount, icon: UsersIcon, iconCls: 'text-green-700', bg: 'bg-green-50', valCls: 'text-green-700' },
    { label: 'Admins', value: adminCount, icon: Shield, iconCls: 'text-purple-600', bg: 'bg-purple-50', valCls: 'text-purple-600' },
  ];

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 rounded-full text-sm font-medium transition-colors ${p === currentPage ? 'bg-stone-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>;
              return null;
            })}
          </div>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-600 font-medium">Manage user accounts and permissions</p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-colors min-h-11 shadow-sm text-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${s.bg} rounded-full flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.iconCls}`} />
            </div>
            <p className="text-sm text-gray-600 font-medium">{s.label}</p>
            <p className={`text-[28px] font-normal ${s.valCls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No users found</p>
          {hasActiveFilters && <p className="text-sm text-gray-600 mt-1">Try adjusting your filters</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#e8eaed]">
            {users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-semibold text-gray-600">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-base text-gray-900 truncate">{user.full_name || '—'}</p>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleStatus(user)}
                      className={`p-2 rounded-full transition-colors ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-700 hover:bg-green-50'}`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}>
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${getRoleBadge(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${user.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[12px] text-gray-600 ml-auto">{formatDate(user.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">User</th>
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Role</th>
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Orders</th>
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Spent</th>
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Status</th>
                  <th className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Joined</th>
                  <th className="text-right text-sm font-semibold text-gray-600 uppercase tracking-wide px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaed]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{user.full_name || '—'}</p>
                          <p className="text-[12px] text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${getRoleBadge(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.order_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{Number(user.total_spent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${user.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-full transition-colors min-h-10 min-w-10 flex items-center justify-center ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-700 hover:bg-green-50'}`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}>
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors min-h-10 min-w-10 flex items-center justify-center" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors min-h-10 min-w-10 flex items-center justify-center" title="Delete">
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
