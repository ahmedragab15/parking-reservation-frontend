import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ZoneCard from "@/components/gate/ZoneCard";

interface IProps {
  zones: Zone[] | undefined;
  isLoading: boolean;
  error: Error | null;
  subscriptionId: string;
  onSubscriptionIdChange: (id: string) => void;
  subscriptionData: Subscription | null;
  subscriptionError: string | null;
  onVerifySubscription: () => void;
  isZoneAvailable: (zone: Zone) => boolean;
  onCheckin: () => void;
  checkinError: string | null;
  selectedZone: string | null;
  onSelectZone: (zoneId: string) => void;
}

const SubscriberTab = ({
  zones,
  isLoading,
  error,
  subscriptionId,
  onSubscriptionIdChange,
  subscriptionData,
  subscriptionError,
  onVerifySubscription,
  isZoneAvailable,
  onCheckin,
  checkinError,
  selectedZone,
  onSelectZone,
}: IProps) => {
  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Subscription Check-in</CardTitle>
          <CardDescription>Enter your subscription ID to verify</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={subscriptionId}
              onChange={(e) => onSubscriptionIdChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onVerifySubscription()}
              placeholder="Enter subscription ID"
              className="flex-1"
            />
            <Button onClick={onVerifySubscription} disabled={!subscriptionId.trim()}>
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
      {/* Show available zones for the subscriber's category */}
      {subscriptionData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Available Zones for Your Subscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : error ? (
              <div className="col-span-full text-center text-red-500">Error loading zones</div>
            ) : zones && zones.length > 0 ? (
              (() => {
                const availableZones = zones.filter((zone) => isZoneAvailable(zone));
                return availableZones.length > 0 ? (
                  availableZones.map((zone) => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      isSelected={selectedZone === zone.id}
                      onSelect={() => onSelectZone(zone.id)}
                      disabled={false}
                      showSelection={true}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center">No zones available for your subscription category</div>
                );
              })()
            ) : (
              <div className="col-span-full text-center">No zones available for your subscription category</div>
            )}
          </div>
        <div className="mt-6 flex justify-center">
          <Button onClick={onCheckin} disabled={!subscriptionData} size="lg">
            Check In
          </Button>
        </div>
        </div>
      )}
      {checkinError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">{checkinError}</div>}
    </>
  );
};

export default SubscriberTab;
