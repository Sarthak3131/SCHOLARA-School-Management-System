import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

/**
 * SCHOLARA AppLayout Component
 * Standard responsive app shell wrapping Sidebar, Topbar, and Content Area.
 */
export const AppLayout = ({
  children,
  role = 'admin',
  title = 'SCHOLARA',
  subtitle = '',
  user = { name: 'Dr. Arthur Vance', role: 'admin', email: 'admin@scholara.edu' },
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        <Topbar
          onMenuToggle={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
