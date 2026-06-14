import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { logout } from '../../api/portalApi';

interface LogoutButtonProps {
  className?: string;
  compact?: boolean;
}

export const LogoutButton = ({ className = '', compact = false }: LogoutButtonProps) => (
  <button
    type="button"
    onClick={logout}
    className={`flex items-center w-full text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
      compact ? 'px-2 py-2 justify-center' : 'px-3 py-2.5'
    } ${className}`}
  >
    <ArrowRightOnRectangleIcon className={`w-5 h-5 flex-shrink-0 ${compact ? '' : 'mr-3'}`} />
    {!compact && 'Déconnexion'}
  </button>
);
