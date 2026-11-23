import assert from 'node:assert';
import { checkConflict, findAvailableSlots, timeToMinutes, minutesToTime } from '../frontend/src/utils/conflicts.js';
import { getSuggestions } from '../frontend/src/utils/suggestions.js';
import { equipment as allEquipment } from '../frontend/src/data/equipment.js';

console.log('Testing Frontend Utilities...');

// 1. Time conversion
assert.strictEqual(timeToMinutes('09:30'), 570);
assert.strictEqual(minutesToTime(570), '09:30');
console.log('✓ Time conversion functions pass');

// 2. Conflict checking
const mockBookings = [
  {
    id: '1',
    equipmentId: 'eq-001',
    date: '2026-11-25',
    startTime: '10:00',
    endTime: '12:00',
    status: 'approved',
  },
  {
    id: '2',
    equipmentId: 'eq-001',
    date: '2026-11-25',
    startTime: '14:00',
    endTime: '16:00',
    status: 'pending',
  },
  {
    id: '3',
    equipmentId: 'eq-001',
    date: '2026-11-25',
    startTime: '16:00',
    endTime: '18:00',
    status: 'cancelled',
  },
];

// Overlapping approved slot
const c1 = checkConflict(mockBookings, 'eq-001', '2026-11-25', '11:00', '13:00');
assert.strictEqual(c1.conflict, true);
assert.strictEqual(c1.conflictingBooking.id, '1');
console.log('✓ Overlap with approved booking detected');

// Non-overlapping slot
const c2 = checkConflict(mockBookings, 'eq-001', '2026-11-25', '12:00', '14:00');
assert.strictEqual(c2.conflict, false);
console.log('✓ Adjacent non-overlapping slot allowed');

// Cancelled booking should NOT conflict
const c3 = checkConflict(mockBookings, 'eq-001', '2026-11-25', '16:00', '18:00');
assert.strictEqual(c3.conflict, false);
console.log('✓ Cancelled booking does not cause conflict');

// Exclude ID (e.g. self-checking during update)
const c4 = checkConflict(mockBookings, 'eq-001', '2026-11-25', '10:00', '12:00', '1');
assert.strictEqual(c4.conflict, false);
console.log('✓ Self-exclusion works for edits');

// Approval conflict check (only against approved)
const c5 = checkConflict(mockBookings, 'eq-001', '2026-11-25', '14:30', '15:30', null, ['approved']);
assert.strictEqual(c5.conflict, false, 'Pending booking should not block approval of another booking');
console.log('✓ Approval conflict check filters properly for approved-only');

// 3. Alternative Suggestions
const request = {
  equipmentId: 'eq-001',
  date: '2026-11-25',
  startTime: '10:00',
  endTime: '12:00',
  deadline: '2026-12-05',
};

const suggestions = getSuggestions(allEquipment, mockBookings, request);
assert(suggestions.length > 0, 'Suggestions should be generated when a slot is occupied');
assert(suggestions.length <= 3, 'Suggestions should be capped at 3');
suggestions.forEach((s) => {
  assert(s.equipmentId, 'Suggestion must include equipmentId');
  assert(s.date, 'Suggestion must include date');
  assert(s.startTime && s.endTime, 'Suggestion must include valid time range');
  assert(s.explanation, 'Suggestion must include transparent explanation');
  assert(s.date <= request.deadline, 'Suggestion date must not exceed deadline');
});
console.log(`✓ Suggestions generated: ${suggestions.length} valid alternatives found`);
suggestions.forEach((s, i) => console.log(`   [${i+1}] ${s.type}: ${s.equipmentName} (${s.date} ${s.startTime}-${s.endTime})`));

console.log('\n==========================================');
console.log('ALL FRONTEND LOGIC TESTS PASSED 100%');
console.log('==========================================');
