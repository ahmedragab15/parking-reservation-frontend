# Parking Reservation System — API Documentation

**Base URL**  
```
http://localhost:3000/api/v1
```

> Note: all paths below are relative to the base URL.

---

## Overview — important rules for frontend engineers
- **Backend is authoritative.** All business logic lives on the server: reserved slots, availability counts, rate mode detection, mixed-rate breakdowns, durations, and amounts. **Frontend MUST NOT perform these calculations.**
- The frontend displays server-provided fields, calls endpoints, and subscribes to a minimal websocket channel for realtime updates.
- Admin / management endpoints are grouped under `/api/v1/admin/*`.
- WebSocket is minimal: one endpoint and `subscribe` messages by `gateId`. Server sends `zone-update` and `admin-update`.

---

## Authentication
- JWT Bearer tokens for protected endpoints (admin and employee).
- Include header:
```
Authorization: Bearer <accessToken>
```
- Public read endpoints: `GET /master/gates`, `GET /master/zones` (with `gateId` filter). Other actions require auth.

---

## Error format (consistent)
All error responses follow:
```json
{
  "status": "error",
  "message": "Human readable message",
  "errors": {
    "field": ["validation or domain error messages"]
  }
}
```
Common HTTP codes: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

---

## Master data (public read, admin control)

### Categories (rate factory)
- `GET  /api/v1/admin/categories` — admin list
- `GET  /api/v1/master/categories` — public read
- `POST /api/v1/admin/categories` — create (admin)
- `PUT  /api/v1/admin/categories/{id}` — update (admin); used to update rates
- `DELETE /api/v1/admin/categories/{id}` — delete (admin)

**Category object**
```json
{
  "id": "cat_premium",
  "name": "Premium",
  "description": "Close to entrance, large stalls",
  "rateNormal": 5.0,
  "rateSpecial": 8.0
}
```
> `rateNormal` and `rateSpecial` are defined at category level.

### Zones
- `GET  /api/v1/admin/zones` — admin listing
- `GET  /api/v1/master/zones?gateId=<gateId>` — public listing by gate
- `POST /api/v1/admin/zones` — create (admin)
- `PUT  /api/v1/admin/zones/{id}` — update (admin)
- `DELETE /api/v1/admin/zones/{id}` — delete (admin)

**Zone object** (server authoritative fields)
```json
{
  "id": "zone_a",
  "name": "Zone A",
  "categoryId": "cat_premium",
  "gateIds": ["gate_1","gate_2"],
  "totalSlots": 100,
  "occupied": 60,                     // server computed
  "free": 40,                         // server computed
  "reserved": 15,                     // server computed
  "availableForVisitors": 25,         // server computed
  "availableForSubscribers": 40,      // server computed
  "rateNormal": 5.0,
  "rateSpecial": 8.0,
  "open": true
}
```

**Reserved-slot calculation (server rule)**  
- `reserved` is computed on the backend using active subscriptions for the category:
  ```
  reserved = ceil(subscribersOutside * 0.15)
  ```
  where `subscribersOutside` is the number of active subscriptions for the category whose cars are **not currently checked-in**. The backend recalculates `reserved` immediately after every subscription check-in or check-out and broadcasts updated `zone-update` messages.
- **Backend does NOT expose raw subscription counts** in zone payloads. It exposes `reserved` and related availability fields only. Frontend must not recompute reserved.

### Gates
- `GET  /api/v1/admin/gates` — admin list
- `GET  /api/v1/master/gates` — public read
- `POST /api/v1/admin/gates` — create (admin)
- `PUT  /api/v1/admin/gates/{id}` — update (admin)
- `DELETE /api/v1/admin/gates/{id}` — delete (admin)

**Gate object**
```json
{
  "id": "gate_1",
  "name": "Main Entrance",
  "zoneIds": ["zone_a","zone_b"],
  "location": "North perimeter"
}
```

---

## Rush hours & Vacations (global)
Rules apply to all categories.

