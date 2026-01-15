
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSearch, FiLayers, FiMap, FiMessageSquare, FiClipboard, FiBriefcase } from 'react-icons/fi';

const navItems = [
  { to: '/', icon: FiGrid, label: 'Visão Geral' },
  { to: '/consulta', icon: FiSearch, label: 'Consulta' },
  { to: '/comparacao', icon: FiLayers, label: 'Comparação' },
  { to: '/roadmap', icon: FiMap, label: 'Roadmap' },
  { to: '/planejamento', icon: FiClipboard, label: 'Planejamento' },
  { to: '/inteligencia', icon: FiBriefcase, label: 'Inteligência' },
];

const Sidebar: React.FC = () => {
  return (
    <nav className="bg-white dark:bg-dark-200 border-b border-slate-200/60 dark:border-dark-100 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6">
        <ul className="flex items-center space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `flex items-center px-6 py-4 transition-all duration-200 border-b-2 ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent hover:bg-slate-50 dark:hover:bg-dark-100 hover:text-primary'}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;

export default Sidebar;