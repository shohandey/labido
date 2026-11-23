import { useState, useEffect } from 'react';
import { Briefcase, FileVideo, ShieldCheck, Wrench, Activity, AlertTriangle } from 'lucide-react';
import { getHealth, getCases, getEvidence } from '../api';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#12141a] border border-[#2a2d38] p-4 rounded-xl flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-[${color}]/10 text-[${color}]`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-[#8b8fa3] text-sm mb-1">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ cases: 0, evidence: 0 });

  useEffect(() => {
    getHealth().then(setHealth).catch(console.error);
    getCases().then(res => setStats(s => ({ ...s, cases: res.length }))).catch(console.error);
    getEvidence().then(res => setStats(s => ({ ...s, evidence: res.length }))).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Active Cases" value={stats.cases} color="#00d4ff" />
        <StatCard icon={FileVideo} label="Total Evidence" value={stats.evidence} color="#3b82f6" />
        <StatCard icon={ShieldCheck} label="Verified Evidence" value={0} color="#22c55e" />
        <StatCard icon={Wrench} label="Recovery Candidates" value={0} color="#f59e0b" />
        <StatCard icon={Activity} label="Analysis Events" value={0} color="#a855f7" />
        <StatCard icon={AlertTriangle} label="Integrity Alerts" value={0} color="#ef4444" />
      </div>

      <div className="bg-[#12141a] border border-[#2a2d38] p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 border-b border-[#2a2d38] pb-2">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></div>
            <span className="text-sm">API Server</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.db === 'connected' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></div>
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-[#22c55e]`}></div>
            <span className="text-sm">Analysis Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
