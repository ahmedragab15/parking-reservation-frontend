import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock } from "lucide-react";

interface IProps {
    checkoutResult: CheckoutResponse;
    formatDateTime: (isoString: string) => string;
    formatCurrency: (amount: number) => string;
    user: User | null;
    contentRef: React.RefObject<HTMLDivElement | null>;
    handlePrint: () => void;
}

const CheckoutResult = ({ checkoutResult, formatDateTime, formatCurrency, user, contentRef, handlePrint }: IProps) => {
    const getRateModeColor = (mode: string) => (mode === "special" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800");
    return (
        <Card className="border-green-200 bg-green-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Checkout Complete
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" ref={contentRef}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                    <div className="text-center">
                        <Label className="text-sm text-gray-500">Duration</Label>
                        <p className="text-lg font-semibold flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4" />
                            {checkoutResult.durationHours.toFixed(2)} hrs
                        </p>
                    </div>
                    <div className="text-center">
                        <Label className="text-sm text-gray-500">Total Amount</Label>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(checkoutResult.amount)}</p>
                    </div>
                    <div className="text-center">
                        <Label className="text-sm text-gray-500">Checkout Time</Label>
                        <p className="text-sm">{formatDateTime(checkoutResult.checkoutAt)}</p>
                    </div>
                </div>
                <Separator />
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Billing Breakdown</Label>
                    <div className="space-y-2">
                        {checkoutResult.breakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                                <div className="flex items-center gap-3">
                                    <Badge className={getRateModeColor(item.rateMode)}>{item.rateMode}</Badge>
                                    <div className="text-sm">
                                        <p className="font-medium">{item.hours} hours</p>
                                        <p className="text-gray-500">
                                            {formatDateTime(item.from)} - {formatDateTime(item.to)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                                    <p className="text-sm text-gray-500">{formatCurrency(item.rate)}/hr</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Receipt Details</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-gray-500">Ticket ID:</span>
                            <span className="ml-2 font-mono">{checkoutResult.ticketId}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Check-in:</span>
                            <span className="ml-2">{formatDateTime(checkoutResult.checkinAt)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Check-out:</span>
                            <span className="ml-2">{formatDateTime(checkoutResult.checkoutAt)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Processed by:</span>
                            <span className="ml-2">{user?.username}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="text-center text-sm text-gray-500 space-y-2">
                <Button onClick={handlePrint}>Print Billing</Button>
                <p>Scan the next ticket or use the lookup field above</p>
            </div>
        </Card>
    );
};

export default CheckoutResult;
