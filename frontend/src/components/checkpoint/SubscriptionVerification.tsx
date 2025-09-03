import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import axiosInstance from "@/config/axios.config";

interface IProps {
    ticketId: string;
    subscription: Subscription | null;
    showVehicleVerification: boolean;
    setShowVehicleVerification: (show: boolean) => void;
    plateMismatch: boolean;
    setPlateMismatch: (mismatch: boolean) => void;
    setSubscription: (subscription: Subscription | null) => void;
}

const SubscriptionVerification = ({
    ticketId,
    subscription,
    showVehicleVerification,
    setShowVehicleVerification,
    plateMismatch,
    setPlateMismatch,
    setSubscription,
}: IProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Verification</CardTitle>
                <CardDescription>
                    {subscription ? `Verify the vehicle matches registered cars for ${subscription.userName}` : "Loading subscription details..."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {subscription ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Subscriber</Label>
                                <p className="font-semibold">{subscription.userName}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Category</Label>
                                <Badge>{subscription.category.replace("cat_", "").toUpperCase()}</Badge>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500 mb-2 block">Registered Vehicles</Label>
                            <div className="grid gap-2">
                                {subscription.cars.map((car, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: car.color }}></div>
                                            <div>
                                                <p className="font-mono font-semibold">{car.plate}</p>
                                                <p className="text-sm text-gray-600">
                                                    {car.brand} {car.model}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{car.color}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {showVehicleVerification && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <Label className="text-sm font-medium text-yellow-800 mb-2 block">Vehicle Verification Required</Label>
                                <p className="text-sm text-yellow-700 mb-3">Does the vehicle at the checkpoint match one of the registered cars above?</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPlateMismatch(true)}
                                        className={`text-red-600 border-red-200 hover:bg-red-50 ${plateMismatch ? "bg-red-100" : ""}`}
                                    >
                                        No Match - Convert to Visitor
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setPlateMismatch(false);
                                            setShowVehicleVerification(false);
                                        }}
                                        className={`${!plateMismatch ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}`}
                                    >
                                        ✓ Vehicle Matches
                                    </Button>
                                </div>
                            </div>
                        )}
                        {plateMismatch && (
                            <Alert className="border-orange-200 bg-orange-50">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-orange-800">
                                    This checkout will be processed as a <strong>visitor</strong> and charged accordingly.
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                                if (ticketId === "t_010") {
                                    axiosInstance.get("/subscriptions/sub_002").then((res) => setSubscription(res.data));
                                } else if (ticketId === "t_015") {
                                    axiosInstance.get("/subscriptions/sub_004").then((res) => setSubscription(res.data));
                                }
                            }}
                        >
                            Load Subscription Details
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SubscriptionVerification;
