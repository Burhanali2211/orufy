import { User } from './types';

export const getRoleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    seller: 'bg-blue-100 text-blue-700 border border-blue-200',
    customer: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return map[role] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
