import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface DropdownItem {
  name: string;
  href: string;
  description?: string;
}

interface NavDropdownProps {
  items: DropdownItem[];
}

export const NavDropdown: React.FC<NavDropdownProps> = ({ items }) => {
  return (
    <div className="absolute top-full left-0 mt-3 w-64 glass-effect-medium rounded-xl shadow-2xl animate-fade-in-down">
      <div className="p-2">
        {items.map((item, index) => (
          <Link
            key={`${item.href}-${index}`}
            to={item.href}
            className="group block px-4 py-3 text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};