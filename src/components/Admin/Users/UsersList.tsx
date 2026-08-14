import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit, Trash2, Power, Users as UsersIcon, Filter, X, ChevronLeft, ChevronRight, Shield, ShoppingBag } from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
import { supabase } from '../../../lib/legacyDb';
import { useNotification } from '../../../contexts/NotificationContext';
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
    admin: 'bg-[#f3e8fd] text-[#a142f4] border-[#e9d2fd]',
    seller: 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]',
    customer: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
  };
  return map[role] || 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]';
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
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (roleFilter) query = query.eq('role', roleFilter);
      if (statusFilter === 'active') query = query.eq('is_active', true);
      if (statusFilter === 'inactive') query = query.eq('is_active', false);
      if (searchTerm) query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      const { data, error, count } = await query.range(from, to);
      
      const rows = (data || []).map((p: any) => ({
        id: p.id, email: p.email || '', full_name: p.full_name || '',
        role: p.role || 'customer', is_active: p.is_active !== false,
        email_verified: true, created_at: p.created_at, order_count: 0, total_spent: '0'
      }));
      const ti = count ?? 0;
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
      await apiClient.put(`/profiles/${selectedUser.id}`, { is_active: false });
      
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
      await apiClient.put(`/profiles/${user.id}`, { is_active: !user.is_active });
      
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
    { label: 'Total Users', value: totalItems, icon: UsersIcon, iconCls: 'text-[#5f6368]', bg: 'bg-[#f8f9fa]', valCls: 'text-[#202124]' },
    { label: 'Active', value: activeCount, icon: UsersIcon, iconCls: 'text-[#137333]', bg: 'bg-[#e6f4ea]', valCls: 'text-[#137333]' },
    { label: 'Admins', value: adminCount, icon: Shield, iconCls: 'text-[#a142f4]', bg: 'bg-[#f3e8fd]', valCls: 'text-[#a142f4]' },
    { label: 'Sellers', value: sellerCount, icon: ShoppingBag, iconCls: 'text-[#1a73e8]', bg: 'bg-[#e8f0fe]', valCls: 'text-[#1a73e8]' },
  ];

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-6 py-4 border-t border-[#e8eaed] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-[13px] text-[#5f6368]">
          Showing <span className="font-medium text-[#202124]">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-[#202124]">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-[#202124]">{totalItems}</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
            className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 rounded-full text-[13px] font-medium transition-colors ${p === currentPage ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="w-8 h-8 flex items-center justify-center text-[#9aa0a6] text-[13px]">…</span>;
              return null;
            })}
          </div>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
            className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
          <div className="w-12 h-12 bg-[#e8f0fe] rounded-2xl flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Users</h1>
            <p className="text-[13px] text-[#5f6368] font-medium">Manage user accounts and permissions</p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setShowFormModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium transition-colors min-h-[44px] shadow-sm text-[14px]"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${s.bg} rounded-full flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.iconCls}`} />
            </div>
            <p className="text-[13px] text-[#5f6368] font-medium">{s.label}</p>
            <p className={`text-[28px] font-normal ${s.valCls}`} style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-5 py-3 text-[14px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-[#5f6368]">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-16 text-center">
          <UsersIcon className="w-10 h-10 text-[#dadce0] mx-auto mb-3" />
          <p className="text-[14px] text-[#5f6368]">No users found</p>
          {hasActiveFilters && <p className="text-[13px] text-[#5f6368] mt-1">Try adjusting your filters</p>}
        </div>
      ) : (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#e8eaed]">
            {users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-[#f8f9fa] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
                      <span className="text-[16px] font-semibold text-[#5f6368]">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[15px] text-[#202124] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{user.full_name || '—'}</p>
                      <p className="text-[13px] text-[#5f6368] truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleStatus(user)}
                      className={`p-2 rounded-full transition-colors ${user.is_active ? 'text-[#f29900] hover:bg-[#fef7e0]' : 'text-[#137333] hover:bg-[#e6f4ea]'}`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}>
                      <Power className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                      className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                      className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${getRoleBadge(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${user.is_active ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[12px] text-[#5f6368] ml-auto">{formatDate(user.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e8eaed]">
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">User</th>
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Role</th>
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Orders</th>
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Spent</th>
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Status</th>
                  <th className="text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Joined</th>
                  <th className="text-right text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaed]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#f1f3f4] flex items-center justify-center flex-shrink-0">
                          <span className="text-[14px] font-semibold text-[#5f6368]">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[14px] text-[#202124] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{user.full_name || '—'}</p>
                          <p className="text-[12px] text-[#5f6368] truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${getRoleBadge(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#202124]">{user.order_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-medium text-[#202124]">
                        ₹{Number(user.total_spent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${user.is_active ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#5f6368]">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${user.is_active ? 'text-[#f29900] hover:bg-[#fef7e0]' : 'text-[#137333] hover:bg-[#e6f4ea]'}`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}>
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowFormModal(true); }}
                          className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center" title="Delete">
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
