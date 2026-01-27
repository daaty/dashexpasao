
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
    <nav className="shadow-sm" style={{ 
      background: 'rgb(255 255 255 / 5%)', 
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgb(255 255 255 / 8%)' 
    }}>
      <div className="max-w-[1920px] mx-auto px-6">
        <ul className="flex items-center space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `flex items-center px-6 py-4 transition-all duration-200 border-b-2 ${isActive ? 'border-blue-500' : 'border-transparent'}`}
                style={({ isActive }) => ({
                  color: isActive ? '#ffffff' : 'rgb(255 255 255 / 70%)',
                  background: isActive ? 'rgb(255 255 255 / 10%)' : 'transparent',
                  borderBottomColor: isActive ? '#3b82f6' : 'transparent'
                })}
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
