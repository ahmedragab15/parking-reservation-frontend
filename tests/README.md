# Parking Backend - Unit Tests

This directory contains comprehensive unit tests for the Parking Reservation System backend, organized by application screen/functionality.

## Test Structure

### 🚪 Gate Screen Tests (`gate-screen.test.js`)

Tests the complete visitor and subscriber check-in flow:

- **Gate Load & Data Fetching**

  - Fetch all gates
  - Fetch zones by gate ID
  - Verify computed zone fields (occupied, free, reserved, etc.)

- **Visitor Check-in Flow**

  - Successful check-in to available zones
  - Rejection for closed zones
  - Rejection when no slots available
  - Field validation

- **Subscriber Check-in Flow**

  - Subscription verification
  - Category-based access control
  - Multi-car subscription handling
  - Inactive subscription handling

- **Zone State Calculations**
  - Availability calculations for visitors vs subscribers
  - Reserved slot calculations
  - Cross-gate zone access

### 🏁 Checkpoint Screen Tests (`checkpoint-screen.test.js`)

Tests the complete employee checkout and verification flow:

- **Employee Authentication**

  - Login with various employee types
  - Checkpoint-specific employee access
  - Invalid credential handling

- **Ticket Lookup & Display**

  - Active ticket information retrieval
  - Subscription car details for verification
  - Non-existent ticket handling

- **Standard Checkout Flow**

  - Visitor checkout with rate breakdown
  - Subscriber checkout (typically free)
  - Already checked-out ticket handling
  - Zone occupancy updates

- **Force Convert to Visitor**

  - Plate mismatch scenarios
  - Subscriber-to-visitor conversion
  - Rate recalculation

- **VIP & Special Categories**
  - Higher rate zones (VIP: $10/hour)
  - Lower rate zones (Economy: $1.5/hour)
  - Category-specific handling

### 👨‍💼 Admin Dashboard Tests (`admin-dashboard.test.js`)

Tests the complete admin control panel functionality:

- **Authentication & Access Control**

  - Admin vs employee access differentiation
  - Multiple admin account support
  - Endpoint protection

- **Parking State Reports**

  - Comprehensive system overview
  - Subscriber count tracking
  - Occupancy calculations
  - Closed zone identification

- **Zone Management**

  - Opening/closing zones
  - Non-existent zone handling
  - Boolean value conversion

- **Category Rate Management**

  - Rate updates (normal/special)
  - Partial updates
  - Non-existent category handling

- **Rush Hours Management**

  - Adding new rush windows
  - Multiple windows per day
  - Weekday-specific rules

- **Vacation Management**

  - Adding vacation periods
  - Overlapping period handling
  - Date range validation

- **Subscription Management**
  - Listing all subscriptions
  - Active/inactive status tracking
  - Current check-in monitoring

## Running Tests

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run tests for specific screen
npm run test:gate
npm run test:checkpoint
npm run test:admin

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Data

Tests use the enhanced seed data which includes:

- **5 gates** (Main, East, South, West, VIP entrances)
- **10 zones** (including VIP, closed maintenance zone)
- **4 categories** (Premium, Regular, Economy, VIP)
- **6 subscriptions** (various states and categories)
- **7 users** (2 admins, 5 employees including checkpoint staff)
- **Multiple rush hours and vacation periods**

## Test Scenarios Covered

### Real-world Edge Cases

- ✅ Zone closure during operations
- ✅ High occupancy zones (90/120 occupied)
- ✅ Multi-car subscriptions
- ✅ Expired/inactive subscriptions
- ✅ Cross-gate zone access
- ✅ VIP exclusive access
- ✅ Rate variations by category
- ✅ Employee role differentiation

### Business Logic Validation

- ✅ Reserved slot calculations (15% for subscribers)
- ✅ Availability computations
- ✅ Rate breakdown generation
- ✅ Subscription category validation
- ✅ Force conversion scenarios
- ✅ System state consistency

### Integration Flows

- ✅ Complete visitor journey (gate → checkout)
- ✅ Complete subscriber journey (verification → check-in → checkout)
- ✅ Complete admin workflow (reports → management → monitoring)
- ✅ Cross-screen data consistency
- ✅ Rapid operation handling

## Coverage Goals

The tests aim for comprehensive coverage of:

- All API endpoints
- Business logic calculations
- Error handling scenarios
- Authentication flows
- Data validation
- State management
- Real-world usage patterns

Each test file represents a complete user journey through one of the main application screens, ensuring that frontend developers will have a reliable backend to test against.
