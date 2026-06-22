import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShieldCheckIcon,
  FireIcon,
  LightBulbIcon,
  ViewColumnsIcon,
  BeakerIcon,
  CloudIcon,
  BellIcon,
  Cog6ToothIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { LogoutButton } from './LogoutButton';
import { usePortalSession, formatUserDisplayName } from '../../context/PortalSessionContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const adminNavItems: NavItem[] = [
  { to: '/admin/regression', icon: ClipboardDocumentCheckIcon, label: 'Tests non-régression' },
];

const navItems: NavItem[] = [
  { to: '/dashboard', icon: HomeIcon, label: 'Tableau de bord' },
  { to: '/security', icon: ShieldCheckIcon, label: 'Sécurité' },
  { to: '/heating', icon: FireIcon, label: 'Chauffage' },
  { to: '/lighting', icon: LightBulbIcon, label: 'Éclairage' },
  { to: '/scenarios', icon: BoltIcon, label: 'Scénarios' },
  { to: '/shutters', icon: ViewColumnsIcon, label: 'Volets & Stores' },
  { to: '/water-heater', icon: BeakerIcon, label: 'Cumulus' },
  { to: '/sprinkler', icon: CloudIcon, label: 'Arrosage' },
  { to: '/notifications', icon: BellIcon, label: 'Notifications' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Paramètres' },
];

export const SidebarMenu: React.FC = () => {
  const { session } = usePortalSession();
  const displayName = formatUserDisplayName(session);
  const armoire = session?.armoire;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <img 
          src="/portal/images/logosml.png" 
          alt="Essensys Portail" 
          className="h-8"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="ml-2 font-semibold text-gray-800">Portail</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-essensys-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Administration
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-essensys-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-2">
        {session && (
          <div className="px-3 py-2 mb-1 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs font-medium text-gray-800 truncate" title={displayName}>{displayName}</p>
            {armoire ? (
              <p className="text-xs text-gray-500 truncate" title={armoire.no_serie}>
                Armoire {armoire.no_serie}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Aucune armoire liée</p>
            )}
          </div>
        )}
        <LogoutButton />
        <p className="px-3 text-xs text-gray-500">Mon Essensys v1.2.0</p>
      </div>
    </aside>
  );
};

export { navItems, adminNavItems };
export type { NavItem };
