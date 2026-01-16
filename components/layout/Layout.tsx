

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100">
      <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth p-6 lg:p-10 relative bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1920px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;