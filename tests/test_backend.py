import os
import sys
from datetime import date, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent / "lablink-backend-starter (1)" / "lablink_backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app, init_db, connect

client = TestClient(app)

def setup_module():
    init_db()

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "ok"
    assert data["database"] == "sqlite"
    print("✓ Health check passed")

def test_seed_bookings():
    res = client.post("/api/bookings/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    
    res = client.get("/api/bookings")
    assert res.status_code == 200
    bookings = res.json()
    assert len(bookings) == 4, f"Expected 4 initial bookings, got {len(bookings)}"
    print("✓ Initial seed bookings verified (4 items)")

def test_booking_validation():
    today = date.today()
    future = today + timedelta(days=5)
    
    # 1. End time <= start time
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-001",
        "equipment_name": "NVIDIA GPU Workstation",
        "student_name": "Test Student",
        "project_name": "Test Project",
        "project_description": "Testing",
        "date": future.isoformat(),
        "start_time": "14:00",
        "end_time": "12:00",
        "deadline": (future + timedelta(days=7)).isoformat()
    })
    assert res.status_code == 400, "Should reject end_time <= start_time"
    
    # 2. Outside operating hours (08:00 - 20:00)
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-001",
        "equipment_name": "NVIDIA GPU Workstation",
        "student_name": "Test Student",
        "project_name": "Test Project",
        "project_description": "Testing",
        "date": future.isoformat(),
        "start_time": "07:00",
        "end_time": "09:00",
        "deadline": (future + timedelta(days=7)).isoformat()
    })
    assert res.status_code == 400, "Should reject start time before 08:00"
    
    # 3. Date in the past
    past = today - timedelta(days=1)
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-001",
        "equipment_name": "NVIDIA GPU Workstation",
        "student_name": "Test Student",
        "project_name": "Test Project",
        "project_description": "Testing",
        "date": past.isoformat(),
        "start_time": "10:00",
        "end_time": "12:00",
        "deadline": future.isoformat()
    })
    assert res.status_code == 400, "Should reject date in the past"
    
    # 4. Deadline before booking date
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-001",
        "equipment_name": "NVIDIA GPU Workstation",
        "student_name": "Test Student",
        "project_name": "Test Project",
        "project_description": "Testing",
        "date": future.isoformat(),
        "start_time": "10:00",
        "end_time": "12:00",
        "deadline": (future - timedelta(days=1)).isoformat()
    })
    assert res.status_code == 400, "Should reject deadline before booking date"

    # 5. Duration < 30 minutes
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-001",
        "equipment_name": "NVIDIA GPU Workstation",
        "student_name": "Test Student",
        "project_name": "Test Project",
        "project_description": "Testing",
        "date": future.isoformat(),
        "start_time": "10:00",
        "end_time": "10:15",
        "deadline": (future + timedelta(days=5)).isoformat()
    })
    assert res.status_code == 400, "Should reject duration < 30 mins"
    print("✓ All booking validation rules verified")

def test_booking_creation_and_conflict_prevention():
    today = date.today()
    test_date = today + timedelta(days=8)
    deadline = test_date + timedelta(days=5)
    
    # Create initial booking: 10:00 - 12:00
    res = client.post("/api/bookings", json={
        "equipment_id": "eq-002",
        "equipment_name": "High-Performance Computing Cluster",
        "student_name": "Alice Johnson",
        "project_name": "Fluid Dynamics Simulation",
        "project_description": "OpenFOAM simulation",
        "date": test_date.isoformat(),
        "start_time": "10:00",
        "end_time": "12:00",
        "deadline": deadline.isoformat()
    })
    assert res.status_code == 200, f"Booking creation failed: {res.text}"
    created = res.json()
    booking_id = created["id"]
    assert created["status"] == "pending"
    assert created["student_name"] == "Alice Johnson"
    print("✓ Valid booking created successfully (pending)")
    
    # Try overlapping booking: 11:00 - 13:00 (Overlap!)
    res_overlap = client.post("/api/bookings", json={
        "equipment_id": "eq-002",
        "equipment_name": "High-Performance Computing Cluster",
        "student_name": "Bob Smith",
        "project_name": "Molecular Dynamics",
        "project_description": "GROMACS run",
        "date": test_date.isoformat(),
        "start_time": "11:00",
        "end_time": "13:00",
        "deadline": deadline.isoformat()
    })
    assert res_overlap.status_code == 409, f"Expected 409 conflict, got {res_overlap.status_code}"
    conflict_data = res_overlap.json()["detail"]
    assert "Time slot conflict" in conflict_data["message"]
    print("✓ Overlapping booking blocked with 409 Conflict")

    # Try non-overlapping adjacent booking: 12:00 - 14:00 (Allowed!)
    res_adjacent = client.post("/api/bookings", json={
        "equipment_id": "eq-002",
        "equipment_name": "High-Performance Computing Cluster",
        "student_name": "Charlie Brown",
        "project_name": "Climate Modeling",
        "project_description": "Weather research",
        "date": test_date.isoformat(),
        "start_time": "12:00",
        "end_time": "14:00",
        "deadline": deadline.isoformat()
    })
    assert res_adjacent.status_code == 200, f"Adjacent non-overlapping slot should succeed: {res_adjacent.text}"
    print("✓ Adjacent non-overlapping booking succeeded (12:00–14:00)")

    return booking_id

