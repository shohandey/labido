/**
 * LabLink — Global Application State (React Context + Backend API + Cache)
 *
 * State shape:
 *   {
 *     bookings: Booking[],
 *     requests: Request[],
 *     loading: boolean,
 *     error: string | null,
 *   }
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import {
  getBookings,
  createBooking,
  updateBookingStatus as updateStatusApi,
  cancelBookingApi,
  resetBookingsApi,
} from '../api/bookingApi.js';
import { initialBookings, initialRequests } from '../data/initialState.js';

const STORAGE_KEY = 'lablink_state_v1';

function loadCachedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.bookings) && parsed.bookings.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return {
    bookings: initialBookings,
    requests: initialRequests,
  };
}

function saveCachedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bookings: state.bookings,
      requests: state.requests,
    }));
  } catch {
    /* ignore */
  }
}

function syncBookingsToRequests(bookings) {
  return bookings.map((b) => ({
    ...b,
    requestId: b.requestId || b.id,
    bookingId: b.bookingId || b.id,
    suggestions: b.suggestions || [],
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOOKINGS': {
      const bookings = action.payload;
      const requests = syncBookingsToRequests(bookings);
      return {
        ...state,
        bookings,
        requests,
        loading: false,
        error: null,
      };
    }

    case 'ADD_BOOKING': {
      const { booking } = action.payload;
      const request = {
        ...booking,
        requestId: booking.id,
        bookingId: booking.id,
        suggestions: booking.suggestions || [],
      };
      return {
        ...state,
        bookings: [booking, ...state.bookings.filter((b) => String(b.id) !== String(booking.id))],
        requests: [request, ...state.requests.filter((r) => String(r.id) !== String(booking.id))],
      };
    }

    case 'CANCEL_BOOKING': {
      const { bookingId } = action.payload;
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          String(b.id) === String(bookingId) ? { ...b, status: 'cancelled' } : b
        ),
        requests: state.requests.map((r) =>
          String(r.bookingId || r.id) === String(bookingId) ? { ...r, status: 'cancelled' } : r
        ),
      };
    }

    case 'UPDATE_REQUEST_STATUS': {
      const { requestId, status, reviewNote, suggestions } = action.payload;
      const updatedRequests = state.requests.map((r) =>
        String(r.id) === String(requestId)
          ? {
              ...r,
              status,
              reviewNote: reviewNote !== undefined ? reviewNote : r.reviewNote,
              suggestions: suggestions !== undefined ? suggestions : r.suggestions,
            }
          : r
      );

      const updatedBookings = state.bookings.map((b) =>
        String(b.id) === String(requestId)
          ? {
              ...b,
              status: status === 'alternative-suggested' ? 'pending' : status,
              reviewNote: reviewNote !== undefined ? reviewNote : b.reviewNote,
              suggestions: suggestions !== undefined ? suggestions : b.suggestions,
            }
          : b
      );

      return { ...state, requests: updatedRequests, bookings: updatedBookings };
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'RESET_STATE': {
      const bookings = action.payload || initialBookings;
      const requests = syncBookingsToRequests(bookings);
      return {
        ...state,
        bookings,
        requests,
        loading: false,
        error: null,
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const cached = loadCachedState();
    return {
      bookings: cached.bookings || [],
      requests: cached.requests || [],
      loading: true,
      error: null,
    };
  });

  const refreshBookings = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const apiBookings = await getBookings();
      dispatch({ type: 'SET_BOOKINGS', payload: apiBookings });
    } catch (err) {
      console.warn('Backend fetch failed, using cached state:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    saveCachedState(state);
  }, [state]);

  async function addBooking(bookingData) {
    // Authoritative backend creation
    const created = await createBooking(bookingData);
    dispatch({ type: 'ADD_BOOKING', payload: { booking: created } });
    return created;
  }

  async function cancelBooking(bookingId) {
    try {
      await cancelBookingApi(bookingId);
    } catch (err) {
      console.warn('API cancel error:', err);
      throw err;
    } finally {
      dispatch({ type: 'CANCEL_BOOKING', payload: { bookingId } });
    }
  }

  async function updateRequestStatus(requestId, status, reviewNote = '', suggestions = []) {
    try {
      const updated = await updateStatusApi(requestId, status, reviewNote, suggestions);
      dispatch({
        type: 'UPDATE_REQUEST_STATUS',
        payload: {
          requestId,
          status: updated.status,
          reviewNote: updated.reviewNote,
          suggestions: updated.suggestions,
        },
      });
      return updated;
    } catch (err) {
      console.warn('API status update error:', err);
      throw err;
    }
  }

  async function acceptSuggestion(suggestion, originalRequestId, studentInfo) {
    const newBookingData = {
      equipmentId: suggestion.equipmentId,
      equipmentName: suggestion.equipmentName,
      studentName: studentInfo.studentName,
      projectName: studentInfo.projectName,
      projectDescription: studentInfo.projectDescription || '',
      date: suggestion.date,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      deadline: studentInfo.deadline,
    };

    const created = await createBooking(newBookingData);
    dispatch({ type: 'ADD_BOOKING', payload: { booking: created } });

    if (originalRequestId) {
      try {
        await updateStatusApi(
          originalRequestId,
          'cancelled',
          `Student accepted alternative suggestion: ${suggestion.equipmentName} (${suggestion.date} ${suggestion.startTime}-${suggestion.endTime})`
        );
        dispatch({
          type: 'UPDATE_REQUEST_STATUS',
          payload: {
            requestId: originalRequestId,
            status: 'cancelled',
            reviewNote: 'Student accepted an alternative.',
          },
        });
      } catch (err) {
        console.warn('Could not cancel original request on suggestion accept:', err);
      }
    }

    return created;
  }

  async function resetState() {
    try {
      const bookings = await resetBookingsApi();
      dispatch({ type: 'RESET_STATE', payload: bookings });
    } catch {
      dispatch({ type: 'RESET_STATE', payload: initialBookings });
    }
  }

  return (
    <AppContext.Provider
      value={{
        bookings: state.bookings,
        requests: state.requests,
        loading: state.loading,
        error: state.error,
        refreshBookings,
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
