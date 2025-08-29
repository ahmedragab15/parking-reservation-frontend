
/**
 * Minimal Express + ws server for Parking Reservation System (starter).
 * Run: npm install && npm start
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const BASE = '/api/v1';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json')));

// In-memory DB (deep copy)
let db = JSON.parse(JSON.stringify(seed));

// Utilities
function nowIso() { return new Date().toISOString(); }
function ceil(n) { return Math.ceil(n); }

// Simple auth - returns token "token-<userId>"
function loginUser(username, password) {
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role, token: 'token-' + user.id };
}

function getUserByToken(token) {
  if (!token) return null;
  const id = token.replace('Bearer ', '').replace('token-', '');
  return db.users.find(u => u.id === id) || null;
}

// Helper: find category by id
function categoryById(id) {
  return db.categories.find(c => c.id === id);
}

// Compute reserved based on subscriptions outside (subscriptions have single category field)
function computeReservedForCategory(categoryId) {
  // Count active subscriptions for this category that are currently not checked-in
  const subs = db.subscriptions.filter(s => s.active && s.category === categoryId);
  let checkedInCount = 0;
  subs.forEach(s => {
    if (s.currentCheckins && s.currentCheckins.length > 0) {
      checkedInCount += s.currentCheckins.length;
    }
  });
  const subscribersOutside = subs.length - checkedInCount;
  const reserved = ceil(subscribersOutside * 0.15);
  return Math.min(reserved, 1000000); // cap loosely; zones will cap later by totalSlots
}

// Recompute zone state: reserved, free, availableForVisitors, availableForSubscribers
function recomputeZoneState(zone) {
  const category = categoryById(zone.categoryId);
  const reserved = computeReservedForCategory(zone.categoryId);
  const occupied = zone.occupied || 0;
  const total = zone.totalSlots || 0;
  const free = Math.max(0, total - occupied);
  // reservedFree = reserved - number of reserved slots already occupied by subscribers checked-in in this zone
  // We'll estimate reserved occupied in this zone by counting subscriber tickets in db.tickets that are checked-in for this zone (type subscriber)
  const reservedOccupied = db.tickets.filter(t => t.zoneId === zone.id && !t.checkoutAt && t.type === 'subscriber').length;
  const reservedFree = Math.max(0, reserved - reservedOccupied);
  let availableForVisitors = Math.max(0, free - reservedFree);
  // cap reserved to total
  const finalReserved = Math.min(reserved, total);
  if (availableForVisitors < 0) availableForVisitors = 0;
  const availableForSubscribers = free;
  return {
    reserved: finalReserved,
    occupied,
    free,
    availableForVisitors,
    availableForSubscribers,
    rateNormal: category ? category.rateNormal : 0,
    rateSpecial: category ? category.rateSpecial : 0
  };
}

// Build zone payload for master endpoints
function zonePayload(zone) {
  const state = recomputeZoneState(zone);
  return {
    id: zone.id,
    name: zone.name,
    categoryId: zone.categoryId,
    gateIds: zone.gateIds,
    totalSlots: zone.totalSlots,
    occupied: state.occupied,
    free: state.free,
    reserved: state.reserved,
    availableForVisitors: state.availableForVisitors,
    availableForSubscribers: state.availableForSubscribers,
    rateNormal: state.rateNormal,
    rateSpecial: state.rateSpecial,
    open: zone.open
  };
}

// WebSocket server
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server, path: BASE + '/ws' });
// Map gateId -> Set of ws
const gateSubs = new Map();

function wsBroadcastZoneUpdate(zoneId) {
  const zone = db.zones.find(z => z.id === zoneId);
  if (!zone) return;
  const payload = zonePayload(zone);
  const message = JSON.stringify({ type: 'zone-update', payload });
  // broadcast to all connections subscribed to any gate that includes this zone
  db.gates.forEach(g => {
    if (g.zoneIds.includes(zoneId)) {
      const conns = gateSubs.get(g.id);
      if (conns) {
        conns.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) ws.send(message);
        });
      }
    }
  });
}

// handle ws connections
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      const m = JSON.parse(message.toString());
      if (m.type === 'subscribe' && m.payload && m.payload.gateId) {
        const gid = m.payload.gateId;
        if (!gateSubs.has(gid)) gateSubs.set(gid, new Set());
        gateSubs.get(gid).add(ws);
        // send initial zone updates for gate
        const g = db.gates.find(x => x.id === gid);
        if (g) {
          g.zoneIds.forEach(zid => {
            const z = db.zones.find(z => z.id === zid);
            if (z) {
              ws.send(JSON.stringify({ type: 'zone-update', payload: zonePayload(z) }));
            }
          });
        }
      } else if (m.type === 'unsubscribe' && m.payload && m.payload.gateId) {
        const gid = m.payload.gateId;
        if (gateSubs.has(gid)) gateSubs.get(gid).delete(ws);
      }
    } catch (err) {
      console.error('ws message error', err);
    }
  });
  ws.on('close', () => {
    // remove from all gateSubs
    gateSubs.forEach((set, gid) => {
      set.delete(ws);
    });
  });
});

// Middleware: auth
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) { req.user = null; return next(); }
  const user = getUserByToken(auth);
  req.user = user;
  next();
}
app.use(authMiddleware);

// Routes

app.post(BASE + '/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = loginUser(username, password);
  if (!u) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  res.json({ user: { id: u.id, username: u.username, role: u.role }, token: 'token-' + u.id });
});

// Public master endpoints
app.get(BASE + '/master/gates', (req, res) => {
  const list = db.gates.map(g => ({ id: g.id, name: g.name, zoneIds: g.zoneIds, location: g.location }));
  res.json(list);
});

app.get(BASE + '/master/zones', (req, res) => {
  const gateId = req.query.gateId;
  let zones = db.zones;
  if (gateId) zones = zones.filter(z => z.gateIds.includes(gateId));
  res.json(zones.map(z => zonePayload(z)));
});

app.get(BASE + '/master/categories', (req, res) => {
  res.json(db.categories);
});

// Subscriptions
app.get(BASE + '/subscriptions/:id', (req, res) => {
  const id = req.params.id;
  const sub = db.subscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ status:'error', message: 'Subscription not found' });
  res.json(sub);
});

// Tickets: checkin
app.post(BASE + '/tickets/checkin', (req, res) => {
  const { gateId, zoneId, type, subscriptionId } = req.body || {};
  if (!gateId || !zoneId || !type) return res.status(400).json({ status:'error', message:'Missing required fields' });
  const zone = db.zones.find(z => z.id === zoneId);
  if (!zone) return res.status(404).json({ status:'error', message:'Zone not found' });
  // recompute
  const state = recomputeZoneState(zone);
  if (!zone.open) return res.status(409).json({ status:'error', message:'Zone is closed' });
  if (type === 'visitor') {
    if (state.availableForVisitors <= 0) return res.status(409).json({ status:'error', message:'No available slots for visitors' });
  } else if (type === 'subscriber') {
    const sub = db.subscriptions.find(s => s.id === subscriptionId);
    if (!sub || !sub.active) return res.status(400).json({ status:'error', message:'Invalid subscription' });
    if (!sub.categories && sub.category) sub.categories = [sub.category];
    // check permitted categories
    if (!sub.categories.includes(zone.categoryId) && sub.category !== zone.categoryId) {
      return res.status(403).json({ status:'error', message:'Subscription not valid for this category' });
    }
    if (state.free <= 0) return res.status(409).json({ status:'error', message:'No free slots for subscribers' });
  } else {
    return res.status(400).json({ status:'error', message:'Invalid type' });
  }
  const ticketId = 't_' + uuidv4().split('-')[0];
  const ticket = { id: ticketId, type, zoneId, gateId, checkinAt: nowIso(), checkoutAt: null };
  db.tickets.push(ticket);
  // update zone occupancy
  zone.occupied = (zone.occupied || 0) + 1;
  // if subscriber, record in subscription.currentCheckins
  if (type === 'subscriber') {
    const sub = db.subscriptions.find(s => s.id === subscriptionId);
    if (sub) {
      if (!sub.currentCheckins) sub.currentCheckins = [];
      sub.currentCheckins.push({ ticketId: ticket.id, zoneId: zoneId, checkinAt: ticket.checkinAt });
    }
  }
  // Broadcast zone update
  wsBroadcastZoneUpdate(zoneId);
  res.status(201).json({ ticket, zoneState: zonePayload(zone) });
});

// Tickets: checkout
function isSpecialAt(timestamp) {
  // check vacations first
  const d = new Date(timestamp);
  const dateStr = d.toISOString().slice(0,10);
  for (const v of db.vacations) {
    if (dateStr >= v.from && dateStr <= v.to) return { special:true, reason:'vacation' };
  }
  // then check rush windows (weekday)
  const wd = d.getUTCDay(); // 0..6
  const hhmm = d.toISOString().slice(11,16); // "HH:MM"
  for (const r of db.rushHours) {
    if (r.weekDay == wd) {
      if (r.from <= hhmm && hhmm < r.to) return { special:true, reason:'rush' };
    }
  }
  return { special:false };
}

app.post(BASE + '/tickets/checkout', (req, res) => {
  const { ticketId, forceConvertToVisitor } = req.body || {};
  if (!ticketId) return res.status(400).json({ status:'error', message:'Missing ticketId' });
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ status:'error', message:'Ticket not found' });
  if (ticket.checkoutAt) return res.status(400).json({ status:'error', message:'Ticket already checked out' });
  const zone = db.zones.find(z => z.id === ticket.zoneId);
  if (!zone) return res.status(404).json({ status:'error', message:'Zone not found' });
  // compute breakdown minute-by-minute and aggregate segments
  const checkin = new Date(ticket.checkinAt);
  const checkout = new Date();
  // allow override: if forceConvertToVisitor and ticket.type === 'subscriber', treat as visitor for billing
  const billingType = (ticket.type === 'subscriber' && forceConvertToVisitor) ? 'visitor' : ticket.type;
  // get category rates
  const category = categoryById(zone.categoryId);
  const rateNormal = category ? category.rateNormal : 0;
  const rateSpecial = category ? category.rateSpecial : 0;
  // build per-minute array
  const segments = [];
  let cursor = new Date(checkin.getTime());
  while (cursor < checkout) {
    const next = new Date(Math.min(cursor.getTime() + 60*1000, checkout.getTime()));
    const sp = isSpecialAt(cursor.toISOString());
    const mode = sp.special ? 'special' : 'normal';
    const rate = (mode === 'special') ? rateSpecial : rateNormal;
    segments.push({ from: cursor.toISOString(), to: next.toISOString(), minutes: (next - cursor)/60000, mode, rate, amount: ((next - cursor)/60000) * rate / 60 * 60 }); // minutes * rate per hour -> convert
    cursor = next;
  }
  // aggregate contiguous segments with same mode
  const agg = [];
  for (const s of segments) {
    if (agg.length === 0) { agg.push(Object.assign({}, s)); continue; }
    const last = agg[agg.length-1];
    if (last.mode === s.mode && last.rate === s.rate && last.to === s.from) {
      last.to = s.to;
      last.minutes += s.minutes;
      last.amount += s.amount;
    } else {
      agg.push(Object.assign({}, s));
    }
  }
  // map to breakdown items hours and amounts
  const breakdown = agg.map(a => ({
    from: a.from,
    to: a.to,
    hours: +(a.minutes/60).toFixed(4),
    rateMode: a.mode,
    rate: a.rate,
    amount: +a.amount.toFixed(2)
  }));
  const totalAmount = breakdown.reduce((s,b)=>s+b.amount,0);
  ticket.checkoutAt = checkout.toISOString();
  // update zone occupancy
  zone.occupied = Math.max(0, (zone.occupied || 1) - 1);
  // if subscriber, remove from subscription.currentCheckins
  if (ticket.type === 'subscriber') {
    for (const sub of db.subscriptions) {
      if (sub.currentCheckins && sub.currentCheckins.length) {
        const idx = sub.currentCheckins.findIndex(c => c.ticketId === ticket.id);
        if (idx >= 0) sub.currentCheckins.splice(idx,1);
      }
    }
  }
  // Broadcast zone update
  wsBroadcastZoneUpdate(zone.id);
  res.json({
    ticketId: ticket.id,
    checkinAt: ticket.checkinAt,
    checkoutAt: ticket.checkoutAt,
    durationHours: +((checkout - checkin)/3600000).toFixed(4),
    breakdown,
    amount: +totalAmount.toFixed(2),
    zoneState: zonePayload(zone)
  });
});

// Get ticket
app.get(BASE + '/tickets/:id', (req, res) => {
  const t = db.tickets.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ status:'error', message:'Ticket not found' });
  res.json(t);
});

// Admin reports
app.get(BASE + '/admin/reports/parking-state', (req, res) => {
  const report = db.zones.map(z => {
    const state = recomputeZoneState(z);
    return {
      zoneId: z.id,
      name: z.name,
      totalSlots: z.totalSlots,
      occupied: state.occupied,
      free: state.free,
      reserved: state.reserved,
      availableForVisitors: state.availableForVisitors,
      availableForSubscribers: state.availableForSubscribers,
      subscriberCount: db.subscriptions.filter(s => s.active && s.category === z.categoryId).length,
      open: z.open
    };
  });
  res.json(report);
});

// Admin: update category (rates)
app.put(BASE + '/admin/categories/:id', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ status:'error', message:'Forbidden' });
  const id = req.params.id;
  const cat = db.categories.find(c => c.id === id);
  if (!cat) return res.status(404).json({ status:'error', message:'Category not found' });
  const { rateNormal, rateSpecial, name, description } = req.body || {};
  if (rateNormal !== undefined) cat.rateNormal = rateNormal;
  if (rateSpecial !== undefined) cat.rateSpecial = rateSpecial;
  if (name) cat.name = name;
  if (description) cat.description = description;
  // broadcast admin-update (simple)
  const msg = JSON.stringify({ type: 'admin-update', payload: { adminId: user.id, action: 'category-rates-changed', targetType: 'category', targetId: id, details: { rateNormal: cat.rateNormal, rateSpecial: cat.rateSpecial }, timestamp: nowIso() }});
  // broadcast to all gate subscribers
  gateSubs.forEach(set => set.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); }));
  res.json(cat);
});

// Admin: open/close zone
app.put(BASE + '/admin/zones/:id/open', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ status:'error', message:'Forbidden' });
  const id = req.params.id;
  const zone = db.zones.find(z => z.id === id);
  if (!zone) return res.status(404).json({ status:'error', message:'Zone not found' });
  zone.open = !!req.body.open;
  // broadcast admin-update and zone-update
  const msg = JSON.stringify({ type: 'admin-update', payload: { adminId: user.id, action: (zone.open?'zone-opened':'zone-closed'), targetType: 'zone', targetId: id, details: { open: zone.open }, timestamp: nowIso() }});
  gateSubs.forEach(set => set.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); }));
  wsBroadcastZoneUpdate(zone.id);
  res.json({ zoneId: zone.id, open: zone.open });
});

// Admin rush-hours & vacations (simple create)
app.post(BASE + '/admin/rush-hours', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ status:'error', message:'Forbidden' });
  const r = { id: 'rush_' + uuidv4().split('-')[0], weekDay: req.body.weekDay, from: req.body.from, to: req.body.to };
  db.rushHours.push(r);
  const msg = JSON.stringify({ type: 'admin-update', payload: { adminId: user.id, action: 'rush-updated', targetType: 'rush', targetId: r.id, details: r, timestamp: nowIso() }});
  gateSubs.forEach(set => set.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); }));
  res.status(201).json(r);
});
app.post(BASE + '/admin/vacations', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ status:'error', message:'Forbidden' });
  const v = { id: 'vac_' + uuidv4().split('-')[0], name: req.body.name, from: req.body.from, to: req.body.to };
  db.vacations.push(v);
  const msg = JSON.stringify({ type: 'admin-update', payload: { adminId: user.id, action: 'vacation-added', targetType: 'vacation', targetId: v.id, details: v, timestamp: nowIso() }});
  gateSubs.forEach(set => set.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); }));
  res.status(201).json(v);
});

// Admin get subscriptions
app.get(BASE + '/admin/subscriptions', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ status:'error', message:'Forbidden' });
  res.json(db.subscriptions);
});

// Start server
server.listen(PORT, () => {
  console.log(`Parking backend starter listening on http://localhost:${PORT}${BASE}`);
});
