/**
 * LabLink — Global Application State (React Context + useReducer + localStorage)
 *
 * State shape:
 *   {
 *     bookings: Booking[],
 *     requests: Request[],
 *   }
 *
 * Equipment catalog is static (from data/equipment.js) and not stored in context.
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialState } from '../data/initialState.js';

const STORAGE_KEY = 'lablink_state_v1';

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return initialState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_BOOKING': {
      const { booking, request } = action.payload;
      return {
        ...state,
        bookings: [...state.bookings, booking],
        requests: [...state.requests, request],
      };
    }

    case 'CANCEL_BOOKING': {
      const { bookingId } = action.payload;
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ),
        requests: state.requests.map((r) =>
          r.bookingId === bookingId ? { ...r, status: 'cancelled' } : r
        ),
      };
    }

    case 'UPDATE_REQUEST_STATUS': {
      const { requestId, status, reviewNote, suggestions } = action.payload;
      const updatedRequests = state.requests.map((r) =>
        r.id === requestId
          ? { ...r, status, reviewNote: reviewNote || r.reviewNote, suggestions: suggestions || r.suggestions }
          : r
      );
      // Also sync booking status
      const req = state.requests.find((r) => r.id === requestId);
      const updatedBookings = req?.bookingId
        ? state.bookings.map((b) =>
            b.id === req.bookingId
              ? { ...b, status: status === 'alternative-suggested' ? 'pending' : status }
              : b
          )
        : state.bookings;

      return { ...state, requests: updatedRequests, bookings: updatedBookings };
    }

    case 'ACCEPT_SUGGESTION': {
      // Student accepts a suggestion — creates a new booking for the suggested slot
      const { suggestion, originalRequestId, studentName, projectName, projectDescription, deadline } = action.payload;
      const newBookingId = generateId('bk');
      const newRequestId = generateId('rq');

      const newBooking = {
        id: newBookingId,
        equipmentId: suggestion.equipmentId,
        equipmentName: suggestion.equipmentName,
        studentName,
        projectName,
        projectDescription,
        date: suggestion.date,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        deadline,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        requestId: newRequestId,
      };

      const newRequest = {
        id: newRequestId,
        bookingId: newBookingId,
        equipmentId: suggestion.equipmentId,
        equipmentName: suggestion.equipmentName,
        studentName,
        projectName,
        projectDescription,
        date: suggestion.date,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        deadline,
        status: 'pending',
        reviewNote: `Accepted alternative suggestion from original request ${originalRequestId}.`,
        createdAt: new Date().toISOString().split('T')[0],
        suggestions: [],
      };

      // Mark original request as resolved
      const updatedRequests = state.requests.map((r) =>
        r.id === originalRequestId ? { ...r, status: 'cancelled', reviewNote: 'Student accepted an alternative.' } : r
      );

      return {
        ...state,
        bookings: [...state.bookings, newBooking],
        requests: [...updatedRequests, newRequest],
      };
    }

    case 'RESET_STATE': {
      return initialState;
    }

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // ── Action creators ───────────────────────────────────────────────────────

  function addBooking({ equipmentId, equipmentName, studentName, projectName, projectDescription, date, startTime, endTime, deadline }) {
    const bookingId = generateId('bk');
    const requestId = generateId('rq');
    const today = new Date().toISOString().split('T')[0];

    const booking = {
      id: bookingId,
      equipmentId,
      equipmentName,
      studentName,
      projectName,
      projectDescription,
      date,
      startTime,
      endTime,
      deadline,
      status: 'pending',
      createdAt: today,
      requestId,
    };

    const request = {
      id: requestId,
      bookingId,
      equipmentId,
      equipmentName,
      studentName,
      projectName,
      projectDescription,
      date,
      startTime,
      endTime,
      deadline,
      status: 'pending',
      reviewNote: '',
      createdAt: today,
      suggestions: [],
    };

    dispatch({ type: 'ADD_BOOKING', payload: { booking, request } });
    return { bookingId, requestId };
  }

  function cancelBooking(bookingId) {
    dispatch({ type: 'CANCEL_BOOKING', payload: { bookingId } });
  }

  function updateRequestStatus(requestId, status, reviewNote = '', suggestions = []) {
    dispatch({ type: 'UPDATE_REQUEST_STATUS', payload: { requestId, status, reviewNote, suggestions } });
  }

  function acceptSuggestion(suggestion, originalRequestId, studentInfo) {
    dispatch({ type: 'ACCEPT_SUGGESTION', payload: { suggestion, originalRequestId, ...studentInfo } });
  }

  function resetState() {
    dispatch({ type: 'RESET_STATE' });
  }

  return (
    <AppContext.Provider
      value={{
        bookings: state.bookings,
        requests: state.requests,
        addBooking,
        cancelBooking,
        updateRequestStatus,
        acceptSuggestion,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