### Rush hours
- `GET  /api/v1/admin/rush-hours`
- `POST /api/v1/admin/rush-hours` `{ "weekDay": 1, "from":"07:00", "to":"09:00" }`
- `PUT  /api/v1/admin/rush-hours/{id}`
- `DELETE /api/v1/admin/rush-hours/{id}`

### Vacations
- `GET  /api/v1/admin/vacations`
- `POST /api/v1/admin/vacations` `{ "name":"Eid","from":"2025-09-10","to":"2025-09-15" }`
- `PUT  /api/v1/admin/vacations/{id}`
- `DELETE /api/v1/admin/vacations/{id}`

---

## Users / Auth (employees & admins)
- `POST /api/v1/auth/login` — body: `{ "username":"...", "password":"..." }` → returns `{ user, token }`
- `POST /api/v1/admin/users` — create employee/admin (admin)
- `GET  /api/v1/admin/users` — list employees (admin)

---

## Subscriptions
- `GET  /api/v1/subscriptions/{id}` — verify subscription (used by gate + checkpoint)
- `POST /api/v1/admin/subscriptions` — create (admin)
- `PUT  /api/v1/admin/subscriptions/{id}` — update / deactivate (admin)

**Subscription object**
```json
{
  "id": "sub_001",
  "userName": "Ali",
  "active": true,
  "category": "cat_premium",
  "cars": [
    { "plate":"ABC-123","brand":"Toyota","model":"Corolla","color":"white" }
  ],
  "startsAt":"2025-01-01T00:00:00Z",
  "expiresAt":"2026-01-01T00:00:00Z",
  "currentCheckins":[{"ticketId":"t_010","zoneId":"zone_c","checkinAt":"2025-08-24T08:00:00Z"}]
}
```
> Each subscription is associated with exactly one category (current assumption).

---

## Tickets / Reservations

### Create check-in
**POST** `/api/v1/tickets/checkin`  
Visitor request:
```json
{ "gateId":"gate_1", "zoneId":"zone_a", "type":"visitor" }
```
Subscriber request:
```json
{ "gateId":"gate_1", "zoneId":"zone_a", "type":"subscriber", "subscriptionId":"sub_001" }
```
**201 response**
```json
{
  "ticket": {
    "id":"t_001",
    "type":"subscriber",
    "zoneId":"zone_a",
    "gateId":"gate_1",
    "checkinAt":"2025-08-24T09:12:00Z"
  },
  "zoneState": { /* authoritative zone object with computed fields */ }
}
```
Errors:
- `409 Conflict` if no availability (message explains reason).

### Checkout
**POST** `/api/v1/tickets/checkout`  
Request:
```json
{ "ticketId":"t_001", "forceConvertToVisitor": false }
```
**200 response** (server computes breakdown)
```json
{
  "ticketId":"t_001",
  "checkinAt":"2025-08-24T08:30:00Z",
  "checkoutAt":"2025-08-24T10:30:00Z",
  "durationHours": 2.0,
  "breakdown":[
    {"from":"2025-08-24T08:30:00Z","to":"2025-08-24T09:00:00Z","hours":0.5,"rateMode":"normal","rate":3.0,"amount":1.5},
    {"from":"2025-08-24T09:00:00Z","to":"2025-08-24T10:30:00Z","hours":1.5,"rateMode":"special","rate":5.0,"amount":7.5}
  ],
  "amount":9.0,
  "zoneState": { /* updated zone object */ }
}
```
- Backend decides mixed-mode splits and returns `breakdown`. Frontend displays as-is.

### Ticket queries
- `GET /api/v1/tickets/{id}` — fetch ticket info
- `GET /api/v1/admin/tickets?status=checkedin` — admin listing

---

## Admin control-panel endpoints (grouped)
All admin endpoints under `/api/v1/admin/*`:
- `GET /api/v1/admin/reports/parking-state` — authoritative list of zones with `subscriberCount`, `occupied`, `free`, `reserved`, `availableForVisitors`, `availableForSubscribers`, `open`.
- `PUT /api/v1/admin/categories/{id}` — update category (rates, name, description)
- `PUT /api/v1/admin/zones/{id}/open` — body `{ "open": true }`
- Manage rush hours: `/api/v1/admin/rush-hours`
- Manage vacations: `/api/v1/admin/vacations`
- Manage users/subscriptions: `/api/v1/admin/users`, `/api/v1/admin/subscriptions`

