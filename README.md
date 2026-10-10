# BOQMaster

## Overview

BOQMaster is a web-based Construction Cost Estimation and Bill of Quantities (BOQ) Management System designed for building projects in Ethiopia.

The system assists quantity surveyors, civil engineers, consultants, contractors, and project owners in preparing, managing, and analyzing Bills of Quantities and project cost estimates. BOQMaster aims to improve the accuracy, efficiency, and consistency of construction cost estimation while reducing manual calculations and documentation errors.

This project is developed as a graduation thesis under the title:

**Design and Development of a Web-Based Construction Cost Estimation and Bill of Quantities (BOQ) Management System for Building Projects in Ethiopia**

---

## Problem Statement

Many construction projects in Ethiopia still rely on spreadsheets and manual calculations for BOQ preparation and cost estimation. This often leads to:

- Calculation errors
- Data duplication
- Difficulty updating project costs
- Lack of centralized project records
- Time-consuming estimation processes

BOQMaster provides a centralized platform to manage construction quantities, unit rates, and project cost estimates.

---

## Objectives

### General Objective

To design and develop a web-based system that facilitates construction cost estimation and BOQ management for building projects in Ethiopia.

### Specific Objectives

- Manage construction projects digitally
- Create and organize BOQ items
- Calculate project quantities and costs
- Generate detailed BOQ reports
- Track project estimation revisions
- Improve estimation accuracy and efficiency
- Provide a user-friendly web interface

---

## Features

### Project Management

- Create projects
- Update project information
- Archive completed projects

### BOQ Management

- Create BOQ sections
- Add BOQ items
- Edit quantities and descriptions
- Organize items by work category

### Cost Estimation

- Define unit rates
- Calculate item costs automatically
- Calculate project totals
- Generate cost summaries

### Reporting

- BOQ report generation
- Cost summary reports
- Printable estimation reports

### User Management

- User authentication
- Role-based access control
- Secure login and authorization

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI

### Backend

- FastAPI
- Python 3.11+
- SQLAlchemy (ORM)
- Alembic (database migrations)
- Pydantic (data validation and schemas)
- Uvicorn (ASGI server)

### Database

- PostgreSQL

### Authentication

- JWT Authentication (PyJWT)
- Password hashing with Passlib (bcrypt)

### Development Tools

- PNPM (frontend)
- pip / venv (backend)
- Git
- GitHub

---

## System Architecture

```text
Client (Next.js)
        │
        ▼
REST API (FastAPI)
        │
        ▼
PostgreSQL Database
```

FastAPI automatically generates interactive API documentation at `/docs` (Swagger UI) and `/redoc`.

---

## Repository Structure

```text
boqmaster/
├── client/                 # Next.js frontend
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── core/           # config, security, JWT
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API routes
│   │   └── services/       # business logic
│   ├── alembic/            # migrations
│   ├── requirements.txt
│   └── .env
├── docs/
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/boqmaster.git
cd boqmaster
```

### Frontend Setup

```bash
cd client
pnpm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Setup

```bash
cd server
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Create `server/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/boqmaster
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PORT=8000
```

Run database migrations:

```bash
alembic upgrade head
```

### Run Development Servers

Backend:

```bash
cd server
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd client
pnpm dev
```

The API documentation will be available at `http://localhost:8000/docs`.

---

## Future Enhancements

- Material cost database
- Labor cost database
- Ethiopian construction rate library
- Excel import/export
- PDF report generation
- Contractor management
- Tender preparation module
- Project scheduling integration
- Multi-project dashboard

---

## Author

**Birhanu Dejen**

Civil Engineering Student and Full-Stack Developer

Graduation Thesis Project

2026
