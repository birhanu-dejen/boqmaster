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

- NestJS
- TypeScript
- Prisma ORM

### Database

- PostgreSQL

### Authentication

- JWT Authentication

### Development Tools

- PNPM
- Git
- GitHub

---

## System Architecture

```text
Client (Next.js)
        │
        ▼
REST API (NestJS)
        │
        ▼
PostgreSQL Database
```

---

## Repository Structure

```text
boqmaster/
├── client/
├── server/
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

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create `.env` files for both client and server.

Example server configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/boqmaster
JWT_SECRET=your-secret-key
PORT=3001
```

### Run Development Servers

Backend:

```bash
cd server
pnpm start:dev
```

Frontend:

```bash
cd client
pnpm dev
```

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

2026b