def test_approval_and_conflict():
    today = date.today()
    test_date = today + timedelta(days=9)
    deadline = test_date + timedelta(days=5)

    # Create Booking 1: 09:00 - 11:00
    r1 = client.post("/api/bookings", json={
        "equipment_id": "eq-003",
        "equipment_name": "Arduino Starter Kit",
        "student_name": "Dev 1",
        "project_name": "IoT Sensor",
        "project_description": "Sensor test",
        "date": test_date.isoformat(),
        "start_time": "09:00",
        "end_time": "11:00",
        "deadline": deadline.isoformat()
    }).json()

    # Approve Booking 1
    res_app = client.patch(f"/api/bookings/{r1['id']}/status", json={
        "status": "approved",
        "review_note": "Approved for lab session"
    })
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "approved"
    print("✓ Booking approved successfully")

    # If we force another booking in pending via direct db or cancel and re-create:
    # Verify that approving a booking that conflicts with an APPROVED booking fails with 409
    with connect() as db:
        cur = db.execute(
            """INSERT INTO bookings (
                equipment_id, equipment_name, student_name, project_name, project_description,
                date, start_time, end_time, deadline, status, review_note, suggestions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', '[]')""",
            ("eq-003", "Arduino Starter Kit", "Dev 2", "Conflict Proj", "", test_date.isoformat(), "10:00", "12:00", deadline.isoformat())
        )
        conflicting_pending_id = cur.lastrowid

    # Attempt to approve conflicting booking 2
    res_conflict_app = client.patch(f"/api/bookings/{conflicting_pending_id}/status", json={
        "status": "approved"
    })
    assert res_conflict_app.status_code == 409, "Approving a booking that conflicts with an already approved booking must fail with 409"
    print("✓ Approving a conflicting booking properly blocked with 409")

def test_rejection_and_alternative_suggestion():
    today = date.today()
    test_date = today + timedelta(days=10)
    deadline = test_date + timedelta(days=5)

    r = client.post("/api/bookings", json={
        "equipment_id": "eq-004",
        "equipment_name": "Raspberry Pi 4 Kit",
        "student_name": "Student A",
        "project_name": "Edge AI",
        "project_description": "Edge computing",
        "date": test_date.isoformat(),
        "start_time": "14:00",
        "end_time": "16:00",
        "deadline": deadline.isoformat()
    }).json()

    # Suggest alternative
    sample_suggestions = [{
        "type": "same-equipment-different-time",
        "equipmentId": "eq-004",
        "equipmentName": "Raspberry Pi 4 Kit",
        "date": test_date.isoformat(),
        "startTime": "16:00",
        "endTime": "18:00",
        "explanation": "Slot available later that day."
    }]
    res_sugg = client.patch(f"/api/bookings/{r['id']}/status", json={
        "status": "alternative-suggested",
        "review_note": "Slot occupied, please consider suggested slot.",
        "suggestions": sample_suggestions
    })
    assert res_sugg.status_code == 200
    updated_data = res_sugg.json()
    assert updated_data["status"] == "alternative-suggested"
    assert len(updated_data["suggestions"]) == 1
    print("✓ Alternative suggested status and payload updated successfully")

    # Reject booking
    res_rej = client.patch(f"/api/bookings/{r['id']}/status", json={
        "status": "rejected",
        "review_note": "Equipment unavailable"
    })
    assert res_rej.status_code == 200
    assert res_rej.json()["status"] == "rejected"
    print("✓ Booking rejected with review note successfully")

def test_cancellation_frees_slot():
    today = date.today()
    test_date = today + timedelta(days=11)
    deadline = test_date + timedelta(days=5)

    # 1. Create a booking
    r = client.post("/api/bookings", json={
        "equipment_id": "eq-007",
        "equipment_name": "3D Printer",
        "student_name": "Cancel Test",
        "project_name": "Drone chassis",
        "project_description": "3D print",
        "date": test_date.isoformat(),
        "start_time": "10:00",
        "end_time": "14:00",
        "deadline": deadline.isoformat()
    }).json()
    booking_id = r["id"]

    # 2. Cancel the booking
    res_cancel = client.delete(f"/api/bookings/{booking_id}")
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"
    print("✓ Booking cancelled successfully")

    # 3. Verify the same slot can now be booked by another student without conflict!
    res_new = client.post("/api/bookings", json={
        "equipment_id": "eq-007",
        "equipment_name": "3D Printer",
        "student_name": "New Student",
        "project_name": "Robotic arm part",
        "project_description": "3D print replacement",
        "date": test_date.isoformat(),
        "start_time": "10:00",
        "end_time": "14:00",
        "deadline": deadline.isoformat()
    })
    assert res_new.status_code == 200, f"Cancelled booking should NOT block slot: {res_new.text}"
    print("✓ Cancelled booking does not block equipment: new booking succeeded in same slot")

if __name__ == "__main__":
    setup_module()
    test_health()
    test_seed_bookings()
    test_booking_validation()
    test_booking_creation_and_conflict_prevention()
    test_approval_and_conflict()
    test_rejection_and_alternative_suggestion()
    test_cancellation_frees_slot()
    print("\n==========================================")
    print("ALL BACKEND & INTEGRATION TESTS PASSED 100%")
    print("==========================================")
