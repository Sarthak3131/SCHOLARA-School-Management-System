import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  FileBarChart2,
  ShieldAlert,
  LogOut,
  X,
  Compass,
} from 'lucide-react';
import { ROLES } from '@/utils/constants.js';

export const Sidebar = ({
  role = ROLES.ADMIN,
  isOpen = false,
  onClose = () => {},
  onLogout = () => {},
  user = { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
}) => {
  const location = useLocation();

  // Navigation schema per role
  const navConfigs = {
    [ROLES.ADMIN]: [
      {
        section: 'Overview',
        items: [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'UI Components', path: '/design-system', icon: Compass },
        ],
      },
      {
        section: 'Academic & People',
        items: [
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
          { name: 'Classes & Sections', path: '/admin/classes', icon: BookOpen },
          { name: 'Guardians', path: '/admin/guardians', icon: Users },
        ],
      },
      {
        section: 'Operations',
        items: [
          { name: 'Daily Attendance', path: '/admin/attendance', icon: CalendarCheck },
          { name: 'Examinations', path: '/admin/exams', icon: Award },
          { name: 'Fee Ledger', path: '/admin/fees', icon: CreditCard },
        ],
      },
      {
        section: 'Analytics & Security',
        items: [
          { name: 'Reports', path: '/admin/reports', icon: FileBarChart2 },
          { name: 'Audit Trail', path: '/admin/audit', icon: ShieldAlert },
        ],
      },
    ],
    [ROLES.TEACHER]: [
      {
        section: 'Overview',
        items: [
          { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
        ],
      },
      {
        section: 'My Classroom',
        items: [
          { name: 'Assigned Classes', path: '/teacher/classes', icon: BookOpen },
          { name: 'Take Attendance', path: '/teacher/attendance', icon: CalendarCheck },
          { name: 'Marks Entry', path: '/teacher/marks', icon: Award },
        ],
      },
    ],
    [ROLES.GUARDIAN]: [
      {
        section: 'Overview',
        items: [
          { name: 'Ward Overview', path: '/guardian', icon: LayoutDashboard },
        ],
      },
      {
        section: 'Academics',
        items: [
          { name: 'Attendance Record', path: '/guardian/attendance', icon: CalendarCheck },
          { name: 'Report Cards', path: '/guardian/results', icon: Award },
          { name: 'Fee Invoices', path: '/guardian/fees', icon: CreditCard },
        ],
      },
    ],
  };

  const currentNav = navConfigs[role] || navConfigs[ROLES.ADMIN];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-forest text-white flex flex-col shadow-sidebar
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest-light/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-forest-light flex items-center justify-center border border-gold/40 shadow-inner">
              <span className="font-editorial text-gold font-bold text-lg leading-none">S</span>
            </div>
            <div>
              <span className="font-editorial text-lg tracking-wider text-ivory font-bold block leading-none">
                SCHOLARA
              </span>
              <span className="text-2xs text-gold tracking-widest uppercase font-mono mt-0.5 block">
                Editorial EdTech
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1 rounded focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Badge */}
        <div className="px-6 py-2.5 bg-forest-dark/50 border-b border-forest-light/20 flex items-center justify-between text-2xs">
          <span className="text-white/60 uppercase tracking-widest font-mono">Workspace Role</span>
          <span className="px-2 py-0.5 rounded bg-gold/20 text-gold font-semibold uppercase tracking-wider font-mono">
            {role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {currentNav.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 pb-2 text-2xs font-semibold uppercase tracking-widest text-white/40 font-mono">
                {section.section}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => onClose()}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-150
                          ${isActive
                            ? 'bg-gold/20 text-gold border-l-2 border-gold font-semibold pl-[10px]'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold' : 'text-white/60'}`} />
                        <span>{item.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Footer Profile & Logout */}
        <div className="p-4 border-t border-forest-light/30 bg-forest-dark/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-forest-light flex items-center justify-center text-gold font-editorial font-bold border border-gold/30 shrink-0">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ivory truncate">{user.name}</p>
                <p className="text-2xs text-white/50 truncate font-mono">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="text-white/60 hover:text-gold p-1.5 rounded transition-colors focus:outline-none"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
