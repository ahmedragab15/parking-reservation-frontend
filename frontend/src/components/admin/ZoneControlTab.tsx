import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import useCustomQuery from "@/hooks/useCustomQuery";
import useCustomMutation from "@/hooks/useCustomMutation";
import { toast } from "sonner";
import { useState } from "react";

const ZoneControlTab = () => {
    const [zoneToUpdate, setZoneToUpdate] = useState("");

    const { data: zones, refetch: refetchZones } = useCustomQuery({
        queryKey: ["admin", "zones"],
        url: "/master/zones",
    });

    const toggleZoneMutation = useCustomMutation({
        url: `/admin/zones/${zoneToUpdate}/open`,
        method: "PUT",
    });

    const handleToggleZone = async (zoneId: string, currentOpen: boolean) => {
        setZoneToUpdate(zoneId);
        try {
            await toggleZoneMutation.mutateAsync({ open: !currentOpen });
            toast.success(`Zone ${currentOpen ? "closed" : "opened"} successfully`);
            refetchZones();
        } catch {
            toast.error("Failed to update zone status");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Zone Management
                </CardTitle>
                <CardDescription>Open or close parking zones</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zones?.map((zone: Zone) => (
                        <Card key={zone.id} className="border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">{zone.name}</h3>
                                    <Badge variant={zone.open ? "default" : "secondary"}>{zone.open ? "Open" : "Closed"}</Badge>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <p>Total Slots: {zone.totalSlots}</p>
                                    <p>Occupied: {zone.occupied}</p>
                                    <p>Available for Visitors: {zone.availableForVisitors}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`zone-${zone.id}`} className="text-sm">
                                        Zone Status
                                    </Label>
                                    <Switch
                                        id={`zone-${zone.id}`}
                                        checked={zone.open}
                                        onCheckedChange={() => handleToggleZone(zone.id, zone.open)}
                                        disabled={toggleZoneMutation.isPending}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ZoneControlTab;
