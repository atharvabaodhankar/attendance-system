

# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to define the functional and non-functional requirements of a **College Attendance Management System** that enables secure, scalable, and auditable attendance tracking using **QR codes and optional location verification**, with future extensibility for **Face Recognition and Blockchain-based verification**.

---

### 1.2 Scope

The system is designed for a college environment where:

* Teachers conduct lectures for specific **branches, years, and batches**
* Students mark attendance using **QR codes**
* Attendance authenticity is ensured using **location checks and risk analysis**
* Administrative approval workflows prevent identity spoofing

The system supports:

* Students
* Teachers
* Admins

---

### 1.3 Definitions

| Term       | Meaning                             |
| ---------- | ----------------------------------- |
| Batch      | Section like A, B, C, D, E          |
| PRN        | Permanent Registration Number       |
| QR         | Time-bound attendance code          |
| Risk Score | Computed cheating likelihood        |
| SRS        | Software Requirements Specification |

---

## 2. Overall Description

### 2.1 Product Perspective

This system is a **web + mobile-based distributed system** with:

* Central backend
* Role-based access
* Modular services

It can later integrate:

* Face Recognition
* Blockchain verification

without changing core workflows.

---

### 2.2 User Classes

#### 2.2.1 Admin

* Approves teacher accounts
* Manages departments, batches
* Audits system activity

#### 2.2.2 Teacher

* Creates classrooms
* Takes attendance
* Approves roll number changes
* Reviews flagged attendance

#### 2.2.3 Student

* Joins classrooms
* Marks attendance
* Views attendance reports
* Requests roll number correction

---

## 3. System Architecture (High-Level Design)

```text
Client (Web / Mobile)
        |
        v
API Gateway
        |
------------------------------------------------
| Auth Service | Classroom Service | Attendance |
------------------------------------------------
        |
     PostgreSQL
        |
      Redis
```

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

**FR-1**: The system shall support role-based authentication
**FR-2**: Teacher accounts shall require admin approval before activation
**FR-3**: Student accounts shall require PRN, branch, year, batch, roll number

---

### 4.2 Academic Structure Management

**FR-4**: The system shall support departments (branches)
**FR-5**: The system shall support years and batches
**FR-6**: Roll numbers shall be validated against batch ranges

---

### 4.3 Classroom Management

**FR-7**: Teachers shall create classrooms per subject
**FR-8**: Classrooms shall be joined using a teacher-provided password
**FR-9**: Only students belonging to the assigned batch may join

---

### 4.4 Attendance Session Management

**FR-10**: Teachers shall start an attendance session
**FR-11**: The system shall generate a **short-lived QR code**
**FR-12**: Teachers shall enable or disable location verification

---

### 4.5 Attendance Marking

**FR-13**: Students shall scan QR to mark attendance
**FR-14**: Attendance shall be recorded only once per student per session
**FR-15**: If location is enabled, student location shall be validated against teacher location

---

### 4.6 Anti-Fraud & Risk Evaluation

**FR-16**: The system shall detect VPN/proxy usage
**FR-17**: The system shall detect mock GPS usage
**FR-18**: The system shall compute a risk score per attendance
**FR-19**: High-risk attendance shall be flagged for teacher review

---

### 4.7 Roll Number Change Workflow

**FR-20**: Students may request roll number change once per semester
**FR-21**: Roll changes shall require teacher approval
**FR-22**: All changes shall be audit logged

---

### 4.8 Dashboards & Reports

**FR-23**: Students shall view subject-wise attendance percentages
**FR-24**: Teachers shall view session-wise attendance
**FR-25**: Teachers shall export attendance reports

---

## 5. Non-Functional Requirements

### 5.1 Performance

* Attendance marking < 1 second
* QR validation < 300ms

### 5.2 Scalability

* Supports 10,000+ students
* Stateless backend

### 5.3 Security

* Role-based access control
* Audit logs
* Rate limiting

### 5.4 Reliability

* 99.9% uptime target
* Graceful failure handling

---

## 6. Data Design (Key Entities)

### StudentProfile

```text
student_id
prn
branch
year
batch
roll_no
roll_edit_count
```

### Classroom

```text
classroom_id
subject
teacher_id
batch_id
password
```

### AttendanceSession

```text
session_id
classroom_id
start_time
qr_token
location_required
teacher_location
```

### AttendanceRecord

```text
session_id
student_id
timestamp
risk_score
status
```

---

## 7. Audit & Logging

**FR-26**: All approvals and overrides shall be logged
**FR-27**: Attendance overrides shall store teacher identity

---

## 8. Constraints

* Device binding is **not required in V1**
* Attendance must work without biometric hardware
* Location checks are teacher-controlled

---

## 9. Assumptions

* Students own smartphones
* Internet connectivity is available
* Teachers control lecture flow

---

## 10. Future Enhancements (NOT PART OF V1)

> These features are **explicitly out of scope for V1** and do not affect current requirements.

### 10.1 Face Recognition (Planned)

* Capture face snapshot during attendance
* Match against registered student image
* Used as secondary verification
* Optional for online/offline classes
* Teacher-controlled enforcement

**Status**: Planned, not implemented in V1

---

### 10.2 Blockchain-Based Attendance (Planned)

* Hash attendance records per session
* Store semester summaries on-chain
* Generate tamper-proof attendance proofs

**Status**: Planned, not implemented in V1

---

## 11. Requirement Stability Statement

> This SRS defines a stable V1 system.
> Future features (Face Recognition, Blockchain) are additive and do not require redesign of existing modules.

