import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

function ZoneCard({ zone, isSelected, onSelect, disabled }: { zone: Zone; isSelected: boolean; onSelect: () => void; disabled: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "border-primary ring-2 ring-primary" : ""} ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
      }`}
      onClick={disabled ? undefined : onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{zone.name}</CardTitle>
          <div className="flex gap-1">
            {zone.open && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Special Rate
              </Badge>
            )}
            {!zone.open && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Closed
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Category: {zone.categoryId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Occupied: {zone.occupied}</div>
          <div>Free: {zone.free}</div>
          <div>Available (Visitors): {zone.availableForVisitors}</div>
          <div>Available (Subscribers): {zone.availableForSubscribers}</div>
          <div className="col-span-2">Rate: ${zone.open ? zone.rateSpecial : zone.rateNormal}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ZoneCard;
