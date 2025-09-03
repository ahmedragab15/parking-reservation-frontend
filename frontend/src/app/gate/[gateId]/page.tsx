"use client";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GateWebSocket } from "@/services/ws";
import { getZonesByGate, getSubscription, postCheckin } from "@/services/api";
import TicketModal from "@/components/gate/TicketModal";
import GateOpenAnimation from "@/components/gate/GateOpenAnimation";
import VisitorTab from "@/components/gate/VisitorTab";
import SubscriberTab from "@/components/gate/SubscriberTab";
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

  const verifySubscription = async () => {
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
  };

  const handleCheckin = async () => {
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
      if (!selectedZone) {
        setCheckinError("Please select a zone");
        return;
      }

      const selectedZoneObj = zones?.find((z) => z.id === selectedZone);
      if (selectedZoneObj?.categoryId !== subscriptionData.category) {
        setCheckinError("Selected zone doesn't match your subscription category");
        return;
      }

      if (!selectedZoneObj.open) {
        setCheckinError("Selected zone is closed");
        return;
      }

      checkinData.zoneId = selectedZone;
      checkinData.subscriptionId = subscriptionData.id;
    }

    try {
      const data = await postCheckin(checkinData);
      setTicketData(data.ticket);
      setShowGateAnimation(true);
      setCheckinError(null);

      setTimeout(() => {
        setShowGateAnimation(false);
        setShowTicketModal(true);
      }, 1500);

      setTimeout(() => {
        setSelectedZone(null);
        setSubscriptionId("");
        setSubscriptionData(null);
      }, 1600);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Check-in error:", error);
      if (error.response?.status === 409) {
        setCheckinError("This subscription is already checked in");
      } else if (error.response?.data?.message) {
        setCheckinError(error.response.data.message);
      } else {
        setCheckinError("Check-in failed. Please try again.");
      }
    }
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
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "visitor" | "subscriber");
          setSelectedZone(null);
          setCheckinError(null);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visitor">Visitor</TabsTrigger>
          <TabsTrigger value="subscriber">Subscriber</TabsTrigger>
        </TabsList>
        {/* Visitor Tab */}
        <TabsContent value="visitor">
          <VisitorTab
            zones={zones}
            isLoading={isLoading}
            error={error}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            isZoneAvailable={isZoneAvailableForVisitor}
            onCheckin={handleCheckin}
            checkinError={checkinError}
          />
        </TabsContent>
        {/* Subscriber Tab */}
        <TabsContent value="subscriber">
          <SubscriberTab
            zones={zones}
            isLoading={isLoading}
            error={error}
            subscriptionId={subscriptionId}
            onSubscriptionIdChange={setSubscriptionId}
            subscriptionData={subscriptionData}
            subscriptionError={subscriptionError}
            onVerifySubscription={verifySubscription}
            isZoneAvailable={isSubscriptionAllowedForZone}
            onCheckin={handleCheckin}
            checkinError={checkinError}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />
        </TabsContent>
      </Tabs>
      <TicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} ticket={ticketData} />
      <GateOpenAnimation isOpen={showGateAnimation} onClose={() => setShowGateAnimation(false)} />
    </div>
  );
}
