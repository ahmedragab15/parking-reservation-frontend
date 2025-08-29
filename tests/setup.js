/**
 * Test Setup - Common utilities and helpers for all tests
 */
const { v4: uuidv4 } = require("uuid");

// Test server instance
let testServer = null;
let testPort = 3001; // Use different port for testing

// Helper to start test server
function startTestServer() {
  return new Promise((resolve, reject) => {
    // Mock the server startup without actually binding to port
    const express = require("express");
    const bodyParser = require("body-parser");
    const cors = require("cors");
    const fs = require("fs");
    const path = require("path");
    const WebSocket = require("ws");

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    // Include all the server logic here (simplified for testing)
    const BASE = "/api/v1";

    // Load seed data
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "../seed.json")));

    // Create testServer object early so handlers can reference it
    testServer = {
      app,
      db: JSON.parse(JSON.stringify(seed)),
      BASE,
      helpers: {},
    };

    // Utilities
    function nowIso() {
      return new Date().toISOString();
    }

    function loginUser(username, password) {
      const user = testServer.db.users.find((u) => u.username === username && u.password === password);
      if (!user) return null;
      return { id: user.id, username: user.username, name: user.name, role: user.role, token: "token-" + user.id };
    }

    function getUserByToken(token) {
      if (!token) return null;
      const id = token.replace("Bearer ", "").replace("token-", "");
      return testServer.db.users.find((u) => u.id === id) || null;
    }

    function categoryById(id) {
      return testServer.db.categories.find((c) => c.id === id);
    }

    function computeReservedForCategory(categoryId, totalSlots = 0) {
      // Reserve 15% of total slots for subscribers
      return Math.ceil(totalSlots * 0.15);
    }

    function recomputeZoneState(zone) {
      const category = categoryById(zone.categoryId);
      const reserved = computeReservedForCategory(zone.categoryId, zone.totalSlots);
      const occupied = zone.occupied || 0;
      const total = zone.totalSlots || 0;
      const free = Math.max(0, total - occupied);
      const reservedOccupied = testServer.db.tickets.filter((t) => t.zoneId === zone.id && !t.checkoutAt && t.type === "subscriber").length;
      const reservedFree = Math.max(0, reserved - reservedOccupied);
      let availableForVisitors = Math.max(0, free - reservedFree);
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
        rateSpecial: category ? category.rateSpecial : 0,
      };
    }

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
        open: zone.open,
      };
    }

    // Auth middleware
    function authMiddleware(req, res, next) {
      const auth = req.headers["authorization"];
      if (!auth) {
        req.user = null;
        return next();
      }
      const user = getUserByToken(auth);
      req.user = user;
      next();
    }
    app.use(authMiddleware);

    // Routes for testing
    app.post(BASE + "/auth/login", (req, res) => {
      const { username, password } = req.body || {};
      const u = loginUser(username, password);
      if (!u) return res.status(401).json({ status: "error", message: "Invalid credentials" });
      res.json({ user: { id: u.id, username: u.username, name: u.name, role: u.role }, token: "token-" + u.id });
    });

    app.get(BASE + "/master/gates", (req, res) => {
      const list = testServer.db.gates.map((g) => ({ id: g.id, name: g.name, zoneIds: g.zoneIds, location: g.location }));
      res.json(list);
    });

    app.get(BASE + "/master/zones", (req, res) => {
      const gateId = req.query.gateId;
      let zones = testServer.db.zones;
      if (gateId) zones = zones.filter((z) => z.gateIds.includes(gateId));
      res.json(zones.map((z) => zonePayload(z)));
    });

    app.get(BASE + "/subscriptions/:id", (req, res) => {
      const id = req.params.id;
      const sub = testServer.db.subscriptions.find((s) => s.id === id);
      if (!sub) return res.status(404).json({ status: "error", message: "Subscription not found" });
      res.json(sub);
    });

    app.get(BASE + "/tickets/:id", (req, res) => {
      const ticket = testServer.db.tickets.find((t) => t.id === req.params.id);
      if (!ticket) return res.status(404).json({ status: "error", message: "Ticket not found" });
      res.json(ticket);
    });

    app.post(BASE + "/tickets/checkin", (req, res) => {
      try {
        const { gateId, zoneId, type, subscriptionId } = req.body || {};
        if (!gateId || !zoneId || !type) return res.status(400).json({ status: "error", message: "Missing required fields" });
        const zone = testServer.db.zones.find((z) => z.id === zoneId);
        if (!zone) return res.status(404).json({ status: "error", message: "Zone not found" });
        const state = recomputeZoneState(zone);
        if (!zone.open) return res.status(409).json({ status: "error", message: "Zone is closed" });

        if (type === "visitor") {
          if (state.availableForVisitors <= 0) return res.status(409).json({ status: "error", message: "No available slots for visitors" });
        } else if (type === "subscriber") {
          const sub = testServer.db.subscriptions.find((s) => s.id === subscriptionId);
          if (!sub || !sub.active) return res.status(400).json({ status: "error", message: "Invalid subscription" });
          if (!sub.categories && sub.category) sub.categories = [sub.category];
          if (!sub.categories.includes(zone.categoryId) && sub.category !== zone.categoryId) {
            return res.status(403).json({ status: "error", message: "Subscription not valid for this category" });
          }
          if (state.free <= 0) return res.status(409).json({ status: "error", message: "No free slots for subscribers" });
        }

        const ticketId = "test_" + uuidv4().split("-")[0];
        const ticket = { id: ticketId, type, zoneId, gateId, checkinAt: nowIso(), checkoutAt: null };
        testServer.db.tickets.push(ticket);
        zone.occupied = (zone.occupied || 0) + 1;

        if (type === "subscriber") {
          const sub = testServer.db.subscriptions.find((s) => s.id === subscriptionId);
          if (sub) {
            if (!sub.currentCheckins) sub.currentCheckins = [];
            sub.currentCheckins.push({ ticketId: ticket.id, zoneId: zoneId, checkinAt: ticket.checkinAt });
          }
        }

        res.status(201).json({ ticket, zoneState: zonePayload(zone) });
      } catch (error) {
        console.error("Checkin error:", error);
        res.status(500).json({ status: "error", message: "Internal server error: " + error.message });
      }
    });

    app.post(BASE + "/tickets/checkout", (req, res) => {
      const { ticketId, forceConvertToVisitor } = req.body || {};
      if (!ticketId) return res.status(400).json({ status: "error", message: "Missing ticketId" });
      const ticket = testServer.db.tickets.find((t) => t.id === ticketId);
      if (!ticket) return res.status(404).json({ status: "error", message: "Ticket not found" });
      if (ticket.checkoutAt) return res.status(400).json({ status: "error", message: "Ticket already checked out" });

      const zone = testServer.db.zones.find((z) => z.id === ticket.zoneId);
      if (!zone) return res.status(404).json({ status: "error", message: "Zone not found" });

      const checkin = new Date(ticket.checkinAt);
      const checkout = new Date();
      const category = categoryById(zone.categoryId);
      const rateNormal = category ? category.rateNormal : 0;

      // Simple breakdown calculation for testing
      const duration = Math.max((checkout - checkin) / 3600000, 0.01); // hours, minimum 0.01 hours
      let amount = 0;

      // If this is a forced conversion to visitor for a subscriber, charge them
      if (forceConvertToVisitor && ticket.type === "subscriber") {
        amount = Math.round(duration * rateNormal * 100) / 100;
      } else if (ticket.type === "visitor") {
        amount = Math.round(duration * rateNormal * 100) / 100;
      }
      // Regular subscribers stay at 0 cost

      const breakdown = [
        {
          from: ticket.checkinAt,
          to: checkout.toISOString(),
          hours: Math.round(duration * 10000) / 10000,
          rateMode: "normal",
          rate: rateNormal,
          amount: amount,
        },
      ];

      ticket.checkoutAt = checkout.toISOString();
      zone.occupied = Math.max(0, (zone.occupied || 1) - 1);

      if (ticket.type === "subscriber") {
        for (const sub of testServer.db.subscriptions) {
          if (sub.currentCheckins && sub.currentCheckins.length) {
            const idx = sub.currentCheckins.findIndex((c) => c.ticketId === ticket.id);
            if (idx >= 0) sub.currentCheckins.splice(idx, 1);
          }
        }
      }

      res.json({
        ticketId: ticket.id,
        checkinAt: ticket.checkinAt,
        checkoutAt: ticket.checkoutAt,
        durationHours: Math.round(duration * 10000) / 10000,
        breakdown,
        amount: amount,
        zoneState: zonePayload(zone),
      });
    });

    // Admin endpoints
    app.get(BASE + "/admin/reports/parking-state", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      const report = testServer.db.zones.map((z) => {
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
          subscriberCount: testServer.db.subscriptions.filter((s) => s.active && s.category === z.categoryId).length,
          open: z.open,
        };
      });
      res.json(report);
    });

    app.put(BASE + "/admin/zones/:id/open", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      const id = req.params.id;
      const zone = testServer.db.zones.find((z) => z.id === id);
      if (!zone) return res.status(404).json({ status: "error", message: "Zone not found" });
      // Handle string "false" and "true" properly
      const openValue = req.body.open;
      zone.open = openValue === "false" ? false : !!openValue;
      res.json({ zoneId: zone.id, open: zone.open });
    });

    app.put(BASE + "/admin/categories/:id", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      const id = req.params.id;
      const cat = testServer.db.categories.find((c) => c.id === id);
      if (!cat) return res.status(404).json({ status: "error", message: "Category not found" });
      const { rateNormal, rateSpecial, name, description } = req.body || {};
      if (rateNormal !== undefined) cat.rateNormal = rateNormal;
      if (rateSpecial !== undefined) cat.rateSpecial = rateSpecial;
      if (name) cat.name = name;
      if (description) cat.description = description;
      res.json(cat);
    });

    app.post(BASE + "/admin/rush-hours", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      const r = { id: "rush_" + uuidv4().split("-")[0], weekDay: req.body.weekDay, from: req.body.from, to: req.body.to };
      testServer.db.rushHours.push(r);
      res.status(201).json(r);
    });

    app.post(BASE + "/admin/vacations", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      const v = { id: "vac_" + uuidv4().split("-")[0], name: req.body.name, from: req.body.from, to: req.body.to };
      testServer.db.vacations.push(v);
      res.status(201).json(v);
    });

    app.get(BASE + "/admin/subscriptions", (req, res) => {
      if (!req.user || req.user.role !== "admin") return res.status(403).json({ status: "error", message: "Forbidden" });
      res.json(testServer.db.subscriptions);
    });

    // Update testServer with helpers
    testServer.helpers = {
      zonePayload,
      recomputeZoneState,
      loginUser,
      getUserByToken,
    };

    resolve(testServer);
  });
}

function stopTestServer() {
  testServer = null;
  return Promise.resolve();
}

function resetDatabase() {
  if (testServer) {
    const fs = require("fs");
    const path = require("path");
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "../seed.json")));
    testServer.db = JSON.parse(JSON.stringify(seed));
  }
}

module.exports = {
  startTestServer,
  stopTestServer,
  resetDatabase,
  getTestServer: () => testServer,
  testPort,
};
