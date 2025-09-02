/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import useCustomQuery from "@/hooks/useCustomQuery";
import { useGateWebSocket } from "@/hooks/useGateWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Car, Users, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axiosInstance from "@/config/axios.config";
import StatsCard from "@/components/admin/StatsCard";

const AdminDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [gateIds, setGateIds] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const res = await axiosInstance("/master/gates");
      setGateIds(res.data.map((g: Gate) => g.id));
    })();
  }, []);

  const { isConnected, adminUpdates } = useGateWebSocket(gateIds);
  const { data: parkingState, isLoading: reportLoading } = useCustomQuery({
    queryKey: ["admin", "parking-state"],
    url: "/admin/reports/parking-state",
  });

  const totalSlots = parkingState?.reduce((sum: number, zone: any) => sum + zone.totalSlots, 0) || 0;
  const totalOccupied = parkingState?.reduce((sum: number, zone: any) => sum + zone.occupied, 0) || 0;
  const totalSubscribers = parkingState?.reduce((sum: number, zone: any) => sum + zone.subscriberCount, 0) || 0;
  const occupancyRate = totalSlots > 0 ? ((totalOccupied / totalSlots) * 100).toFixed(1) : "0";

  if (reportLoading) {
    return <div>Loading...</div>;
  }

  const statsData = [
    {
      title: "Total Slots",
      value: totalSlots,
      description: "Across all zones",
      icon: <Car className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Occupied",
      value: totalOccupied,
      description: "Currently parked",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      description: "Current utilization",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Subscribers",
      value: totalSubscribers,
      description: "With valid subscriptions",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user && user.username}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <StatsCard key={stat.title} title={stat.title} value={stat.value} description={stat.description} icon={stat.icon} />
        ))}
      </div>
      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
          <CardDescription>Real-time admin actions and system updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {adminUpdates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              adminUpdates.map((update: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{update.action.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                    <p className="text-xs text-gray-500">
                      Target: {update.targetType} ({update.targetId})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-400">Admin: {update.adminId}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      {/* Quick Zone Status */}
      {parkingState && (
        <Card>
          <CardHeader>
            <CardTitle>Zone Status Overview</CardTitle>
            <CardDescription>Current status of all parking zones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parkingState.map((zone: any) => (
                <div key={zone.zoneId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{zone.name}</h3>
                    <Badge variant={zone.open ? "default" : "secondary"}>{zone.open ? "Open" : "Closed"}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Occupied: {zone.occupied}/{zone.totalSlots}
                    </p>
                    <p>Available for Visitors: {zone.availableForVisitors}</p>
                    <p>Subscribers: {zone.subscriberCount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
