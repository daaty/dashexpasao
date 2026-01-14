
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSearch, FiLayers, FiMap, FiMessageSquare, FiChevronsLeft, FiChevronsRight, FiClipboard, FiBriefcase } from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { to: '/', icon: FiGrid, label: 'Dashboard' },
  { to: '/consulta', icon: FiSearch, label: 'Consulta' },
  { to: '/comparacao', icon: FiLayers, label: 'Comparação' },
  { to: '/roadmap', icon: FiMap, label: 'Roadmap' },
  { to: '/planejamento', icon: FiClipboard, label: 'Planejamento' },
  { to: '/inteligencia', icon: FiBriefcase, label: 'Inteligência' },
  // { to: '/assistente', icon: FiMessageSquare, label: 'Assistente AI' }, // IA desabilitada
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <aside className={`relative bg-base-100 dark:bg-dark-200 text-content dark:text-dark-content flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center justify-between h-16 border-b border-base-300 dark:border-dark-100 ${isOpen ? 'px-6' : 'px-4'}`}>
        <span className={`font-bold text-xl text-primary transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Urban<span className="font-light">Passageiro</span>
        </span>
         <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-base-200 dark:hover:bg-dark-100 absolute -right-4 top-5 bg-base-100 dark:bg-dark-200 border border-base-300 dark:border-dark-100 shadow-md">
           {isOpen ? <FiChevronsLeft /> : <FiChevronsRight/>}
         </button>
      </div>
      <nav className="flex-1 mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.to} className="px-4 mb-2">
              <NavLink
                to={item.to}
                className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-base-200 dark:hover:bg-dark-100'}`}
              >
                <item.icon className={`h-6 w-6 ${isOpen ? 'mr-4' : 'mx-auto'}`} />
                <span className={`font-medium transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;