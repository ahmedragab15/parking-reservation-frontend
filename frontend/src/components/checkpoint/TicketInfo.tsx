import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

interface TicketInfoProps {
    ticket: Ticket;
    formatDateTime: (isoString: string) => string;
}

const TicketInfo = ({ ticket, formatDateTime }: TicketInfoProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Ticket Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Ticket ID</Label>
                        <p className="font-mono">{ticket.id}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Type</Label>
                        <Badge variant={ticket.type === "subscriber" ? "default" : "secondary"}>{ticket.type}</Badge>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Zone</Label>
                        <p>{ticket.zoneId}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Check-in</Label>
                        <p className="text-sm">{formatDateTime(ticket.checkinAt)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TicketInfo;
