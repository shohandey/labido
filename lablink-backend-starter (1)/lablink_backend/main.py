import json
import sqlite3
from datetime import date, time, datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).parent / "lablink.db"

VALID_STATUSES = {'approved', 'rejected', 'cancelled', 'pending', 'alternative-suggested'}

def connect():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c

def seed_demo_data(db):
    count = db.execute("SELECT count(*) FROM bookings").fetchone()[0]
    if count > 0:
        return
    today = date.today()
    seed = [
        (
            'eq-001', 'NVIDIA GPU Workstation (RTX 4090)',
            'Priya Sharma', 'Real-Time Object Detection System',
            'Training a YOLOv8 model for real-time object detection in campus surveillance footage.',
            (today + timedelta(days=1)).isoformat(), '09:00', '13:00',
            (today + timedelta(days=14)).isoformat(), 'approved',
            (today - timedelta(days=2)).isoformat(), '', '[]'
        ),
        (
            'eq-010', 'Robotics Development Kit',
            'Arjun Mehta', 'Autonomous Delivery Robot',
            'Building a ROS2-based autonomous robot for indoor package delivery using LiDAR navigation.',
            (today + timedelta(days=2)).isoformat(), '14:00', '18:00',
            (today + timedelta(days=21)).isoformat(), 'approved',
            (today - timedelta(days=1)).isoformat(), '', '[]'
        ),
        (
            'eq-007', '3D Printer (FDM — Prusa MK4)',
            'Meera Nair', 'Custom Drone Frame Design',
            'Printing custom lightweight frame components for a quadcopter drone prototype.',
            today.isoformat(), '10:00', '16:00',
            (today + timedelta(days=7)).isoformat(), 'pending',
            today.isoformat(), '', '[]'
        ),
        (
            'eq-004', 'Raspberry Pi 4 Kit',
            'Rahul Verma', 'Smart Home Automation Hub',
            'Setting up a Raspberry Pi as a home automation hub integrating voice control and IoT sensors.',
            (today + timedelta(days=3)).isoformat(), '11:00', '15:00',
            (today + timedelta(days=10)).isoformat(), 'pending',
            today.isoformat(), '', '[]'
        ),
    ]
    db.executemany(
        """INSERT INTO bookings (
            equipment_id, equipment_name, student_name, project_name, project_description,
            date, start_time, end_time, deadline, status, created_at, review_note, suggestions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        seed
    )

def init_db():
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            student_name TEXT NOT NULL,
            project_name TEXT NOT NULL,
            project_description TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            deadline TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            review_note TEXT NOT NULL DEFAULT '',
            suggestions TEXT NOT NULL DEFAULT '[]'
        )""")
        # Ensure column suggestions exists if table pre-existed
        cursor = db.execute("PRAGMA table_info(bookings)")
        columns = [row['name'] for row in cursor.fetchall()]
        if 'suggestions' not in columns:
            db.execute("ALTER TABLE bookings ADD COLUMN suggestions TEXT NOT NULL DEFAULT '[]'")
        db.execute("CREATE INDEX IF NOT EXISTS idx_slot ON bookings(equipment_id, date, status)")
        seed_demo_data(db)

