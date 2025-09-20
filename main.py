# main.py
from fastapi import FastAPI, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models, schemas
from typing import List, Optional
import csv
from fastapi.responses import StreamingResponse
import io
import datetime

# Create DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Attendance API", version="1.0")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Students CRUD ---
@app.post("/students/", response_model=schemas.StudentOut)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    # check duplicate roll
    exists = db.query(models.Student).filter(models.Student.roll == student.roll).first()
    if exists:
        raise HTTPException(status_code=400, detail="Roll already exists")
    db_student = models.Student(roll=student.roll, name=student.name, dept=student.dept)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.get("/students/", response_model=List[schemas.StudentOut])
def list_students(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return db.query(models.Student).offset(skip).limit(limit).all()

@app.get("/students/{roll}", response_model=schemas.StudentOut)
def get_student(roll: str, db: Session = Depends(get_db)):
    s = db.query(models.Student).filter(models.Student.roll == roll).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s

# --- Attendance ---
@app.post("/attendance/", response_model=schemas.AttendanceOut)
def mark_attendance(att: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    # find student
    student = db.query(models.Student).filter(models.Student.roll == att.roll).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student with given roll not found")
    # upsert: if record exists for same date+subject+student -> update
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.date == att.date,
        models.Attendance.subject == att.subject
    ).first()
    if existing:
        existing.status = att.status
        db.commit()
        db.refresh(existing)
        return existing

    record = models.Attendance(student_id=student.id, date=att.date, subject=att.subject, status=att.status)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.get("/attendance/", response_model=List[schemas.AttendanceOut])
def get_attendance(date: Optional[datetime.date] = None, subject: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Attendance)
    if date:
        q = q.filter(models.Attendance.date == date)
    if subject:
        q = q.filter(models.Attendance.subject == subject)
    return q.all()

# Attendance per student (percentage over recorded dates)
@app.get("/attendance/student/{roll}/summary")
def student_summary(roll: str, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.roll == roll).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    records = db.query(models.Attendance).filter(models.Attendance.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    pct = (present / total * 100) if total > 0 else 0
    return {"roll": roll, "name": student.name, "present": present, "total": total, "percent": round(pct,2)}

# Export CSV for specific date+subject
@app.get("/export/attendance/csv")
def export_csv(date: datetime.date, subject: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Attendance, models.Student).join(models.Student, models.Attendance.student_id == models.Student.id).filter(models.Attendance.date == date)
    if subject:
        q = q.filter(models.Attendance.subject == subject)

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["roll","name","dept","date","subject","status"])
    for att, student in q.all():
        writer.writerow([student.roll, student.name, student.dept or "", att.date.isoformat(), att.subject, att.status])

    out.seek(0)
    headers = {
        "Content-Disposition": f"attachment; filename=attendance_{date.isoformat()}.csv"
    }
    return StreamingResponse(iter([out.getvalue()]), media_type="text/csv", headers=headers)

# Quick aggregate: class-level stats for date and subject
@app.get("/attendance/stats/")
def attendance_stats(date: datetime.date, subject: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Attendance)
    q = q.filter(models.Attendance.date == date)
    if subject:
        q = q.filter(models.Attendance.subject == subject)
    records = q.all()
    total_records = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = total_records - present
    return {"date": date.isoformat(), "subject": subject, "total_records": total_records, "present": present, "absent": absent}