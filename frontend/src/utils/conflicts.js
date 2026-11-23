/**
 * LabLink — Conflict Detection Utilities
 *
 * All time comparisons use HH:MM strings converted to minutes-since-midnight
 * for straightforward numeric comparison.
 */

/** Convert "HH:MM" to minutes since midnight */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/** Convert minutes since midnight back to "HH:MM" */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Get today's date in YYYY-MM-DD */
export function getTodayDateStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

/**
 * Checks whether a proposed booking overlaps with any existing approved/pending booking
 * for the same equipment on the same date.
 *
 * @param {Array}  bookings       - all bookings in state
 * @param {string} equipmentId    - equipment id being requested
 * @param {string} date           - "YYYY-MM-DD"
 * @param {string} startTime      - "HH:MM"
 * @param {string} endTime        - "HH:MM"
 * @param {string} [excludeId]    - booking id to exclude (for edits / re-checking)
 * @param {Array}  [activeStatuses=['approved', 'pending']] - statuses that count as conflict
 * @returns {{ conflict: boolean, conflictingBooking: object|null }}
 */
export function checkConflict(
  bookings = [],
  equipmentId,
  date,
  startTime,
  endTime,
  excludeId = null,
  activeStatuses = ['approved', 'pending']
) {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  const conflicting = (bookings || []).find((bk) => {
    if (excludeId !== null && String(bk.id) === String(excludeId)) return false;
    if (bk.equipmentId !== equipmentId) return false;
    if (bk.date !== date) return false;
    if (!activeStatuses.includes(bk.status)) return false;

    const bkStart = timeToMinutes(bk.startTime);
    const bkEnd = timeToMinutes(bk.endTime);

    // Overlap: not (reqEnd <= bkStart || reqStart >= bkEnd)
    return !(reqEnd <= bkStart || reqStart >= bkEnd);
  });

  return { conflict: !!conflicting, conflictingBooking: conflicting || null };
}

/**
 * Finds available slots on a given date for a piece of equipment.
 * Scans 08:00–20:00 in 30-minute increments, skipping any that would conflict
 * or that have already passed if date is today.
 *
 * @param {Array}  bookings
 * @param {string} equipmentId
 * @param {string} date
 * @param {number} [durationMinutes=120]
 * @returns {Array<{ startTime: string, endTime: string }>}
 */
export function findAvailableSlots(bookings, equipmentId, date, durationMinutes = 120) {
  const slots = [];
  const startOfDay = timeToMinutes('08:00');
  const endOfDay = timeToMinutes('20:00');
  const todayStr = getTodayDateStr();

  let earliestStart = startOfDay;
  if (date === todayStr) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    // Buffer by at least 15 minutes
    earliestStart = Math.max(startOfDay, Math.ceil((currentMin + 15) / 30) * 30);
  }

  for (let start = earliestStart; start + durationMinutes <= endOfDay; start += 30) {
    const end = start + durationMinutes;
    const { conflict } = checkConflict(
      bookings,
      equipmentId,
      date,
      minutesToTime(start),
      minutesToTime(end)
    );
    if (!conflict) {
      slots.push({ startTime: minutesToTime(start), endTime: minutesToTime(end) });
    }
  }

  return slots;
}

/**
 * Returns a human-readable display for a time range, e.g. "9:00 AM – 11:00 AM".
 */
export function formatTimeRange(startTime, endTime) {
  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  };
  return `${fmt(startTime)} – ${fmt(endTime)}`;
}
