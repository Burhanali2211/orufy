import React from 'react';
import { Power, Edit, Trash2 } from 'lucide-react';
import { User } from './types';
import { getRoleBadge, formatDate } from './utils';

interface UserDesktopTableProps {
  users: User[];
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserDesktopTable: React.FC<UserDesktopTableProps> = ({
  users,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  return (
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
                  ₹{(Number(user.total_spent || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  <button onClick={() => onToggleStatus(user)}
                    className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    title={user.is_active ? 'Deactivate' : 'Activate'}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => onEdit(user)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(user)}
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
  );
};

