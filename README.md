# BOQMaster

## Overview

BOQMaster is a web-based Construction Cost Estimation and Bill of Quantities (BOQ) Management System designed for building projects in Ethiopia.

It goes beyond a digital BOQ spreadsheet. BOQMaster builds quantities from dimensions, builds unit rates from materials, labor, and equipment, applies Ethiopian cost rules (VAT, contingency, overhead and profit, ETB), and lets estimators re-price old estimates when market prices change. The result is a single source of truth for quantity surveyors, civil engineers, consultants, contractors, and project owners.

This project is developed as a graduation thesis under the title:

**Design and Development of a Web-Based Construction Cost Estimation and Bill of Quantities (BOQ) Management System for Building Projects in Ethiopia**

---

## Problem Statement

Many construction projects in Ethiopia still rely on spreadsheets and manual calculations for BOQ preparation and cost estimation. This leads to:

- Calculation errors, especially in quantity take-off
- Data duplication across projects and files
- Outdated unit rates, because material prices change quickly with inflation and currency movement
- Difficulty re-pricing and comparing estimate revisions
- No centralized, shared record of rates, projects, and changes
- Time-consuming estimation and report preparation

> **Evidence note:** These pain points are to be validated through interviews with practicing quantity surveyors, contractors, and consultants in Addis Ababa (see [Validation Plan](#validation-plan)). Findings will be added here and to the thesis.

BOQMaster addresses these by combining dimension-based quantity take-off, rate analysis, a maintained price library, and price-escalation tools in one platform.

---

## Objectives

### General Objective

To design and develop a web-based system that facilitates accurate, auditable, and up-to-date construction cost estimation and BOQ management for building projects in Ethiopia.

### Specific Objectives

- Manage construction projects digitally
- Calculate quantities from dimensions, with deductions for openings
- Build unit rates from materials, labor, equipment, wastage, overhead, and profit
- Maintain a library of Ethiopian material, labor, and equipment prices with timestamps
- Apply Ethiopian cost rules (VAT, contingency, provisional sums, ETB)
- Import existing BOQs from Excel and export to Excel and PDF
- Re-price estimates to current rates and compare revisions
- Provide a user-friendly web interface for firms with multiple users

---

## Features

Features are grouped by delivery phase. **Phase 1 (MVP)** is the thesis scope.

### Phase 1 (MVP, thesis scope)

#### Project Management

- Create, update, and archive projects
- Project metadata (client, location, building type, date, currency)

#### BOQ Management

- Create BOQ sections and items, organized by work category
- Edit quantities, units, and descriptions

#### Quantity Take-off

- Enter dimensions (number, length, width, height/depth) per measurement line
- Add deductions for openings (doors, windows, voids)
- Quantities computed automatically and traceable to the measurement lines behind them

#### Rate Analysis

- Build a unit rate from components: materials, labor, equipment
- Per-component quantity (coefficient), wastage percentage, and unit price
- Overhead and profit applied on top
- Reusable rate templates (e.g. concrete C-25 per m³, 200 mm HCB wall per m²)
- Changing a base price updates every dependent rate and BOQ item

#### Price Library

- Material, labor, and equipment price database
- Each price has a source and an effective date
- Organization-level libraries that firms can customize

#### Cost Estimation

- Automatic item costs and section subtotals
- Ethiopian cost rules: VAT, contingency, provisional sums, overhead and profit (rates configurable per project and to be verified against current regulations)
- Project totals and cost summaries in ETB

#### Price Escalation and Revisions

- Re-price an estimate to current library prices in one action
- Estimate "age" indicator showing which rates are outdated
- Revision history with item-level and total comparison between versions
- Audit trail of who changed what and when

#### Import / Export and Reporting

- Import BOQs from Excel
- Export BOQs and summaries to Excel
- PDF generation of BOQ reports, cost summaries, and rate analysis sheets
- Printable estimation reports

#### User and Organization Management

- User authentication with JWT
- Organizations with multiple users
- Role-based access control (e.g. owner, estimator, reviewer)

### Phase 2

- Variations and interim payment certificates (measured work vs. BOQ, valuations, retention, advance recovery, variation orders)
- Tender and bid support: templates aligned with Ethiopian public procurement documents, bid comparison across contractors, rate reasonableness checks
- Starter BOQ templates by building type (residential, villa, G+N apartment, school)
- Amharic user interface and bilingual item descriptions and reports

### Phase 3

- Offline-tolerant use (PWA with local drafts that sync later)
- Local payment integration (Telebirr, Chapa, bank transfer) for subscriptions
- Anonymized price benchmarks from user submissions
- Contractor management
- Project scheduling integration
- Multi-project dashboard

---

## Business Model (Commercialization)

| Tier                | Audience                           | Offering                                                                             |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Free                | Students, small users              | 1-2 projects, core take-off and BOQ export                                           |
| Professional        | QS firms, contractors, consultants | Per-seat plan: unlimited projects, rate analysis, re-pricing, organization libraries |
| Rate Library add-on | All paying users                   | Regularly updated, sourced Ethiopian price library as a separate subscription        |

**Competitive advantage:** a maintained, well-sourced Ethiopian price library, Ethiopia-specific cost rules, and (in Phase 2) Amharic support and procurement-aligned templates are difficult for generic or foreign estimating software to replicate.

---

## Validation Plan

Before finalizing scope, validate with real users:

1. Interview 8-10 quantity surveyors, contractors, and consultants in Addis Ababa.
2. For each, walk through their most recent BOQ: where time was lost, what errors occurred, which Excel templates they reuse.
3. Have 2-3 participants test a prototype of the take-off and rate analysis modules.
4. Record findings in `docs/validation/` and reference them in the thesis problem statement.

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
- Excel import/export library (e.g. openpyxl)
- PDF generation library (e.g. WeasyPrint or ReportLab)

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

### Core Domain Model (planned)

```text
Organization ── Users (roles)
     │
     ├── PriceLibrary ── Material / Labor / Equipment (price, source, effective_date)
     │
     └── Project
           └── Estimate (revision n)
                 └── Section
                       └── BOQItem
                             ├── MeasurementLine (dimensions, deductions)
                             └── RateAnalysis (components, wastage, overhead, profit)
```

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
│   │   └── services/       # business logic (take-off, rate analysis, re-pricing, import/export)
│   ├── alembic/            # migrations
│   ├── requirements.txt
│   └── .env
├── docs/
│   └── validation/         # interview notes and findings
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

## Roadmap

| Phase | Focus                                                                                                                                              | Status                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1     | Dimension-based take-off, rate analysis, price library, Excel import/export, PDF reports, re-pricing, revision comparison, organizations and roles | In progress (thesis scope) |
| 2     | Variations and payment certificates, tender and bid support, building-type templates, Amharic support                                              | Planned                    |
| 3     | Offline PWA, local payments, price benchmarks, contractor management, scheduling, dashboards                                                       | Planned                    |

---

## Notes on Ethiopian Cost Rules

VAT, withholding tax, and other statutory rates and rules change over time. Default values in the system must be verified with a practicing quantity surveyor and the relevant authorities, and should remain configurable per organization and project rather than hard-coded.

---

## Author

**Birhanu Dejen**

Civil Engineering Student and Full-Stack Developer

Graduation Thesis Project

2026
