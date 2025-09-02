"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GateWebSocket } from "@/services/ws";
import { getZonesByGate, getSubscription, postCheckin } from "@/services/api";
import TicketModal from "@/components/gate/TicketModal";
import GateOpenAnimation from "@/components/gate/GateOpenAnimation";
import ZoneCard from "@/components/gate/ZoneCard";
import { AxiosError } from "axios";

export default function GateScreen() {
  const params = useParams();
  const gateId = params.gateId as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"visitor" | "subscriber">("visitor");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showGateAnimation, setShowGateAnimation] = useState(false);
  const [ticketData, setTicketData] = useState<Ticket | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const {
    data: zones,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["zones", gateId],
    queryFn: () => getZonesByGate(gateId),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!gateId) return;
    const onZoneUpdate = (zone: Zone) => {
      queryClient.setQueryData(["zones", gateId], (oldZones: Zone[] | undefined) => {
        if (!oldZones) return [zone];
        return oldZones.map((z) => (z.id === zone.id ? { ...z, ...zone } : z));
      });
    };
    const onAdminUpdate = (data: AxiosError) => console.log("Admin update received:", data);
    const onConnectionChange = (connected: boolean) => setWsConnected(connected);
    const ws = new GateWebSocket(gateId, onZoneUpdate, onAdminUpdate, onConnectionChange);

    return () => {
      ws.disconnect();
    };
  }, [gateId, queryClient]);

  const verifySubscription = useCallback(async () => {
    if (!subscriptionId.trim()) {
      setSubscriptionError("Please enter a subscription ID");
      return;
    }

    try {
      setSubscriptionError(null);
      const data = await getSubscription(subscriptionId.trim());
      setSubscriptionData(data);
    } catch (err: unknown) {
      const error = err as AxiosError;
      setSubscriptionData(null);
      if (error.response?.status === 404) {
        setSubscriptionError("Subscription not found");
      } else {
        setSubscriptionError("Error verifying subscription");
      }
    }
  }, [subscriptionId]);

  const checkinMutation = useMutation({
    mutationFn: postCheckin,
    onSuccess: (data) => {
      setTicketData(data.ticket);
      setShowTicketModal(true);
      setShowGateAnimation(true);
      setCheckinError(null);

      setTimeout(() => setShowGateAnimation(false), 3000);

      if (activeTab === "visitor") {
        setSelectedZone(null);
      } else {
        setSubscriptionId("");
        setSubscriptionData(null);
      }
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        setCheckinError("This subscription is already checked in");
      } else {
        setCheckinError("Check-in failed. Please try again.");
      }
    },
  });

  const handleCheckin = () => {
    setCheckinError(null);
    const checkinData: CheckinRequest = {
      gateId,
      type: activeTab,
    };

    if (activeTab === "visitor") {
      if (!selectedZone) {
        setCheckinError("Please select a zone");
        return;
      }
      checkinData.zoneId = selectedZone;
    } else {
      if (!subscriptionData) {
        setCheckinError("Please verify your subscription first");
        return;
      }
      checkinData.subscriptionId = subscriptionData.id;
    }

    checkinMutation.mutate(checkinData);
  };

  const isZoneAvailableForVisitor = (zone: Zone): boolean => zone.open && zone.availableForVisitors > 0;

  const isSubscriptionAllowedForZone = (zone: Zone): boolean => {
    if (!subscriptionData || !subscriptionData.active) return false;
    if (!zone.open) return false;

    return subscriptionData.category === zone.categoryId;
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gate: {gateId}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span>{wsConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{currentTime.toLocaleTimeString()}</div>
          <div className="text-sm text-gray-500">{currentTime.toLocaleDateString()}</div>
        </div>
      </header>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "visitor" | "subscriber")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visitor">Visitor</TabsTrigger>
          <TabsTrigger value="subscriber">Subscriber</TabsTrigger>
        </TabsList>
        {/* Visitor Tab */}
        <TabsContent value="visitor">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : error ? (
              <div className="col-span-full text-center text-red-500">Error loading zones</div>
            ) : zones && zones.length > 0 ? (
              zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedZone === zone.id}
                  onSelect={() => setSelectedZone(zone.id)}
                  disabled={!isZoneAvailableForVisitor(zone)}
                />
              ))
            ) : (
              <div className="col-span-full text-center">No zones available for this gate</div>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleCheckin} disabled={!selectedZone || checkinMutation.isPending} size="lg">
              {checkinMutation.isPending ? "Processing..." : "Check In"}
            </Button>
          </div>
        </TabsContent>
        {/* Subscriber Tab */}
        <TabsContent value="subscriber">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Subscription Check-in</CardTitle>
              <CardDescription>Enter your subscription ID to verify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  placeholder="Enter subscription ID"
                  className="flex-1"
                />
                <Button onClick={verifySubscription} disabled={!subscriptionId.trim()}>
                  Verify
                </Button>
              </div>
              {subscriptionError && <div className="mt-2 text-red-500 text-sm">{subscriptionError}</div>}

              {subscriptionData && (
                <div className="mt-4 p-3 border rounded-md">
                  <h3 className="font-semibold">Subscription Details</h3>
                  <p>Name: {subscriptionData.userName}</p>
                  <p>Status: {subscriptionData.active ? "Active" : "Inactive"}</p>
                  <p>Category: {subscriptionData.category}</p>
                  {subscriptionData.currentCheckins.length > 0 && <p className="text-yellow-600">Already checked in</p>}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Zones Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : error ? (
              <div className="col-span-full text-center text-red-500">Error loading zones</div>
            ) : zones && zones.length > 0 ? (
              zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedZone === zone.id}
                  onSelect={() => setSelectedZone(zone.id)}
                  disabled={!isSubscriptionAllowedForZone(zone)}
                />
              ))
            ) : (
              <div className="col-span-full text-center">No zones available for this gate</div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleCheckin} disabled={!subscriptionData || !selectedZone || checkinMutation.isPending} size="lg">
              {checkinMutation.isPending ? "Processing..." : "Check In"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      {/* Error message */}
      {checkinError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{checkinError}</div>}
      {/* Ticket Modal */}
      <TicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} ticket={ticketData} />
      {/* Gate Open Animation */}
      <GateOpenAnimation isOpen={showGateAnimation} onClose={() => setShowGateAnimation(false)} />
    </div>
  );
}
