# models.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func

class Student(Base):
    _tablename_ = "students"
    id = Column(Integer, primary_key=True, index=True)
    roll = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    dept = Column(String, nullable=True)

    attendances = relationship("Attendance", back_populates="student")

class Attendance(Base):
    _tablename_ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    date = Column(Date, index=True)
    subject = Column(String, index=True)
    status = Column(String, nullable=False)  # 'present' or 'absent'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="attendances")