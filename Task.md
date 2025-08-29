# Frontend Task — Parking Reservation System (Candidate Brief)

> Short summary: build the **frontend** for a Parking Reservation System that supports Gate check-in (visitor & subscriber), Checkpoint checkout (employee), and an Admin control panel. A small backend (API + WS) is provided — use it; **do not** mock business logic. Use React / Next.js and one of the allowed state libraries. The UI should be production-quality for a 2–3 year frontend engineer exercise.

---

# Goal
Produce a complete frontend application implementing the user interfaces and flows described below that consume the provided backend API and WebSocket. Focus on correctness, UX, realtime updates, and clean, maintainable code.

**Intended difficulty:** moderate (2–3 years experience).  
**Candidate time guidance:** the task is designed to be doable within a short assignment window (your team’s target ~4–5 days).

---

# Deliverables (what to submit)
1. A git repo containing the frontend project (Next.js or React). Include:
   - Source code, clearly structured.
   - `README.md` with setup/run instructions.
   - Small demo screenshots or short GIF (optional).
2. A short “implementation notes” file explaining decisions, known issues, and any optional bonuses completed.
3. (Optional) basic tests (unit or integration) demonstrating key flows.
4. **Imortant and Must** Git history that shows iterative work (many small commits preferred).

---

# Tech stack & constraints
- Required: **React** (can be plain React or **Next.js**)  
- State management: choose **Redux Toolkit** *or* **Zustand**  
- Data fetching / caching: **React Query** (recommended)  
- WebSocket: browser WebSocket API (or a tiny wrapper) — keep it minimal  
- Styling: your choice (CSS modules, Tailwind, styled-components, plain CSS). Aim for clean, decent UI.  
- The frontend **must not** reimplement business logic (reserved slot calc, fee calc, breakdown splitting, etc.). Always display server-provided fields.

---

# Where to get the API & seed data
- Use the provided backend starter (Express + ws) you already have.  
- Read the `API_DOC.md` (separate file) for endpoint shapes, sample requests/responses, and the websocket contract. The frontend must follow that API.

---

# Required Screens & Features (implement all items)

## 1) Gate Screen — Check-in (`/gate/:gateId`)
- Header: Gate name/number, connection status (WebSocket), current time.
- Tabs: **Visitor** and **Subscriber** (toggle).
- Zone list: one card per zone returned from `GET /master/zones?gateId=...`. Each card shows:
  - Zone name, category, `occupied`, `free`, `reserved`, `availableForVisitors`, `availableForSubscribers`, `rateNormal`, `rateSpecial`, and `open` status.
  - Visually indicate if `special` rate currently applies (use WS `zone-update` `specialActive` or the zone payload).
  - Zone selection: disabled if `open === false` or (visitor tab) `availableForVisitors <= 0`.
- Visitor flow:
  - Select zone → **Go** button → call `POST /tickets/checkin` with `{ gateId, zoneId, type: "visitor" }`.
  - On success show a printable ticket modal (ticket id, checkinAt, zone/gate info) and a simulated gate-open animation.
  - Handle and display server errors (e.g., 409 Conflict).
- Subscriber flow:
  - Input field for `subscriptionId` → `GET /subscriptions/:id` to verify.
  - If subscription active & allowed for the zone’s category, allow selection. Otherwise show clear error message.
  - Submit `POST /tickets/checkin` with `{ type: "subscriber", subscriptionId }`.
  - Display printable ticket modal.
- Realtime:
  - Subscribe to WS for the gate (`{"type":"subscribe","payload":{"gateId":"..."} }`).
  - Update zone cards from `zone-update` and react to `admin-update`.
  - All UI availability indicators must reflect server payloads (no recalculation on client).