> Admin actions MUST trigger websocket `admin-update` broadcasts so gate UIs receive updates.

---

## WebSocket — minimal contract
**Endpoint**
```
ws://api.parking-system.test/api/v1/ws
```

**Client → Server**
- Subscribe to gate:
```json
{ "type":"subscribe", "payload": { "gateId":"gate_1" } }
```
- Unsubscribe:
```json
{ "type":"unsubscribe", "payload": { "gateId":"gate_1" } }
```

**Server → Client** messages:

### `zone-update`
Sent when zone state changes (checkin/checkout/admin action). Payload is the authoritative zone object:
```json
{ "type":"zone-update", "payload": { /* Zone object as above */ } }
```

### `admin-update`
Sent when admin makes configuration changes affecting gates/zones. Payload:
```json
{
  "type":"admin-update",
  "payload":{
    "adminId":"admin_1",
    "action":"category-rates-changed"|"zone-closed"|"zone-opened"|"vacation-added"|"rush-updated",
    "targetType":"category"|"zone"|"vacation"|"rush",
    "targetId":"cat_premium"|"zone_a"|"vac_1"|"rush_1",
    "details":{ /* optional */ },
    "timestamp":"2025-08-24T12:00:00Z"
  }
}
```

**Frontend websocket rules**
- Use a single ws connection per client.
- Send `subscribe` with `gateId`.
- Update UI using payload fields directly — do not recalc values.

---

## Seed data (minimal JSON to initialize backend)
The data from the attached seeder file will be bootstrapped into the server's in-memory database. Backend should compute derived fields at startup.

---

## Example flows

### Gate load (render)
1. Frontend calls:
```
GET /api/v1/master/gates
GET /api/v1/master/zones?gateId=gate_1
```
2. Server returns gate object and zone objects (with computed availability and rates).
3. Frontend subscribes to `ws` and sends `{"type":"subscribe","payload":{"gateId":"gate_1"}}` to receive live `zone-update`.

### Visitor check-in
1. Frontend `POST /api/v1/tickets/checkin` with `{ gateId, zoneId, type: "visitor" }`
2. Server validates availability and returns `ticket` + `zoneState` or `409` if no availability.
3. Server broadcasts `zone-update` to subscribed gates.

### Subscriber check-in
1. Frontend `GET /api/v1/subscriptions/{id}` to verify subscription.
2. Frontend `POST /api/v1/tickets/checkin` with `{ type:"subscriber", subscriptionId }`.
3. Server validates and returns `ticket` + updated `zoneState`. Server broadcasts `zone-update`.

### Checkout (employee checkpoint)
1. Employee logs in.
2. Employee pastes/scans ticket id -> frontend calls `POST /api/v1/tickets/checkout` with `{ ticketId }`.
3. Server returns `breakdown` and `amount` (server computed). Frontend shows amount and breakdown.
4. If `subscription` car/plate mismatch, employee may request `forceConvertToVisitor: true`.

---

# Frontend checklist (short)
- Gate screen:
  - Shows zones with server-provided availability & rates.
  - Visitor flow disables selection when `availableForVisitors <= 0` or `open === false`.
  - Subscriber flow verifies `GET /subscriptions/{id}` then allows zone selection only for permitted `category`.
  - Check-in `POST /api/v1/tickets/checkin` returns printable ticket.
- Checkpoint:
  - Employee login guards checkout actions.
  - Checkout `POST /api/v1/tickets/checkout` returns `breakdown` and `amount`.
  - Convert-to-visitor supported by `forceConvertToVisitor`.
- Admin:
  - Login, control-panel to open/close zones, set category rates, manage rush/vacations.
  - Admin actions broadcast websocket `admin-update`.

---

