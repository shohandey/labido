import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Package, XCircle } from 'lucide-react';
import { useApp } from '../store/AppContext.jsx';
import { equipment as allEquipment } from '../data/equipment.js';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import toast from 'react-hot-toast';

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

const STATUS_TABS = ['All', 'Pending review', 'Approved', 'Rejected', 'Cancelled'];

const statusMap = {
  'Pending review': 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
};

export default function MyBookings() {
  const navigate = useNavigate();
  const { bookings, cancelBooking } = useApp();
  const [activeTab, setActiveTab] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  const filtered =
    activeTab === 'All'
      ? bookings
      : bookings.filter((b) => b.status === statusMap[activeTab]);

  const sorted = [...filtered].sort((a, b) => b.createdAt?.localeCompare(a.createdAt));

  async function handleCancel(id, name) {
    if (window.confirm(`Cancel your booking for "${name}"?`)) {
      setCancellingId(id);
      try {
        await cancelBooking(id);
        toast.success('Booking cancelled.');
      } catch (err) {
        toast.error(err.message || 'Failed to cancel booking.');
      } finally {
        setCancellingId(null);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">My bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            All your equipment booking requests in one place.
          </p>
        </div>
        <button onClick={() => navigate('/find')} className="btn-primary">
          Book more equipment <ArrowRight size={15} />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? bookings.length
              : bookings.filter((b) => b.status === statusMap[tab]).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-slate-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No bookings here"
          description="You haven't made any booking requests yet. Find equipment and book a slot."
          action={
            <button onClick={() => navigate('/find')} className="btn-primary">
              Find equipment
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((bk) => {
            const eq = allEquipment.find((e) => e.id === bk.equipmentId);
            const canCancel = bk.status === 'pending';

            return (
              <div key={bk.id} className="card p-5 flex flex-col sm:flex-row gap-4 sm:items-start">
                {/* Emoji */}
                <div className="text-3xl leading-none select-none shrink-0" aria-hidden="true">
                  {eq?.emoji || '🔬'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{bk.equipmentName}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{eq?.department}</p>
                    </div>
                    <StatusBadge status={bk.status} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">{bk.projectName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{bk.projectDescription}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {fmtDate(bk.date)}
                    </span>
                    <span>
                      {fmtTime(bk.startTime)} – {fmtTime(bk.endTime)}
                    </span>
                    <span className="text-slate-400">
                      Deadline: {fmtDate(bk.deadline)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/equipment/${bk.equipmentId}`)}
                    className="btn-secondary text-xs py-1.5"
                  >
                    View equipment
                  </button>
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(bk.id, bk.equipmentName)}
                      disabled={cancellingId === bk.id}
                      className="btn-danger text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={13} />
                      {cancellingId === bk.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
