/**
 * Gate Screen Flow Tests
 * Tests the complete flow for gate check-in screen functionality
 */
const request = require("supertest");
const { startTestServer, stopTestServer, resetDatabase, getTestServer } = require("./setup");

describe("Gate Screen Flow Tests", () => {
  let server;
  let app;

  beforeAll(async () => {
    server = await startTestServer();
    app = server.app;
  });

  afterAll(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetDatabase();
  });

  describe("1. Gate Screen Load and Data Fetching", () => {
    test("Should fetch all gates successfully", async () => {
      const response = await request(app).get("/api/v1/master/gates").expect(200);

      expect(response.body).toHaveLength(5);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("zoneIds");
      expect(response.body[0]).toHaveProperty("location");
    });

    test("Should fetch zones for specific gate", async () => {
      const response = await request(app).get("/api/v1/master/zones?gateId=gate_1").expect(200);

      expect(response.body.length).toBeGreaterThan(0);

      // Verify zone structure includes computed fields
      const zone = response.body[0];
      expect(zone).toHaveProperty("id");
      expect(zone).toHaveProperty("name");
      expect(zone).toHaveProperty("occupied");
      expect(zone).toHaveProperty("free");
      expect(zone).toHaveProperty("reserved");
      expect(zone).toHaveProperty("availableForVisitors");
      expect(zone).toHaveProperty("availableForSubscribers");
      expect(zone).toHaveProperty("rateNormal");
      expect(zone).toHaveProperty("rateSpecial");
      expect(zone).toHaveProperty("open");
    });

    test("Should return zones accessible through gate_1", async () => {
      const response = await request(app).get("/api/v1/master/zones?gateId=gate_1").expect(200);

      // gate_1 should have zones: zone_a, zone_b, zone_f
      const zoneIds = response.body.map((z) => z.id);
      expect(zoneIds).toContain("zone_a");
      expect(zoneIds).toContain("zone_b");
      expect(zoneIds).toContain("zone_f");
    });
  });

  describe("2. Visitor Check-in Flow", () => {
    test("Should successfully check-in visitor to available zone", async () => {
      const checkinData = {
        gateId: "gate_1",
        zoneId: "zone_a",
        type: "visitor",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(201);

      expect(response.body).toHaveProperty("ticket");
      expect(response.body).toHaveProperty("zoneState");

      const ticket = response.body.ticket;
      expect(ticket.type).toBe("visitor");
      expect(ticket.zoneId).toBe("zone_a");
      expect(ticket.gateId).toBe("gate_1");
      expect(ticket.checkinAt).toBeDefined();
      expect(ticket.checkoutAt).toBeNull();

      // Verify zone state is updated
      const zoneState = response.body.zoneState;
      expect(zoneState.occupied).toBeGreaterThan(0);
    });

    test("Should reject visitor check-in to closed zone", async () => {
      const checkinData = {
        gateId: "gate_2",
        zoneId: "zone_closed",
        type: "visitor",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(409);

      expect(response.body.message).toBe("Zone is closed");
    });

    test("Should reject visitor check-in when no slots available", async () => {
      // First, fill up the zone by setting occupied = totalSlots
      const testServer = getTestServer();
      const zone = testServer.db.zones.find((z) => z.id === "zone_e");
      zone.occupied = zone.totalSlots; // Fill the zone

      const checkinData = {
        gateId: "gate_3",
        zoneId: "zone_e",
        type: "visitor",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(409);

      expect(response.body.message).toBe("No available slots for visitors");
    });

    test("Should validate required fields for visitor check-in", async () => {
      const invalidData = {
        gateId: "gate_1",
        // missing zoneId and type
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(invalidData).expect(400);

      expect(response.body.message).toBe("Missing required fields");
    });
  });

  describe("3. Subscriber Check-in Flow", () => {
    test("Should verify valid subscription", async () => {
      const response = await request(app).get("/api/v1/subscriptions/sub_001").expect(200);

      expect(response.body).toHaveProperty("id", "sub_001");
      expect(response.body).toHaveProperty("userName", "Ali");
      expect(response.body).toHaveProperty("active", true);
      expect(response.body).toHaveProperty("category", "cat_premium");
      expect(response.body).toHaveProperty("cars");
      expect(response.body.cars).toHaveLength(1);
    });

    test("Should successfully check-in subscriber with valid category access", async () => {
      // sub_001 has cat_premium, zone_a is cat_premium
      const checkinData = {
        gateId: "gate_1",
        zoneId: "zone_a",
        type: "subscriber",
        subscriptionId: "sub_001",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(201);

      expect(response.body.ticket.type).toBe("subscriber");
      expect(response.body.ticket.zoneId).toBe("zone_a");

      // Verify subscription is updated with current check-in
      const subResponse = await request(app).get("/api/v1/subscriptions/sub_001").expect(200);

      expect(subResponse.body.currentCheckins).toHaveLength(1);
      expect(subResponse.body.currentCheckins[0].ticketId).toBe(response.body.ticket.id);
    });

    test("Should reject subscriber check-in for wrong category", async () => {
      // sub_003 has cat_economy, zone_a is cat_premium
      const checkinData = {
        gateId: "gate_1",
        zoneId: "zone_a",
        type: "subscriber",
        subscriptionId: "sub_003",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(403);

      expect(response.body.message).toBe("Subscription not valid for this category");
    });

    test("Should reject inactive subscription", async () => {
      // sub_006 is inactive
      const checkinData = {
        gateId: "gate_5",
        zoneId: "zone_vip",
        type: "subscriber",
        subscriptionId: "sub_006",
      };

      const response = await request(app).post("/api/v1/tickets/checkin").send(checkinData).expect(400);

      expect(response.body.message).toBe("Invalid subscription");
    });

    test("Should handle non-existent subscription", async () => {
      const response = await request(app).get("/api/v1/subscriptions/non_existent").expect(404);

      expect(response.body.message).toBe("Subscription not found");
    });
  });

  describe("4. Zone State and Availability Calculations", () => {
    test("Should correctly calculate zone availability for visitors", async () => {
      const response = await request(app).get("/api/v1/master/zones?gateId=gate_1").expect(200);

      const zone = response.body.find((z) => z.id === "zone_a");

      // Verify calculations
      expect(zone.free).toBe(zone.totalSlots - zone.occupied);
      expect(zone.availableForVisitors).toBeLessThanOrEqual(zone.free);
      expect(zone.availableForSubscribers).toBe(zone.free);
      expect(zone.reserved).toBeGreaterThanOrEqual(0);
    });

    test("Should show different availability for different gates", async () => {
      const gate1Response = await request(app).get("/api/v1/master/zones?gateId=gate_1").expect(200);

      const gate2Response = await request(app).get("/api/v1/master/zones?gateId=gate_2").expect(200);

      const gate1ZoneIds = gate1Response.body.map((z) => z.id);
      const gate2ZoneIds = gate2Response.body.map((z) => z.id);

      // Different gates should have different zone access
      expect(gate1ZoneIds).not.toEqual(gate2ZoneIds);
    });

    test("Should handle VIP zone access correctly", async () => {
      const response = await request(app).get("/api/v1/master/zones?gateId=gate_5").expect(200);

      const vipZone = response.body.find((z) => z.id === "zone_vip");
      expect(vipZone).toBeDefined();
      expect(vipZone.categoryId).toBe("cat_vip");
      expect(vipZone.rateNormal).toBe(10.0);
      expect(vipZone.rateSpecial).toBe(15.0);
    });
  });

  describe("5. Integration Test - Complete Gate Flow", () => {
    test("Should complete full visitor journey at gate", async () => {
      // 1. Load gate data
      const gatesResponse = await request(app).get("/api/v1/master/gates").expect(200);

      const gate = gatesResponse.body.find((g) => g.id === "gate_1");
      expect(gate).toBeDefined();

      // 2. Load zones for gate
      const zonesResponse = await request(app).get("/api/v1/master/zones?gateId=gate_1").expect(200);

      const availableZone = zonesResponse.body.find((z) => z.open && z.availableForVisitors > 0);
      expect(availableZone).toBeDefined();

      // 3. Perform check-in
      const initialOccupied = availableZone.occupied;

      const checkinResponse = await request(app)
        .post("/api/v1/tickets/checkin")
        .send({
          gateId: "gate_1",
          zoneId: availableZone.id,
          type: "visitor",
        })
        .expect(201);

      // 4. Verify state change
      expect(checkinResponse.body.zoneState.occupied).toBe(initialOccupied + 1);
      expect(checkinResponse.body.ticket.id).toBeDefined();
    });

    test("Should complete full subscriber journey at gate", async () => {
      // 1. Verify subscription
      const subResponse = await request(app)
        .get("/api/v1/subscriptions/sub_004") // VIP subscription
        .expect(200);

      expect(subResponse.body.category).toBe("cat_vip");

      // 2. Load VIP gate zones
      const zonesResponse = await request(app).get("/api/v1/master/zones?gateId=gate_5").expect(200);

      const vipZone = zonesResponse.body.find((z) => z.categoryId === "cat_vip");
      expect(vipZone).toBeDefined();

      // 3. Perform VIP check-in
      const checkinResponse = await request(app)
        .post("/api/v1/tickets/checkin")
        .send({
          gateId: "gate_5",
          zoneId: "zone_vip",
          type: "subscriber",
          subscriptionId: "sub_004",
        })
        .expect(201);

      expect(checkinResponse.body.ticket.type).toBe("subscriber");
    });
  });
});