## 2) Checkpoint Screen — Check-out (`/checkpoint`)
- Authentication: employee login (use `POST /auth/login`); protect screen.
- UI: input for scanned ticket id (text paste to simulate QR).
- Lookup/Checkout flow:
  - Fetch ticket (optional `GET /tickets/:id`) or call `POST /tickets/checkout` to compute amount.
  - Display server-returned `breakdown` (segments with rateMode, hours, rate, amount), `durationHours`, and total `amount`.
  - If ticket is subscriber-related, fetch `GET /subscriptions/:id` (if subscription id is included in ticket info) and show subscription cars so employee can compare plates visually. Employee decides if plate matches.
  - If mismatch, allow employee to **Convert to Visitor** (call checkout with `{ forceConvertToVisitor: true }`).
- On success, show confirmation and ensure WS zone updates reflect occupancy change.

## 3) Admin Dashboard (`/admin/*`)
- Authentication: admin login (use `POST /auth/login`).
- Screens:
  - **Employees**: list and create employee accounts (calls to `POST /admin/users`, `GET /admin/users`).
  - **Parking State Report** (`GET /admin/reports/parking-state`): table or cards showing every zone and server-provided `occupied`, `free`, `reserved`, `availableForVisitors`, `availableForSubscribers`, `subscriberCount`, `open`.
  - **Control Panel**:
    - Open/Close zone (`PUT /admin/zones/{id}/open`).
    - Update category rates (`PUT /admin/categories/{id}`) — category-level rates only.
    - Add rush windows (`POST /admin/rush-hours`) and vacations (`POST /admin/vacations`).
  - Admin actions must trigger and respond to `admin-update` websocket messages; the dashboard should show a short live audit log (timestamp, action, admin id) when updates occur.

---

# Cross-cutting & UI expectations
- **Responsive:** pages should be usable on desktop and tablet.
- **Accessible:** use semantic HTML; buttons/inputs must be keyboard navigable.
- **Error handling:** show server errors clearly and non-blockingly.
- **Loading states:** must show while waiting for API responses.
- **Offline/connection handling:** show WS disconnected state; attempt reconnect (nice-to-have).
- **Printable ticket:** simple HTML/CSS print layout for ticket modal.
- **State management:** use React Query for network state and either Redux Toolkit or Zustand for local/global UI state.
- **No business logic on client:** frontend must never compute reserved slots, amounts, or breakdowns — display only what server returns.

---

# Testing & verification
- Provide at least one test (Jest / React Testing Library) for a key component or flow (e.g., Gate Screen: selecting a zone disables Go when unavailable; or Checkpoint: displaying breakdown).
- Manual verification steps in the README: how to login as seeded users, how to subscribe to gate WS, how to perform a check-in and see WS update.

---

# Acceptance Criteria (how you’ll be evaluated)
- **Core features working:** Gate check-in flows, Checkpoint checkout, and Admin controls function against the provided backend and WS.
- **Realtime updates:** Zone cards update on check-in/checkout and on admin changes via WebSocket.
- **Correct API usage:** Frontend uses the provided endpoints and respects all server-provided fields (no client-side business calculations).
- **Code quality:** Clear structure, modular components, sensible state management, readable code and comments.
- **UX polish:** Clear UI states (loading, error), printable ticket, sensible layout & responsive.
- **README & setup:** Simple instructions to run and test with the provided backend.
- **Optional bonuses** (increase score): extra tests, animations, offline behavior, admin audit log, robust reconnection logic.

---

# Bonus ideas (optional)
- Visual highlight of which rate (normal vs special) is currently active on each zone card.
- Small animations for gate open/close / ticket printing.
- Admin audit timeline with filters and live updates.
- Offline caching of recent `zone-state` so gate screen degrades gracefully if WS disconnects.

---

# Suggested folder structure (example)
```
/src
  /components
    GateHeader.tsx
    ZoneCard.tsx
    TicketModal.tsx
    CheckoutPanel.tsx
    AdminReports.tsx
  /pages or /routes
    /gate/[gateId].tsx
    /checkpoint.tsx
    /admin/index.tsx
  /services
    api.ts (React Query hooks)
    ws.ts (ws wrapper)
  /store
    (RTK slices or zustand store)
  /styles
README.md
```

---

# How to submit
- Push to a Git repo (GitHub/GitLab) and share the link through email.
- Include clear setup steps and any notes about deviations or known issues.
