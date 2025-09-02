"use client";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGateWebSocket } from "@/hooks/useGateWebSocket";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import ActiveLink from "@/components/shared/ActiveLink";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { dashboardSidebar } from "@/constants";
import axiosInstance from "@/config/axios.config";

interface LayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: LayoutProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [gateIds, setGateIds] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const res = await axiosInstance("/master/gates");
      setGateIds(res.data.map((g: Gate) => g.id));
    })();
  }, []);
  const { isConnected } = useGateWebSocket(gateIds);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            {dashboardSidebar.map((item) => {
              return (
                <ActiveLink
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                  "
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </ActiveLink>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{user?.username || "username"}</p>
                <p className="text-gray-500">Administrator</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <LogOut className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
