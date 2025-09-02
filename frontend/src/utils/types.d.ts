declare interface INavItems {
    name: string;
    href: string;
}

declare interface ActiveLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    activeClassName?: string;
    exact?: boolean;
}

declare interface Category {
    id: string;
    name: string;
    rateNormal: number;
    rateSpecial: number;
}

declare interface Gate {
    id: string;
    name: string;
    zoneIds: string[];
    location: string;
}

declare interface Zone {
  id: string;
  name: string;
  categoryId: string;
  gateIds: string[];
  totalSlots: number;
  occupied: number;
  free: number;
  reserved: number;
  availableForVisitors: number;
  availableForSubscribers: number;
  rateNormal: number;
  rateSpecial: number;
  open: boolean;
}

declare interface RushHour {
    id: string;
    weekDay: number;
    from: string;
    to: string;
}

declare interface Vacation {
    id: string;
    name: string;
    from: string;
    to: string;
}

declare interface Car {
    plate: string;
    brand: string;
    model: string;
    color: string;
}

declare interface Checkin {
    ticketId: string;
    zoneId: string;
    checkinAt: string;
}

declare interface Subscription {
    id: string;
    userName: string;
    active: boolean;
    category: string;
    cars: Car[];
    startsAt: string;
    expiresAt: string;
    currentCheckins: Checkin[];
}

type UserRole = "admin" | "employee";
declare interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    password: string;
}

type TicketType = "subscriber" | "visitor";
declare interface Ticket {
    id: string;
    type: TicketType;
    zoneId: string;
    gateId: string;
    checkinAt: string;
    checkoutAt: string | null;
}

declare interface ParkingSystemData {
    categories: Category[];
    gates: Gate[];
    zones: Zone[];
    rushHours: RushHour[];
    vacations: Vacation[];
    subscriptions: Subscription[];
    users: User[];
    tickets: Ticket[];
}

declare interface CheckinRequest {
  gateId: string;
  zoneId?: string;
  type: "visitor" | "subscriber";
  subscriptionId?: string;
}

declare interface CheckinResponse {
  ticket: Ticket;
  message: string;
}

declare interface BreakdownItem {
  from: string;
  to: string;
  hours: number;
  rateMode: "normal" | "special";
  rate: number;
  amount: number;
}

declare interface CheckoutResponse {
  ticketId: string;
  checkinAt: string;
  checkoutAt: string;
  durationHours: number;
  breakdown: BreakdownItem[];
  amount: number;
}

declare interface IWeekDays {
  value: number;
  label: string;
}