import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Scan } from "lucide-react";

interface TicketScannerProps {
    ticketId: string;
    setTicketId: (id: string) => void;
    handleTicketLookup: () => void;
    ticketLoading: boolean;
    error: string;
    success: string;
}

const TicketScanner = ({ ticketId, setTicketId, handleTicketLookup, ticketLoading, error, success }: TicketScannerProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" /> Scan Ticket
                </CardTitle>
                <CardDescription>Enter or paste the ticket ID to begin checkout process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Enter ticket ID"
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTicketLookup()}
                        />
                    </div>
                    <Button onClick={handleTicketLookup} disabled={!ticketId.trim() || ticketLoading}>
                        {ticketLoading ? "Looking up..." : "Lookup"}
                    </Button>
                </div>
                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default TicketScanner;
