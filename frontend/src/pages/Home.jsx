import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Package, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext.jsx';
import { equipment as allEquipment } from '../data/equipment.js';
import EquipmentCard from '../components/EquipmentCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LabidoLogo from '../components/LabidoLogo.jsx';

const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const p = h < 12 ? 'AM' : 'PM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${p}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { bookings, requests } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const totalAvailable = allEquipment.reduce((sum, e) => sum + e.available, 0);
  const totalItems = allEquipment.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  const upcomingBookings = bookings
    .filter((b) => ['approved', 'pending'].includes(b.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const popular = [...allEquipment]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 4);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/find${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center space-y-6 pt-2 pb-2">
        <div className="flex flex-col items-center">
          <LabidoLogo variant="full" iconSize={68} className="mb-2" />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mt-1">
            Find the lab equipment you need
          </h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base max-w-lg">
            Search across campus departments, check real-time availability, and reserve equipment seamlessly.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9 h-11 text-base"
                placeholder="Search for oscilloscope, Arduino, 3D printer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary h-11 px-5 text-sm">
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[
          { icon: Package, value: totalItems, label: 'Types of equipment', color: 'text-blue-600 bg-blue-50' },
          { icon: CheckCircle, value: totalAvailable, label: 'Available right now', color: 'text-green-600 bg-green-50' },
          { icon: Clock, value: pendingRequests, label: 'Pending reviews', color: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </section>

      {/* Upcoming bookings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Upcoming bookings</h2>
          <button
            onClick={() => navigate('/my-bookings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            See all <ArrowRight size={14} />
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-sm">
            No upcoming bookings yet.{' '}
            <button onClick={() => navigate('/find')} className="text-blue-600 font-medium hover:underline">
              Find equipment to book.
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingBookings.map((bk) => (
              <div key={bk.id} className="card px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl select-none" aria-hidden="true">
                    {allEquipment.find((e) => e.id === bk.equipmentId)?.emoji || '🔬'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{bk.equipmentName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{bk.projectName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">{fmtDate(bk.date)}</p>
                    <p className="text-xs text-slate-400">{fmtTime(bk.startTime)} – {fmtTime(bk.endTime)}</p>
                  </div>
                  <StatusBadge status={bk.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular equipment */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Popular equipment</h2>
          <button
            onClick={() => navigate('/find')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Browse all <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popular.map((item) => (
            <EquipmentCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card p-8 text-center bg-gradient-to-br from-blue-50 to-slate-50">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Need something specific?</h2>
        <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
          Browse the full equipment catalog, filter by department, and check real-time availability.
        </p>
        <button onClick={() => navigate('/find')} className="btn-primary">
          Find equipment <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}
