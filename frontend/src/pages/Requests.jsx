import { useState } from 'react';
import {
  CheckCircle, XCircle, Lightbulb, Calendar, Clock, User, FileText,
  ChevronDown, ChevronUp, ClipboardList, Flag
} from 'lucide-react';
import { useApp } from '../store/AppContext.jsx';
import { equipment as allEquipment } from '../data/equipment.js';
import { getSuggestions } from '../utils/suggestions.js';
import { checkConflict } from '../utils/conflicts.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SuggestionCard from '../components/SuggestionCard.jsx';
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

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Alternative suggested'];
const statusMap = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  'Alternative suggested': 'alternative-suggested',
};

function RequestCard({ request, bookings, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [action, setAction] = useState(null); // 'reject' | 'suggest'
  const [suggestions, setSuggestions] = useState([]);
  const [updating, setUpdating] = useState(false);

  const eq = allEquipment.find((e) => e.id === request.equipmentId);
  const isPending = request.status === 'pending';

  async function handleApprove() {
    // Only other APPROVED bookings block approving this request
    const { conflict, conflictingBooking } = checkConflict(
      bookings,
      request.equipmentId,
      request.date,
      request.startTime,
      request.endTime,
      request.bookingId || request.id,
      ['approved']
    );

    if (conflict) {
      const suggs = getSuggestions(allEquipment, bookings, {
        equipmentId: request.equipmentId,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime,
        deadline: request.deadline,
      });
      if (suggs.length) {
        setUpdating(true);
        try {
          await onStatusUpdate(request.id, 'alternative-suggested',
            `Slot conflicts with an approved booking (${conflictingBooking?.studentName || 'another student'}). Alternatives suggested.`, suggs);
          toast.error('Slot already approved for another student. Alternatives suggested.');
        } catch (err) {
          toast.error(err.message || 'Failed to update request status.');
        } finally {
          setUpdating(false);
        }
      } else {
        setUpdating(true);
        try {
          await onStatusUpdate(request.id, 'rejected', 'Slot conflicts with an approved booking and no suitable alternatives were found.');
          toast.error('Conflict found with an approved booking. Request rejected.');
        } catch (err) {
          toast.error(err.message || 'Failed to update request status.');
        } finally {
          setUpdating(false);
        }
      }
      return;
    }

    setUpdating(true);
    try {
      await onStatusUpdate(request.id, 'approved', 'Request approved.');
      toast.success(`Approved booking for "${request.studentName}".`);
    } catch (err) {
      toast.error(err.message || 'Failed to approve booking.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleReject() {
    if (!rejectNote.trim()) {
      toast.error('Please add a note explaining why the request is rejected.');
      return;
    }
    setUpdating(true);
    try {
      await onStatusUpdate(request.id, 'rejected', rejectNote.trim());
      toast.success('Request rejected and student notified.');
      setAction(null);
      setRejectNote('');
    } catch (err) {
      toast.error(err.message || 'Failed to reject request.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleSuggestAlternative() {
    const suggs = getSuggestions(allEquipment, bookings, {
      equipmentId: request.equipmentId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      deadline: request.deadline,
    });

    if (suggs.length === 0) {
      toast.error("Couldn't find any alternatives right now. Try rejecting with a note instead.");
      return;
    }

    setUpdating(true);
    try {
      setSuggestions(suggs);
      await onStatusUpdate(request.id, 'alternative-suggested', 'Alternative time slots suggested.', suggs);
      toast.success('Alternative suggestions sent to the student.');
      setAction(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send alternative suggestions.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${request.status === 'pending' ? 'border-amber-200' : ''}`}>
      {/* Header row */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Emoji */}
        <div className="text-3xl leading-none select-none shrink-0 mt-0.5" aria-hidden="true">
          {eq?.emoji || '🔬'}
        </div>

        {/* Core info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{request.equipmentName}</p>
              <p className="text-xs text-blue-600 font-medium">{eq?.department}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User size={12} />
            <span className="font-medium text-slate-700">{request.studentName}</span>
            <span>·</span>
            <span>{request.projectName}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {fmtDate(request.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {fmtTime(request.startTime)} – {fmtTime(request.endTime)}
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <Flag size={11} />
              Deadline: {fmtDate(request.deadline)}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((x) => !x)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          title={expanded ? 'Collapse' : 'See more'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-700 text-xs uppercase tracking-wide mb-1">Project description</p>
              <p className="text-sm">{request.projectDescription}</p>
            </div>
          </div>

          {request.reviewNote && (
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Faculty note:</span> {request.reviewNote}
            </div>
          )}

          {/* Suggestions shown here if status is alternative-suggested */}
          {request.status === 'alternative-suggested' && (request.suggestions?.length > 0 || suggestions.length > 0) && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alternatives sent to student:</p>
              {(request.suggestions?.length > 0 ? request.suggestions : suggestions).map((s, i) => (
                <SuggestionCard key={i} suggestion={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faculty actions (pending only) */}
      {isPending && (
        <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap gap-2 items-start bg-white">
          {action === null && (
            <>
              <button
                onClick={handleApprove}
                disabled={updating}
                className="btn-success text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={13} />
                {updating ? 'Updating...' : 'Approve'}
              </button>
              <button
                onClick={() => setAction('reject')}
                disabled={updating}
                className="btn-danger text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={13} />
                Reject
              </button>
              <button
                onClick={handleSuggestAlternative}
                disabled={updating}
                className="btn-secondary text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lightbulb size={13} />
                {updating ? 'Updating...' : 'Suggest another time'}
              </button>
            </>
          )}

          {action === 'reject' && (
            <div className="w-full space-y-2">
              <label className="label text-xs">
                Let the student know why (required):
              </label>
              <textarea
                className="input-field text-xs resize-none"
                rows={2}
                placeholder="e.g. Equipment is under maintenance this week. Please re-submit for next week."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="btn-danger text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={13} /> {updating ? 'Rejecting...' : 'Confirm rejection'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={updating}
                  className="btn-secondary text-xs py-1.5 disabled:opacity-50"
                >
                  Go back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Requests() {
  const { requests, bookings, updateRequestStatus } = useApp();
  const [activeTab, setActiveTab] = useState('All');
  const [sortNewest, setSortNewest] = useState(true);

  const filtered =
    activeTab === 'All'
      ? requests
      : requests.filter((r) => r.status === statusMap[activeTab]);

  const sorted = [...filtered].sort((a, b) =>
    sortNewest
      ? b.createdAt?.localeCompare(a.createdAt)
      : a.createdAt?.localeCompare(b.createdAt)
  );

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Requests</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and manage equipment booking requests.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm">
              <span className="font-bold text-amber-700 text-lg">{pendingCount}</span>
              <span className="text-amber-600 ml-1.5">
                {pendingCount === 1 ? 'request needs' : 'requests need'} your review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === 'All'
                ? requests.length
                : requests.filter((r) => r.status === statusMap[tab]).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs ${tab === 'Pending' && count > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'
                      }`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSortNewest((x) => !x)}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg bg-white"
        >
          {sortNewest ? '↓ Newest first' : '↑ Oldest first'}
        </button>
      </div>

      {/* Request list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests here"
          description={
            activeTab === 'All'
              ? "No booking requests have been submitted yet."
              : `No ${activeTab.toLowerCase()} requests.`
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              bookings={bookings}
              onStatusUpdate={updateRequestStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
