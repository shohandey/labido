const API = '/api/bookings';

export function toBackend(data) {
  return {
    equipment_id: data.equipmentId,
    equipment_name: data.equipmentName,
    student_name: data.studentName,
    project_name: data.projectName,
    project_description: data.projectDescription || '',
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    deadline: data.deadline,
  };
}

export function toFrontend(data) {
  if (!data) return null;
  const idStr = String(data.id);
  let parsedSuggestions = [];
  if (Array.isArray(data.suggestions)) {
    parsedSuggestions = data.suggestions;
  } else if (typeof data.suggestions === 'string') {
    try {
      parsedSuggestions = JSON.parse(data.suggestions);
    } catch {
      parsedSuggestions = [];
    }
  }

  const cleanTime = (t) => {
    if (!t) return '';
    return t.length > 5 ? t.slice(0, 5) : t;
  };

  return {
    id: idStr,
    bookingId: idStr,
    requestId: idStr,
    equipmentId: data.equipment_id,
    equipmentName: data.equipment_name,
    studentName: data.student_name,
    projectName: data.project_name,
    projectDescription: data.project_description || '',
    date: data.date,
    startTime: cleanTime(data.start_time),
    endTime: cleanTime(data.end_time),
    deadline: data.deadline,
    status: data.status,
    reviewNote: data.review_note || '',
    suggestions: parsedSuggestions,
    createdAt: data.created_at,
  };
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail;
    let message = 'Something went wrong with the API.';

    if (typeof detail === 'string') {
      message = detail;
    } else if (detail?.message) {
      message = detail.message;
    } else if (errorData?.message) {
      message = errorData.message;
    }

    const err = new Error(message);
    err.status = response.status;
    err.detail = detail;
    throw err;
  }

  return response.json();
}

export async function getBookings() {
  const data = await request(API);
  return (data || []).map(toFrontend);
}

export async function createBooking(data) {
  const result = await request(API, {
    method: 'POST',
    body: JSON.stringify(toBackend(data)),
  });

  return toFrontend(result);
}

export async function updateBookingStatus(id, status, reviewNote = '', suggestions = []) {
  const result = await request(`${API}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      review_note: reviewNote,
      suggestions: suggestions || [],
    }),
  });

  return toFrontend(result);
}

export async function cancelBookingApi(id) {
  return request(`${API}/${id}`, {
    method: 'DELETE',
  });
}

export async function checkConflictApi(equipmentId, date, startTime, endTime, excludeId = null) {
  const params = new URLSearchParams({
    equipment_id: equipmentId,
    date,
    start_time: startTime,
    end_time: endTime,
  });
  if (excludeId) params.append('exclude_id', excludeId);
  return request(`/api/conflicts?${params.toString()}`);
}

export async function resetBookingsApi() {
  const result = await request(`${API}/reset`, {
    method: 'POST',
  });
  return (result?.bookings || []).map(toFrontend);
}
