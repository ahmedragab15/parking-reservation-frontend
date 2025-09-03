import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ZoneCard from "@/components/gate/ZoneCard";

interface IProps {
  zones: Zone[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedZone: string | null;
  onSelectZone: (zoneId: string) => void;
  isZoneAvailable: (zone: Zone) => boolean;
  onCheckin: () => void;
  checkinError: string | null;
}

const VisitorTab = ({ zones, isLoading, error, selectedZone, onSelectZone, isZoneAvailable, onCheckin, checkinError }: IProps) => {
  return (
    <>
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
              onSelect={() => onSelectZone(zone.id)}
              disabled={!isZoneAvailable(zone)}
              showSelection={true}
            />
          ))
        ) : (
          <div className="col-span-full text-center">No zones available for this gate</div>
        )}
      </div>
      <div className="mt-6 flex justify-center">
        <Button onClick={onCheckin} disabled={!selectedZone} size="lg">
          Check In
        </Button>
      </div>
      {checkinError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">{checkinError}</div>}
    </>
  );
};

export default VisitorTab;
