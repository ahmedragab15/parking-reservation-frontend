/**
 * Admin Dashboard Flow Tests
 * Tests the complete flow for admin control panel and management functionality
 */
const request = require("supertest");
const { startTestServer, stopTestServer, resetDatabase, getTestServer } = require("./setup");

describe("Admin Dashboard Flow Tests", () => {
  let server;
  let app;
  let adminToken;
  let superAdminToken;

  beforeAll(async () => {
    server = await startTestServer();
    app = server.app;

    // Login as admin
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ username: "admin", password: "adminpass" }).expect(200);

    adminToken = adminLogin.body.token;

    // Login as super admin
    const superAdminLogin = await request(app).post("/api/v1/auth/login").send({ username: "superadmin", password: "superpass" }).expect(200);

    superAdminToken = superAdminLogin.body.token;
  });

  afterAll(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetDatabase();
  });

  describe("1. Admin Authentication and Access Control", () => {
    test("Should successfully login with admin credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({ username: "admin", password: "adminpass" }).expect(200);

      expect(response.body.user.role).toBe("admin");
      expect(response.body.user.username).toBe("admin");
      expect(response.body).toHaveProperty("token");
    });

    test("Should reject non-admin users from admin endpoints", async () => {
      // Login as employee
      const empLogin = await request(app).post("/api/v1/auth/login").send({ username: "emp1", password: "pass1" }).expect(200);

      const empToken = empLogin.body.token;

      // Try to access admin endpoint
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${empToken}`).expect(403);

      expect(response.body.message).toBe("Forbidden");
    });

    test("Should allow multiple admin accounts", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({ username: "superadmin", password: "superpass" }).expect(200);

      expect(response.body.user.role).toBe("admin");
      expect(response.body.user.name).toBe("Super Admin");
    });
  });

  describe("2. Parking State Reports and Monitoring", () => {
    test("Should fetch comprehensive parking state report", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      expect(response.body).toHaveLength(10); // 10 zones in enhanced seed data

      const zoneReport = response.body[0];
      expect(zoneReport).toHaveProperty("zoneId");
      expect(zoneReport).toHaveProperty("name");
      expect(zoneReport).toHaveProperty("totalSlots");
      expect(zoneReport).toHaveProperty("occupied");
      expect(zoneReport).toHaveProperty("free");
      expect(zoneReport).toHaveProperty("reserved");
      expect(zoneReport).toHaveProperty("availableForVisitors");
      expect(zoneReport).toHaveProperty("availableForSubscribers");
      expect(zoneReport).toHaveProperty("subscriberCount");
      expect(zoneReport).toHaveProperty("open");
    });

    test("Should show accurate subscriber counts per zone category", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      // Find premium zones and check subscriber count
      const premiumZones = response.body.filter((z) => z.name.includes("Zone A") || z.name.includes("Zone B"));
      const premiumZone = premiumZones[0];

      // Should count active premium subscriptions (sub_001 is premium and active)
      expect(premiumZone.subscriberCount).toBeGreaterThanOrEqual(1);
    });

    test("Should show correct occupancy and availability calculations", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      response.body.forEach((zone) => {
        // Basic math validations
        expect(zone.free).toBe(zone.totalSlots - zone.occupied);
        expect(zone.availableForVisitors).toBeLessThanOrEqual(zone.free);
        expect(zone.availableForSubscribers).toBe(zone.free);
        expect(zone.reserved).toBeGreaterThanOrEqual(0);
        expect(zone.reserved).toBeLessThanOrEqual(zone.totalSlots);
      });
    });

    test("Should identify closed zones in reports", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      const closedZone = response.body.find((z) => z.name === "Maintenance Zone");
      expect(closedZone).toBeDefined();
      expect(closedZone.open).toBe(false);
      expect(closedZone.occupied).toBe(0);
    });
  });

  describe("3. Zone Management and Control", () => {
    test("Should successfully open a closed zone", async () => {
      const response = await request(app).put("/api/v1/admin/zones/zone_closed/open").set("Authorization", `Bearer ${adminToken}`).send({ open: true }).expect(200);

      expect(response.body.zoneId).toBe("zone_closed");
      expect(response.body.open).toBe(true);

      // Verify in database
      const testServer = getTestServer();
      const zone = testServer.db.zones.find((z) => z.id === "zone_closed");
      expect(zone.open).toBe(true);
    });

    test("Should successfully close an open zone", async () => {
      const response = await request(app).put("/api/v1/admin/zones/zone_a/open").set("Authorization", `Bearer ${adminToken}`).send({ open: false }).expect(200);

      expect(response.body.zoneId).toBe("zone_a");
      expect(response.body.open).toBe(false);
    });

    test("Should handle opening non-existent zone", async () => {
      const response = await request(app).put("/api/v1/admin/zones/non_existent/open").set("Authorization", `Bearer ${adminToken}`).send({ open: true }).expect(404);

      expect(response.body.message).toBe("Zone not found");
    });

    test("Should handle boolean conversion for zone open status", async () => {
      // Test with string "false"
      const response1 = await request(app).put("/api/v1/admin/zones/zone_a/open").set("Authorization", `Bearer ${adminToken}`).send({ open: "false" }).expect(200);

      expect(response1.body.open).toBe(false);

      // Test with number 1
      const response2 = await request(app).put("/api/v1/admin/zones/zone_a/open").set("Authorization", `Bearer ${adminToken}`).send({ open: 1 }).expect(200);

      expect(response2.body.open).toBe(true);
    });
  });

  describe("4. Category Rate Management", () => {
    test("Should update category rates successfully", async () => {
      const updateData = {
        name: "Premium Plus",
        description: "Enhanced premium parking",
        rateNormal: 6.0,
        rateSpecial: 10.0,
      };

      const response = await request(app).put("/api/v1/admin/categories/cat_premium").set("Authorization", `Bearer ${adminToken}`).send(updateData).expect(200);

      expect(response.body.name).toBe("Premium Plus");
      expect(response.body.rateNormal).toBe(6.0);
      expect(response.body.rateSpecial).toBe(10.0);

      // Verify in database
      const testServer = getTestServer();
      const category = testServer.db.categories.find((c) => c.id === "cat_premium");
      expect(category.rateNormal).toBe(6.0);
      expect(category.rateSpecial).toBe(10.0);
    });

    test("Should handle partial category updates", async () => {
      const updateData = {
        rateNormal: 7.5,
        // Only updating normal rate
      };

      const response = await request(app).put("/api/v1/admin/categories/cat_regular").set("Authorization", `Bearer ${adminToken}`).send(updateData).expect(200);

      expect(response.body.rateNormal).toBe(7.5);
      expect(response.body.rateSpecial).toBe(5.0); // Should remain unchanged
    });

    test("Should handle non-existent category update", async () => {
      const response = await request(app).put("/api/v1/admin/categories/non_existent").set("Authorization", `Bearer ${adminToken}`).send({ rateNormal: 5.0 }).expect(404);

      expect(response.body.message).toBe("Category not found");
    });
  });

  describe("5. Rush Hours Management", () => {
    test("Should add new rush hour window", async () => {
      const rushData = {
        weekDay: 3, // Wednesday
        from: "12:00",
        to: "14:00",
      };

      const response = await request(app).post("/api/v1/admin/rush-hours").set("Authorization", `Bearer ${adminToken}`).send(rushData).expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.weekDay).toBe(3);
      expect(response.body.from).toBe("12:00");
      expect(response.body.to).toBe("14:00");

      // Verify in database
      const testServer = getTestServer();
      const rushHour = testServer.db.rushHours.find((r) => r.id === response.body.id);
      expect(rushHour).toBeDefined();
    });

    test("Should handle multiple rush windows for same day", async () => {
      const rushData1 = {
        weekDay: 2, // Tuesday
        from: "08:00",
        to: "10:00",
      };

      const rushData2 = {
        weekDay: 2, // Tuesday
        from: "16:00",
        to: "18:00",
      };

      const response1 = await request(app).post("/api/v1/admin/rush-hours").set("Authorization", `Bearer ${adminToken}`).send(rushData1).expect(201);

      const response2 = await request(app).post("/api/v1/admin/rush-hours").set("Authorization", `Bearer ${adminToken}`).send(rushData2).expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe("6. Vacation Management", () => {
    test("Should add new vacation period", async () => {
      const vacationData = {
        name: "Spring Break",
        from: "2025-03-15",
        to: "2025-03-22",
      };

      const response = await request(app).post("/api/v1/admin/vacations").set("Authorization", `Bearer ${adminToken}`).send(vacationData).expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Spring Break");
      expect(response.body.from).toBe("2025-03-15");
      expect(response.body.to).toBe("2025-03-22");
    });

    test("Should handle overlapping vacation periods", async () => {
      const vacation1 = {
        name: "Holiday 1",
        from: "2025-12-20",
        to: "2025-12-31",
      };

      const vacation2 = {
        name: "Holiday 2",
        from: "2025-12-25",
        to: "2026-01-05",
      };

      // Both should be created successfully (overlap handling is business logic)
      const response1 = await request(app).post("/api/v1/admin/vacations").set("Authorization", `Bearer ${adminToken}`).send(vacation1).expect(201);

      const response2 = await request(app).post("/api/v1/admin/vacations").set("Authorization", `Bearer ${adminToken}`).send(vacation2).expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe("7. Subscription Management", () => {
    test("Should list all subscriptions for admin review", async () => {
      const response = await request(app).get("/api/v1/admin/subscriptions").set("Authorization", `Bearer ${adminToken}`).expect(200);

      expect(response.body).toHaveLength(6); // 6 subscriptions in seed data

      const subscription = response.body[0];
      expect(subscription).toHaveProperty("id");
      expect(subscription).toHaveProperty("userName");
      expect(subscription).toHaveProperty("active");
      expect(subscription).toHaveProperty("category");
      expect(subscription).toHaveProperty("cars");
    });

    test("Should show both active and inactive subscriptions", async () => {
      const response = await request(app).get("/api/v1/admin/subscriptions").set("Authorization", `Bearer ${adminToken}`).expect(200);

      const activeCount = response.body.filter((s) => s.active).length;
      const inactiveCount = response.body.filter((s) => !s.active).length;

      expect(activeCount).toBeGreaterThan(0);
      expect(inactiveCount).toBeGreaterThan(0); // sub_006 is inactive
    });

    test("Should show current check-ins for subscriptions", async () => {
      const response = await request(app).get("/api/v1/admin/subscriptions").set("Authorization", `Bearer ${adminToken}`).expect(200);

      const checkedInSub = response.body.find((s) => s.currentCheckins && s.currentCheckins.length > 0);
      expect(checkedInSub).toBeDefined();
      expect(checkedInSub.currentCheckins[0]).toHaveProperty("ticketId");
      expect(checkedInSub.currentCheckins[0]).toHaveProperty("zoneId");
      expect(checkedInSub.currentCheckins[0]).toHaveProperty("checkinAt");
    });
  });

  describe("8. System Monitoring and Analytics", () => {
    test("Should provide comprehensive system overview", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      // Calculate system-wide metrics
      const totalSlots = response.body.reduce((sum, zone) => sum + zone.totalSlots, 0);
      const totalOccupied = response.body.reduce((sum, zone) => sum + zone.occupied, 0);
      const totalFree = response.body.reduce((sum, zone) => sum + zone.free, 0);

      expect(totalSlots).toBeGreaterThan(0);
      expect(totalOccupied).toBeGreaterThan(0);
      expect(totalFree).toBe(totalSlots - totalOccupied);
    });

    test("Should identify high-occupancy zones", async () => {
      const response = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${adminToken}`).expect(200);

      const highOccupancyZones = response.body.filter((zone) => {
        return zone.occupied / zone.totalSlots > 0.8; // 80% or more occupied
      });

      // zone_h should be high occupancy (90/120)
      const zoneH = response.body.find((z) => z.name === "Zone H");
      expect(zoneH.occupied / zoneH.totalSlots).toBeGreaterThan(0.8);
    });

    test("Should track subscription distribution across categories", async () => {
      const subsResponse = await request(app).get("/api/v1/admin/subscriptions").set("Authorization", `Bearer ${adminToken}`).expect(200);

      const categoryDistribution = {};
      subsResponse.body.forEach((sub) => {
        if (sub.active) {
          categoryDistribution[sub.category] = (categoryDistribution[sub.category] || 0) + 1;
        }
      });

      expect(categoryDistribution).toHaveProperty("cat_premium");
      expect(categoryDistribution).toHaveProperty("cat_regular");
      expect(categoryDistribution).toHaveProperty("cat_economy");
      expect(categoryDistribution).toHaveProperty("cat_vip");
    });
  });

  describe("9. Integration Test - Complete Admin Workflow", () => {
    test("Should complete comprehensive admin management session", async () => {
      // 1. Login and verify admin access
      const loginResponse = await request(app).post("/api/v1/auth/login").send({ username: "superadmin", password: "superpass" }).expect(200);

      const token = loginResponse.body.token;

      // 2. Review system state
      const stateResponse = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${token}`).expect(200);

      const closedZone = stateResponse.body.find((z) => !z.open);
      expect(closedZone).toBeDefined();

      // 3. Open the closed zone
      const openResponse = await request(app).put(`/api/v1/admin/zones/${closedZone.zoneId}/open`).set("Authorization", `Bearer ${token}`).send({ open: true }).expect(200);

      expect(openResponse.body.open).toBe(true);

      // 4. Update category rates
      const rateResponse = await request(app)
        .put("/api/v1/admin/categories/cat_vip")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rateNormal: 12.0,
          rateSpecial: 18.0,
        })
        .expect(200);

      expect(rateResponse.body.rateNormal).toBe(12.0);

      // 5. Add new rush hour
      const rushResponse = await request(app)
        .post("/api/v1/admin/rush-hours")
        .set("Authorization", `Bearer ${token}`)
        .send({
          weekDay: 0, // Sunday
          from: "14:00",
          to: "16:00",
        })
        .expect(201);

      expect(rushResponse.body.weekDay).toBe(0);

      // 6. Add vacation period
      const vacationResponse = await request(app)
        .post("/api/v1/admin/vacations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Admin Test Holiday",
          from: "2025-11-01",
          to: "2025-11-03",
        })
        .expect(201);

      expect(vacationResponse.body.name).toBe("Admin Test Holiday");

      // 7. Review subscriptions
      const subscriptionsResponse = await request(app).get("/api/v1/admin/subscriptions").set("Authorization", `Bearer ${token}`).expect(200);

      expect(subscriptionsResponse.body.length).toBeGreaterThan(0);

      // 8. Final state check - verify changes
      const finalStateResponse = await request(app).get("/api/v1/admin/reports/parking-state").set("Authorization", `Bearer ${token}`).expect(200);

      const updatedZone = finalStateResponse.body.find((z) => z.zoneId === closedZone.zoneId);
      expect(updatedZone.open).toBe(true);
    });

    test("Should handle rapid sequential admin operations", async () => {
      // Test system stability under rapid admin changes
      const operations = [];

      // Rapid zone toggles
      for (let i = 0; i < 3; i++) {
        operations.push(
          request(app)
            .put("/api/v1/admin/zones/zone_a/open")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ open: i % 2 === 0 })
        );
      }

      // Rapid rate changes
      for (let i = 0; i < 3; i++) {
        operations.push(
          request(app)
            .put("/api/v1/admin/categories/cat_regular")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ rateNormal: 3.0 + i })
        );
      }

      // Execute all operations
      const results = await Promise.all(operations);

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200);
      });
    });
  });
});
