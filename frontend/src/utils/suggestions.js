/**
 * LabLink — Smart Alternative Suggestion Engine
 *
 * When a booking conflicts or equipment is unavailable, this engine
 * generates practical, transparent, and non-conflicting alternatives.
 *
 * Transparent Priority Order:
 *   1. Same equipment → available slots on the requested date (least disruption)
 *   2. Same equipment → available slots on subsequent days before the project deadline
 *   3. Directly compatible equipment (`compatibleWith`) → on requested date or within deadline
 *   4. Functionally related equipment (matching technical tags) → within deadline
 */

import { findAvailableSlots, formatTimeRange, getTodayDateStr } from './conflicts.js';

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const fmtDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Generate up to 3 meaningful alternative suggestions.
 *
 * @param {Array}  allEquipment  - full equipment catalog
 * @param {Array}  bookings      - all current bookings in state
 * @param {object} request       - the failed/conflicting request
 *   { equipmentId, date, startTime, endTime, deadline }
 * @returns {Array<{ type, equipmentId, equipmentName, emoji, lab, date, startTime, endTime, explanation }>}
 */
export function getSuggestions(allEquipment = [], bookings = [], request) {
  const { equipmentId, date, startTime, endTime, deadline } = request;
  if (!equipmentId || !date || !startTime || !endTime) return [];

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const reqDuration = (eh * 60 + em) - (sh * 60 + sm);
  const effectiveDuration = Math.max(30, reqDuration > 0 ? reqDuration : 120);

  const suggestions = [];
  const todayStr = getTodayDateStr();
  const baseDate = date < todayStr ? todayStr : date;
  const deadlineDate = deadline || addDays(baseDate, 14);

  const equipment = allEquipment.find((e) => e.id === equipmentId);
  if (!equipment) return suggestions;

  // Track existing suggestion keys to prevent duplicates
  const seen = new Set();
  const makeKey = (eqId, d, st, et) => `${eqId}_${d}_${st}_${et}`;

  // Helper to add suggestion
  const addSuggestion = (sugg) => {
    const key = makeKey(sugg.equipmentId, sugg.date, sugg.startTime, sugg.endTime);
    if (!seen.has(key) && suggestions.length < 3) {
      seen.add(key);
      suggestions.push(sugg);
    }
  };

  // ── 1. Same equipment, same day, different time ──────────────────────────
  if (baseDate <= deadlineDate) {
    const durationForThis = Math.min(effectiveDuration, (equipment.maxHoursPerBooking || 8) * 60);
    const sameEqSameDay = findAvailableSlots(bookings, equipmentId, baseDate, durationForThis);

    // Pick a slot that doesn't exactly match the requested one
    const altSlot = sameEqSameDay.find((s) => s.startTime !== startTime);
    if (altSlot) {
      addSuggestion({
        type: 'same-equipment-different-time',
        equipmentId,
        equipmentName: equipment.name,
        emoji: equipment.emoji,
        lab: equipment.lab,
        date: baseDate,
        startTime: altSlot.startTime,
        endTime: altSlot.endTime,
        explanation: `${equipment.name} is booked during your requested slot, but an open slot is available on ${fmtDate(baseDate)} from ${formatTimeRange(altSlot.startTime, altSlot.endTime)}.`,
      });
    }
  }

  // ── 2. Same equipment, subsequent days up to deadline (up to 4 days) ─────
  for (let d = 1; d <= 4 && suggestions.length < 2; d++) {
    const nextDate = addDays(baseDate, d);
    if (nextDate > deadlineDate) break;

    const durationForThis = Math.min(effectiveDuration, (equipment.maxHoursPerBooking || 8) * 60);
    const nextSlots = findAvailableSlots(bookings, equipmentId, nextDate, durationForThis);
    if (nextSlots.length > 0) {
      // Prefer same time slot if available, else first open slot
      const preferredSlot = nextSlots.find((s) => s.startTime === startTime) || nextSlots[0];
      addSuggestion({
        type: 'same-equipment-different-day',
        equipmentId,
        equipmentName: equipment.name,
        emoji: equipment.emoji,
        lab: equipment.lab,
        date: nextDate,
        startTime: preferredSlot.startTime,
        endTime: preferredSlot.endTime,
        explanation: `${equipment.name} is available on ${fmtDate(nextDate)} from ${formatTimeRange(preferredSlot.startTime, preferredSlot.endTime)}, comfortably before your deadline (${fmtDate(deadlineDate)}).`,
      });
      break;
    }
  }

  // ── 3. Compatible equipment (`compatibleWith`) ───────────────────────────
  if (suggestions.length < 3 && Array.isArray(equipment.compatibleWith) && equipment.compatibleWith.length > 0) {
    const compatibleList = allEquipment.filter(
      (e) => e.id !== equipmentId && equipment.compatibleWith.includes(e.id) && (e.available === undefined || e.available > 0)
    );

    for (const alt of compatibleList) {
      if (suggestions.length >= 3) break;
      const durationForThis = Math.min(effectiveDuration, (alt.maxHoursPerBooking || 8) * 60);

      // Check on requested date first
      if (baseDate <= deadlineDate) {
        const altSameDaySlots = findAvailableSlots(bookings, alt.id, baseDate, durationForThis);
        if (altSameDaySlots.length > 0) {
          const slot = altSameDaySlots.find((s) => s.startTime === startTime) || altSameDaySlots[0];
          addSuggestion({
            type: 'alternative-equipment',
            equipmentId: alt.id,
            equipmentName: alt.name,
            emoji: alt.emoji,
            lab: alt.lab,
            date: baseDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            explanation: `${alt.name} is a compatible alternative located in ${alt.lab.split('—')[0].trim()} and is free on ${fmtDate(baseDate)} from ${formatTimeRange(slot.startTime, slot.endTime)}.`,
          });
          continue;
        }
      }

      // If not on same day, check next 3 days
      for (let d = 1; d <= 3; d++) {
        const nextDate = addDays(baseDate, d);
        if (nextDate > deadlineDate) break;

        const altNextSlots = findAvailableSlots(bookings, alt.id, nextDate, durationForThis);
        if (altNextSlots.length > 0) {
          const slot = altNextSlots.find((s) => s.startTime === startTime) || altNextSlots[0];
          addSuggestion({
            type: 'alternative-equipment',
            equipmentId: alt.id,
            equipmentName: alt.name,
            emoji: alt.emoji,
            lab: alt.lab,
            date: nextDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            explanation: `${alt.name} is compatible with your project requirements and has availability on ${fmtDate(nextDate)} from ${formatTimeRange(slot.startTime, slot.endTime)}.`,
          });
          break;
        }
      }
    }
  }

  // ── 4. Tag-matched similar equipment fallback ────────────────────────────
  if (suggestions.length < 3 && Array.isArray(equipment.tags)) {
    const similarList = allEquipment.filter(
      (e) =>
        e.id !== equipmentId &&
        (e.available === undefined || e.available > 0) &&
        Array.isArray(e.tags) &&
        e.tags.some((t) => equipment.tags.includes(t)) &&
        !seen.has(e.id)
    );

    for (const alt of similarList) {
      if (suggestions.length >= 3) break;
      const durationForThis = Math.min(effectiveDuration, (alt.maxHoursPerBooking || 8) * 60);

      // Check on requested date or within next 3 days
      for (let d = 0; d <= 3; d++) {
        const checkDate = d === 0 ? baseDate : addDays(baseDate, d);
        if (checkDate > deadlineDate) break;

        const altSlots = findAvailableSlots(bookings, alt.id, checkDate, durationForThis);
        if (altSlots.length > 0) {
          const slot = altSlots[0];
          addSuggestion({
            type: 'similar-equipment',
            equipmentId: alt.id,
            equipmentName: alt.name,
            emoji: alt.emoji,
            lab: alt.lab,
            date: checkDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            explanation: `${alt.name} shares relevant capabilities (${alt.tags.slice(0, 3).join(', ')}) and is available on ${fmtDate(checkDate)} from ${formatTimeRange(slot.startTime, slot.endTime)}.`,
          });
          break;
        }
      }
    }
  }

  return suggestions.slice(0, 3);
}
