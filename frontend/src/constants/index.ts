import { LayoutDashboard, Users, BarChart3, Settings } from "lucide-react";

export const navItems: INavItems[] = [
  {
    name: "Gate Check-in",
    href: "/gate",
  },
  {
    name: "Checkpoint Checkout",
    href: "/checkpoint",
  },
];

export const dashboardSidebar: IDashboardSidebar[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    href: "/admin/employees",
    icon: Users,
  },
  {
    name: "Parking Report",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Control Panel",
    href: "/admin/control",
    icon: Settings,
  },
];

export const weekDays: IWeekDays[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
