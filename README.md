# Parking Reservation Backend - WeLink Cargo

**A comprehensive parking reservation system developed for WeLink Cargo company hiring and training purposes.**

This is a complete **Express + WebSocket** backend implementation for the Parking Reservation System with full business logic, real-time notifications, and comprehensive test coverage. Originally designed as a starter project, it has been enhanced into a production-ready system for evaluation and training scenarios.

## Company & Purpose

This application was designed and developed for **WeLink Cargo** company as part of their hiring and training program. It demonstrates:
- Full-stack development capabilities
- Real-time system architecture
- Comprehensive testing practices
- Business logic implementation
- API design and documentation

## Features
- In-memory seeded data (zones, gates, categories, subscriptions, tickets, users)
- Endpoints:
  - `POST /api/v1/auth/login`
  - `GET  /api/v1/master/gates`
  - `GET  /api/v1/master/zones`
  - `GET  /api/v1/master/categories`
  - `GET  /api/v1/subscriptions/:id`
  - `POST /api/v1/tickets/checkin`
  - `POST /api/v1/tickets/checkout`
  - `GET  /api/v1/tickets/:id`
  - `GET  /api/v1/admin/reports/parking-state`
  - `PUT  /api/v1/admin/categories/:id` (update rates)
  - `PUT  /api/v1/admin/zones/:id/open` (open/close)
  - `POST /api/v1/admin/rush-hours`
  - `POST /api/v1/admin/vacations`
  - `GET  /api/v1/admin/subscriptions`
- Simple auth: login with seeded user credentials (admin, employee). Returns simple token.
- WebSocket at `/api/v1/ws` for minimal `zone-update` and `admin-update` messages. Clients subscribe by sending `{"type":"subscribe","payload":{"gateId":"gate_1"}}`.

## Run locally

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

The server listens on port 3000 by default. API base URL:
`http://localhost:3000/api/v1`

WebSocket URL:
`ws://localhost:3000/api/v1/ws`

## Notes
- All business logic (reserved calculation, availability, mixed-rate checkout) is implemented server-side.
- Data is in-memory; restarting the server resets the state to seeded values.
- This is a starter implementation for frontend integration and testing. It is **not** production-ready.