app = FastAPI(title="LabLink API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

class BookingCreate(BaseModel):
    equipment_id: str
    equipment_name: str
    student_name: str = Field(min_length=1, max_length=100)
    project_name: str = Field(min_length=1, max_length=150)
    project_description: str = ""
    date: date
    start_time: time
    end_time: time
    deadline: date

class StatusUpdate(BaseModel):
    status: str
    review_note: str = ""
    suggestions: Optional[List[dict]] = None

def check_conflict(db, equipment_id: str, booking_date: str, start_time: str, end_time: str, exclude_id: Optional[int] = None, statuses=('pending', 'approved')):
    placeholders = ','.join('?' for _ in statuses)
    query = f"SELECT * FROM bookings WHERE equipment_id=? AND date=? AND status IN ({placeholders})"
    params = [equipment_id, booking_date] + list(statuses)
    rows = db.execute(query, params).fetchall()
    for r in rows:
        if exclude_id is not None and r['id'] == exclude_id:
            continue
        # Check overlap: not (end_time <= r['start_time'] or start_time >= r['end_time'])
        if not (end_time <= r['start_time'] or start_time >= r['end_time']):
            return r
    return None

def format_booking_row(row):
    if not row:
        return None
    d = dict(row)
    if 'suggestions' in d and isinstance(d['suggestions'], str):
        try:
            d['suggestions'] = json.loads(d['suggestions'])
        except Exception:
            d['suggestions'] = []
    else:
        d['suggestions'] = d.get('suggestions') or []
    return d

@app.get('/')
def root():
    return {"app": "LabLink API", "version": "1.0.0"}

@app.get('/api/health')
def health():
    return {"status": "ok", "database": "sqlite"}

@app.get('/api/bookings')
def list_bookings():
    with connect() as db:
        rows = db.execute('SELECT * FROM bookings ORDER BY date, start_time').fetchall()
        return [format_booking_row(r) for r in rows]

@app.get('/api/conflicts')
def check_booking_conflict(
    equipment_id: str,
    date: str,
    start_time: str,
    end_time: str,
    exclude_id: Optional[int] = None
):
    with connect() as db:
        cl = check_conflict(db, equipment_id, date, start_time, end_time, exclude_id=exclude_id, statuses=('pending', 'approved'))
        return {
            'conflict': cl is not None,
            'conflicting_booking': format_booking_row(cl) if cl else None
        }

@app.post('/api/bookings')
def create_booking(p: BookingCreate):
    if p.start_time >= p.end_time:
        raise HTTPException(400, 'End time must be after start time.')
    if p.start_time < time(8, 0) or p.end_time > time(20, 0):
        raise HTTPException(400, 'Bookings must be between 08:00 and 20:00.')
    if p.date < date.today():
        raise HTTPException(400, 'Cannot book a date in the past.')
    if p.deadline < p.date:
        raise HTTPException(400, 'Booking date must not be after the project deadline.')
    if p.date == date.today() and p.start_time <= datetime.now().time().replace(second=0, microsecond=0):
        raise HTTPException(400, 'Cannot book a time that has already passed.')

    start_min = p.start_time.hour * 60 + p.start_time.minute
    end_min = p.end_time.hour * 60 + p.end_time.minute
    if (end_min - start_min) < 30:
        raise HTTPException(400, 'Booking duration must be at least 30 minutes.')

    start_str = p.start_time.strftime("%H:%M")
    end_str = p.end_time.strftime("%H:%M")
    date_str = p.date.isoformat()
    deadline_str = p.deadline.isoformat()

    with connect() as db:
        cl = check_conflict(db, p.equipment_id, date_str, start_str, end_str, statuses=('pending', 'approved'))
        if cl:
            raise HTTPException(
                status_code=409,
                detail={
                    'message': f"Time slot conflict: {p.equipment_name} is already reserved ({cl['start_time']}–{cl['end_time']}) on {date_str}.",
                    'conflicting_booking': format_booking_row(cl)
                }
            )

        cur = db.execute(
            """INSERT INTO bookings (
                equipment_id, equipment_name, student_name, project_name, project_description,
                date, start_time, end_time, deadline, status, review_note, suggestions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', '[]')""",
            (
                p.equipment_id, p.equipment_name, p.student_name.strip(),
                p.project_name.strip(), p.project_description.strip(),
                date_str, start_str, end_str, deadline_str
            )
        )
        row = db.execute('SELECT * FROM bookings WHERE id=?', (cur.lastrowid,)).fetchone()
        return format_booking_row(row)

@app.patch('/api/bookings/{booking_id}/status')
def update_status(booking_id: int, p: StatusUpdate):
    if p.status not in VALID_STATUSES:
        raise HTTPException(400, f'Invalid status: {p.status}. Must be one of: {", ".join(VALID_STATUSES)}')

    with connect() as db:
        r = db.execute('SELECT * FROM bookings WHERE id=?', (booking_id,)).fetchone()
        if not r:
            raise HTTPException(404, 'Booking not found.')

        # When approving, ensure there are no conflicting APPROVED bookings
        if p.status == 'approved':
            cl = check_conflict(
                db, r['equipment_id'], r['date'], r['start_time'], r['end_time'],
                exclude_id=booking_id, statuses=('approved',)
            )
            if cl:
                raise HTTPException(
                    status_code=409,
                    detail={
                        'message': f"Approval blocked: Conflicts with an approved booking for {cl['student_name']} ({cl['start_time']}–{cl['end_time']}).",
                        'conflicting_booking': format_booking_row(cl)
                    }
                )

        suggestions_json = json.dumps(p.suggestions) if p.suggestions is not None else r['suggestions']
        db.execute(
            'UPDATE bookings SET status=?, review_note=?, suggestions=? WHERE id=?',
            (p.status, p.review_note, suggestions_json, booking_id)
        )
        updated = db.execute('SELECT * FROM bookings WHERE id=?', (booking_id,)).fetchone()
        return format_booking_row(updated)

@app.delete('/api/bookings/{booking_id}')
def cancel_booking(booking_id: int):
    with connect() as db:
        r = db.execute('SELECT * FROM bookings WHERE id=?', (booking_id,)).fetchone()
        if not r:
            raise HTTPException(404, 'Booking not found.')
        if r['status'] not in ('pending', 'approved'):
            raise HTTPException(400, f"Cannot cancel a booking with status '{r['status']}'.")
        db.execute("UPDATE bookings SET status='cancelled' WHERE id=?", (booking_id,))
        return {'message': 'Booking cancelled', 'id': booking_id, 'status': 'cancelled'}

@app.post('/api/bookings/reset')
def reset_bookings():
    with connect() as db:
        db.execute('DELETE FROM bookings')
        seed_demo_data(db)
        rows = db.execute('SELECT * FROM bookings ORDER BY date, start_time').fetchall()
        return {'message': 'Reset to initial demo bookings', 'count': len(rows), 'bookings': [format_booking_row(r) for r in rows]}

@app.delete('/api/bookings')
def clear_bookings():
    with connect() as db:
        db.execute('DELETE FROM bookings')
    return {'message': 'All bookings cleared'}
