import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, FileVideo, Upload, 
  Wrench, Clock, BarChart3, Shield, Link as LinkIcon, 
  FileText, ChevronLeft, ChevronRight, Activity 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getHealth } from '../api';

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Cases', path: '/cases', icon: Briefcase },
      { name: 'Evidence', path: '/evidence', icon: FileVideo },
      { name: 'Acquisition', path: '/acquisition', icon: Upload },
      { name: 'Recovery', path: '/recovery', icon: Wrench },
      { name: 'Timeline', path: '/timeline', icon: Clock },
      { name: 'Analysis', path: '/analysis', icon: BarChart3 },
    ]
  },
  {
    title: 'INTEGRITY',
    items: [
      { name: 'Integrity', path: '/integrity', icon: Shield },
      { name: 'Chain of Custody', path: '/chain-of-custody', icon: LinkIcon },
    ]
  },
  {
    title: 'OUTPUT',
    items: [
      { name: 'Reports', path: '/reports', icon: FileText },
    ]
  }
];

export default function Sidebar({ expanded, setExpanded }) {
  const location = useLocation();
  const [status, setStatus] = useState('operational');

  useEffect(() => {
    getHealth().then(() => setStatus('operational')).catch(() => setStatus('error'));
  }, []);

  return (
    <div className={`flex flex-col bg-[#0d0e14] border-r border-[#2a2d38] transition-all duration-300 ${expanded ? 'w-64' : 'w-20'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#2a2d38]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-[#00d4ff] flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L22 12L12 22L2 12L12 2Z" />
            </svg>
          </div>
          {expanded && <span className="font-bold text-[#00d4ff] tracking-widest whitespace-nowrap">PRAMAANSYNC</span>}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-none">
        {navGroups.map((group, i) => (
          <div key={i} className="px-3">
            {expanded && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-[#5a5e72] uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                        isActive 
                          ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-l-2 border-[#00d4ff]' 
                          : 'text-[#8b8fa3] hover:bg-[#1a1d26] hover:text-[#e2e4e9] border-l-2 border-transparent'
                      }`}
                      title={!expanded ? item.name : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {expanded && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#2a2d38]">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className={`w-4 h-4 ${status === 'operational' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`} />
          {expanded && (
            <span className={`text-xs ${status === 'operational' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {status === 'operational' ? 'All systems operational' : 'System error'}
            </span>
          )}
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center w-full py-2 bg-[#1a1d26] hover:bg-[#2a2d38] rounded-lg transition-colors text-[#8b8fa3]"
        >
          {expanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
