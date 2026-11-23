import { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, Clock, User, BookOpen, FileText, Flag } from 'lucide-react';
import { useApp } from '../store/AppContext.jsx';
import { checkConflict } from '../utils/conflicts.js';
import { getSuggestions } from '../utils/suggestions.js';
import SuggestionCard from './SuggestionCard.jsx';
import { equipment as allEquipment } from '../data/equipment.js';
import toast from 'react-hot-toast';

const today = (() => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  d.setMinutes(d.getMinutes() - offset);
  return d.toISOString().split('T')[0];
})();

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function BookingForm({ equipment, onClose }) {
  const { bookings, addBooking, acceptSuggestion } = useApp();

  const [form, setForm] = useState({
    studentName: '',
    projectName: '',
    projectDescription: '',
    date: today,
    startTime: '09:00',
    endTime: '11:00',
    deadline: '',
  });

  const [errors, setErrors] = useState({});
  const [conflict, setConflict] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Clear conflict check when time fields change
  useEffect(() => {
    setConflict(null);
    setSuggestions([]);
  }, [form.date, form.startTime, form.endTime]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.studentName.trim()) e.studentName = 'Please enter your name.';
    if (!form.projectName.trim()) e.projectName = 'Please enter a project name.';
    if (!form.projectDescription.trim()) e.projectDescription = 'Give a short description of your project.';
    if (!form.date) e.date = 'Please pick a date.';
    else if (form.date < today) e.date = 'The date cannot be in the past.';
    if (!form.startTime) e.startTime = 'Please choose a start time.';
    if (!form.endTime) e.endTime = 'Please choose an end time.';
    if (form.startTime && form.endTime) {
      const startMinutes = timeToMinutes(form.startTime);
      const endMinutes = timeToMinutes(form.endTime);
      const openingMinutes = timeToMinutes('08:00');
      const closingMinutes = timeToMinutes('20:00');

      if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
        e.startTime = 'Bookings must be within 08:00 AM and 08:00 PM.';
        e.endTime = 'Bookings must be within 08:00 AM and 08:00 PM.';
      }
      if (endMinutes <= startMinutes) {
        e.endTime = 'End time must be after start time.';
      }
      if (form.date === today && startMinutes <= (new Date().getHours() * 60 + new Date().getMinutes())) {
        e.startTime = 'For today, choose a start time that has not passed.';
      }
      const duration = endMinutes - startMinutes;
      if (duration < 30) e.endTime = 'Booking must be at least 30 minutes.';
      if (duration > equipment.maxHoursPerBooking * 60) {
        e.endTime = `Maximum booking duration is ${equipment.maxHoursPerBooking} hours for this equipment.`;
      }
    }
    if (!form.deadline) e.deadline = 'Please enter your project deadline.';
    else if (form.deadline < form.date) e.deadline = 'Deadline cannot be before the booking date.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Check conflict
    const { conflict: hasConflict, conflictingBooking } = checkConflict(
      bookings,
      equipment.id,
      form.date,
      form.startTime,
      form.endTime
    );

    if (hasConflict) {
      setConflict(conflictingBooking);
      // Generate suggestions
      const suggs = getSuggestions(allEquipment, bookings, {
        equipmentId: equipment.id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        deadline: form.deadline,
      });
      setSuggestions(suggs);
      return;
    }

    // No conflict — submit
    submitBooking();
  }

  async function submitBooking() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await addBooking({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        studentName: form.studentName.trim(),
        projectName: form.projectName.trim(),
        projectDescription: form.projectDescription.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        deadline: form.deadline,
      });
      setSubmitted(true);
      toast.success('Your booking request has been sent for review!');
    } catch (err) {
      if (err.status === 409 || err.detail?.conflicting_booking) {
        const conflicting = err.detail?.conflicting_booking || null;
        setConflict(conflicting || { startTime: form.startTime, endTime: form.endTime });
        const suggs = getSuggestions(allEquipment, bookings, {
          equipmentId: equipment.id,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          deadline: form.deadline,
        });
        setSuggestions(suggs);
        toast.error(err.message || 'Time slot is already booked.');
      } else {
        toast.error(err.message || 'Failed to submit booking request.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptSuggestion(suggestion) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await acceptSuggestion(suggestion, null, {
        studentName: form.studentName.trim(),
        projectName: form.projectName.trim(),
        projectDescription: form.projectDescription.trim(),
        deadline: form.deadline,
      });
      toast.success(`New booking request created for "${suggestion.equipmentName}"!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to book alternative slot.');
    } finally {
      setSubmitting(false);
    }
  }

  const fmtTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  if (submitted) {
    return (
      <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="modal-content card max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request sent!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your booking request for <strong>{equipment.name}</strong> has been submitted. Faculty will review it shortly.
          </p>
          <button onClick={onClose} className="btn-primary w-full justify-center">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="modal-content card w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Request a slot</h2>
            <p className="text-xs text-slate-500 mt-0.5">{equipment.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Conflict warning */}
          {conflict && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">This time slot is already booked</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {equipment.name} is booked from {fmtTime(conflict.startTime)} to {fmtTime(conflict.endTime)} by another student.
                  </p>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Here are some alternatives:</p>
                  {suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} onAccept={handleAcceptSuggestion} />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setConflict(null); setSuggestions([]); }}
                className="text-xs text-amber-700 underline"
              >
                Pick a different time instead
              </button>
            </div>
          )}

          {/* Student Name */}
          <div>
            <label className="label">
              <User size={13} className="inline mr-1 text-slate-400" />
              Your name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Priya Sharma"
              value={form.studentName}
              onChange={(e) => set('studentName', e.target.value)}
            />
            {errors.studentName && <p className="text-xs text-red-500 mt-1">{errors.studentName}</p>}
          </div>

          {/* Project Name */}
          <div>
            <label className="label">
              <BookOpen size={13} className="inline mr-1 text-slate-400" />
              Project name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Smart Traffic Control System"
              value={form.projectName}
              onChange={(e) => set('projectName', e.target.value)}
            />
            {errors.projectName && <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>}
          </div>

          {/* Project Description */}
          <div>
            <label className="label">
              <FileText size={13} className="inline mr-1 text-slate-400" />
              What's the project about?
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Briefly describe what you're working on and why you need this equipment."
              value={form.projectDescription}
              onChange={(e) => set('projectDescription', e.target.value)}
            />
            {errors.projectDescription && <p className="text-xs text-red-500 mt-1">{errors.projectDescription}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label">
              <Calendar size={13} className="inline mr-1 text-slate-400" />
              Date
            </label>
            <input
              type="date"
              className="input-field"
              min={today}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                <Clock size={13} className="inline mr-1 text-slate-400" />
                Start time
              </label>
              <input
                type="time"
                className="input-field"
                min="08:00"
                max="20:00"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
              />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="label">End time</label>
              <input
                type="time"
                className="input-field"
                min="08:00"
                max="20:00"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
              />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="label">
              <Flag size={13} className="inline mr-1 text-slate-400" />
              Project deadline
            </label>
            <input
              type="date"
              className="input-field"
              min={form.date || today}
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
            {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
          </div>

          {/* Submit */}
          {!conflict && (
            <div className="flex gap-3 pt-2">
              <button type="button" disabled={submitting} onClick={onClose} className="btn-secondary flex-1 justify-center disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Sending request...' : 'Send request'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
