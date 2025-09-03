"use client";
import { ReactNode, useEffect, useState } from "react";
import { useGateWebSocket } from "@/hooks/useGateWebSocket";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Wifi, WifiOff, Menu } from "lucide-react";
import axiosInstance from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import AdminDashboardSidebar from "@/components/admin/AdminDashboardSidebar";

interface LayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: LayoutProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [gateIds, setGateIds] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const res = await axiosInstance("/master/gates");
      setGateIds(res.data.map((g: Gate) => g.id));
    })();
  }, []);
  const { isConnected } = useGateWebSocket(gateIds);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const menuButton = document.getElementById("menu-button");
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) && menuButton && !menuButton.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden sticky top-21 left-0 right-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button id="menu-button" variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/30 bg-opacity-50 transition-opacity" />}
      {/* Mobile sidebar */}
      <div
        id="mobile-sidebar"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminDashboardSidebar isMobile={true} user={user} isConnected={isConnected} setSidebarOpen={setSidebarOpen} />
      </div>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
        <AdminDashboardSidebar user={user} isConnected={isConnected} setSidebarOpen={setSidebarOpen} />
      </div>
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 md:p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
