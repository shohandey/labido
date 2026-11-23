import { Search, Bell, User } from 'lucide-react';
import { useState } from 'react';

export default function TopNav() {
  const [search, setSearch] = useState('');

  return (
    <header className="h-16 bg-[#12141a] border-b border-[#2a2d38] flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl flex items-center gap-2 bg-[#0a0b0f] border border-[#2a2d38] rounded-md px-3 py-1.5 focus-within:border-[#00d4ff] focus-within:ring-1 focus-within:ring-[#00d4ff] transition-all">
        <Search className="w-4 h-4 text-[#5a5e72]" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search evidence, cases, hashes..."
          className="bg-transparent border-none outline-none w-full text-sm placeholder-[#5a5e72]"
        />
      </div>

      <div className="flex items-center gap-6">
        <select className="bg-[#1a1d26] border border-[#2a2d38] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#00d4ff]">
          <option>All Cases</option>
          <option>Case #0042 - City Center</option>
        </select>

        <button className="relative text-[#8b8fa3] hover:text-[#e2e4e9]">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00d4ff] rounded-full border-2 border-[#12141a]"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[#2a2d38]">
          <div className="w-8 h-8 rounded-full bg-[#1a1d26] flex items-center justify-center border border-[#2a2d38]">
            <User className="w-4 h-4 text-[#8b8fa3]" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Investigator</div>
            <div className="text-[#5a5e72] text-xs">PramaanSync Unit</div>
          </div>
        </div>
      </div>
    </header>
  );
}
