import React from 'react';
import { Power, Edit, Trash2 } from 'lucide-react';
import { User } from './types';
import { getRoleBadge, formatDate } from './utils';

interface UserMobileListProps {
  users: User[];
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserMobileList: React.FC<UserMobileListProps> = ({
  users,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  return (
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
              <button onClick={() => onToggleStatus(user)}
                className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                title={user.is_active ? 'Deactivate' : 'Activate'}>
                <Power className="h-4 w-4" />
              </button>
              <button onClick={() => onEdit(user)}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(user)}
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
  );
};

