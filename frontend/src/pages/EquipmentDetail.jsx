import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Layers, Clock, Info, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { equipment as allEquipment } from '../data/equipment.js';
import { useApp } from '../store/AppContext.jsx';
import { findAvailableSlots } from '../utils/conflicts.js';
import BookingForm from '../components/BookingForm.jsx';
import EmptyState from '../components/EmptyState.jsx';

const today = new Date().toISOString().split('T')[0];

const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const p = h < 12 ? 'AM' : 'PM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${p}`;
};

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [previewDate, setPreviewDate] = useState(today);

  const item = allEquipment.find((e) => e.id === id);

  if (!item) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Equipment not found"
        description="This item doesn't exist or may have been removed."
        action={
          <button onClick={() => navigate('/find')} className="btn-primary">
            Back to equipment
          </button>
        }
      />
    );
  }

  const isAvailable = item.available > 0;
  const slots = findAvailableSlots(bookings, item.id, previewDate, 120);

  // Bookings for this item on the preview date
  const dayBookings = bookings.filter(
    (b) => b.equipmentId === item.id && b.date === previewDate && ['approved', 'pending'].includes(b.status)
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl leading-none select-none" aria-hidden="true">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <h1 className="page-title leading-tight">{item.name}</h1>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${
                      isAvailable
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {isAvailable ? `${item.available} of ${item.quantity} available` : 'Currently unavailable'}
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-600 mt-1">{item.department}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 text-sm text-slate-600">
                <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Location</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.lab}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-slate-600">
                <Layers size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Quantity</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.quantity} units total</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-slate-600">
                <Clock size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Max booking duration</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.maxHoursPerBooking} hours per session</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-slate-600">
                <Info size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Requirements</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.requirements}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Availability preview */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                Check availability
              </h2>
              <input
                type="date"
                className="input-field w-auto text-sm py-1.5"
                min={today}
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
              />
            </div>

            {/* Bookings on this day */}
            {dayBookings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Already booked:</p>
                {dayBookings.map((bk) => (
                  <div key={bk.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <span className="text-red-700">
                      <strong>{fmtTime(bk.startTime)} – {fmtTime(bk.endTime)}</strong> — booked
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Free slots */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Free 2-hour slots:
              </p>
              {slots.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No free slots on this day. Try another date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.slice(0, 10).map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-50 border border-green-100 text-green-700 px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle size={11} />
                      {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                    </span>
                  ))}
                  {slots.length > 10 && (
                    <span className="text-xs text-slate-400 py-1">+{slots.length - 10} more slots</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: booking CTA */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4 sticky top-24">
            <h2 className="section-title">Book this equipment</h2>

            {!isAvailable ? (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                  All units are currently in use or under maintenance. You can still submit a request and we'll contact you when it becomes available.
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-secondary w-full justify-center"
                >
                  Request anyway
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Pick a date and time that works for you. We'll check availability automatically when you submit.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary w-full justify-center text-base py-2.5"
                >
                  Book this
                </button>
              </>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-400">
              <p>✓ Your request will be reviewed by faculty</p>
              <p>✓ You'll see the status update immediately</p>
              <p>✓ Conflict detection is automatic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking form modal */}
      {showForm && (
        <BookingForm equipment={item} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
