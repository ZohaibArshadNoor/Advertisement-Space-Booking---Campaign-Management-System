import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="app-main">
        <TopHeader
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
        />

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
