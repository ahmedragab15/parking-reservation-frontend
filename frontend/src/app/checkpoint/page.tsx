"use client";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import axiosInstance from "@/config/axios.config";
import useCustomQuery from "@/hooks/useCustomQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Car, Clock, DollarSign, Scan } from "lucide-react";
import { RootState } from "@/store/store";
import { AxiosError } from "axios";
import { useReactToPrint } from "react-to-print";
import { Input } from "@/components/ui/input";

const CheckpointPage = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [plateMismatch, setPlateMismatch] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVehicleVerification, setShowVehicleVerification] = useState(true);

  const { refetch: refetchTicket, isLoading: ticketLoading } = useCustomQuery({
    queryKey: ["ticket", ticketId],
    url: `/tickets/${ticketId}`,
    config: { enabled: false },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (params: { ticketId: string; forceConvertToVisitor?: boolean }) => {
      const response = await axiosInstance.post("/tickets/checkout", params);
      return response.data;
    },
    onSuccess: (data) => {
      setCheckoutResult(data);
      setSuccess("Ticket checked out successfully!");
      setError("");

      setTicketId("");
      setTicket(null);
      setSubscription(null);
      setPlateMismatch(false);

      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["parking-state"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setError(error.response?.data?.message || "Checkout failed");
      setSuccess("");
    },
  });

  const handleTicketLookup = async () => {
    if (!ticketId.trim()) {
      setError("Please enter a ticket ID");
      return;
    }

    setError("");
    setSuccess("");
    setTicket(null);
    setSubscription(null);
    setCheckoutResult(null);
    setPlateMismatch(false);
    try {
      const result = await refetchTicket();
      if (result.data) {
        setTicket(result.data);
        if (result.data.type === "subscriber" && result.data.subscriptionId) {
          try {
            const subRes = await axiosInstance.get(`/subscriptions/${result.data.subscriptionId}`);
            setSubscription(subRes.data);
          } catch (subError) {
            console.error("Error fetching subscription:", subError);
            setError("Could not fetch subscription information");
          }
        }
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Ticket lookup error:", err);
      setError(error.response?.data?.message || "Ticket not found");
    }
  };

  const handleCheckout = (forceConvertToVisitor = false) => {
    if (!ticket) return;
    checkoutMutation.mutate({
      ticketId: ticket.id,
      forceConvertToVisitor,
    });
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef });

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const getRateModeColor = (mode: string) => (mode === "special" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Ticket Scanner */}
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
                <AlertTriangle className="h-4 w-4 text-red-600" /> <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" /> <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        {/* Ticket Information */}
        {ticket && (
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
        )}
        {/* Subscription Information & Car Verification */}
        {ticket?.type === "subscriber" && (
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
                  {/* showVehicleVerification */}
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
                      // Manual trigger for demo - try to load subscription for known subscriber tickets
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
        )}
        {/* Checkout Actions */}
        {ticket && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Checkout Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => handleCheckout(plateMismatch)} disabled={checkoutMutation.isPending} className="flex-1">
                  {checkoutMutation.isPending ? "Processing..." : "Process Checkout"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTicket(null);
                    setSubscription(null);
                    setTicketId("");
                    setError("");
                    setSuccess("");
                    setPlateMismatch(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Checkout Result */}
        {checkoutResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Checkout Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" ref={contentRef}>
              {/* Summary */}
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
              {/* Billing Breakdown */}
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
              {/* Receipt Information */}
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
        )}
        {/* Quick Actions */}
      </div>
    </div>
  );
};

export default CheckpointPage;