/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface IProps {
    handleCheckout: (forceConvertToVisitor: boolean) => void;
    plateMismatch: boolean;
    checkoutMutation: UseMutationResult<any, unknown, { ticketId: string; forceConvertToVisitor?: boolean }, unknown>;
    setTicket: (ticket: Ticket | null) => void;
    setSubscription: (subscription: Subscription | null) => void;
    setTicketId: (id: string) => void;
    setError: (error: string) => void;
    setSuccess: (success: string) => void;
    setPlateMismatch: (mismatch: boolean) => void;
}

const CheckoutActions = ({
    handleCheckout,
    plateMismatch,
    checkoutMutation,
    setTicket,
    setSubscription,
    setTicketId,
    setError,
    setSuccess,
    setPlateMismatch,
}: IProps) => {
    return (
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
    );
};

export default CheckoutActions;
