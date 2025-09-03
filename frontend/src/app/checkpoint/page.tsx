"use client";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import axiosInstance from "@/config/axios.config";
import useCustomQuery from "@/hooks/useCustomQuery";
import { RootState } from "@/store/store";
import { AxiosError } from "axios";
import { useReactToPrint } from "react-to-print";
import TicketScanner from "@/components/checkpoint/TicketScanner";
import TicketInfo from "@/components/checkpoint/TicketInfo";
import SubscriptionVerification from "@/components/checkpoint/SubscriptionVerification";
import CheckoutActions from "@/components/checkpoint/CheckoutActions";
import CheckoutResult from "@/components/checkpoint/CheckoutResult";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

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

  const containerRef = useRef<HTMLDivElement>(null);
  const ticketInfoRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { refetch: refetchTicket, isLoading: ticketLoading } = useCustomQuery({
    queryKey: ["ticket", ticketId],
    url: `/tickets/${ticketId}`,
    config: { enabled: false },
  });

  gsap.registerPlugin(useGSAP);
  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current?.children || [],
        {
          opacity: 0,
          y: 30,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      if (ticket) {
        gsap.fromTo(
          ticketInfoRef.current,
          {
            opacity: 0,
            y: 20,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
          }
        );
      }
    },
    { dependencies: [ticket], scope: ticketInfoRef }
  );

  useGSAP(
    () => {
      if (ticket?.type === "subscriber") {
        gsap.fromTo(
          subscriptionRef.current,
          {
            opacity: 0,
            y: 20,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            delay: 0.2,
            ease: "power2.out",
          }
        );
      }
    },
    { dependencies: [ticket?.type], scope: subscriptionRef }
  );

  useGSAP(
    () => {
      if (ticket) {
        gsap.fromTo(
          actionsRef.current,
          {
            opacity: 0,
            y: 20,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            delay: 0.3,
            ease: "power2.out",
          }
        );
      }
    },
    { dependencies: [ticket], scope: actionsRef }
  );

  useGSAP(
    () => {
      if (checkoutResult && resultRef.current) {
        gsap.fromTo(
          resultRef.current,
          {
            opacity: 0,
            y: 30,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
          }
        );
        gsap.to(resultRef.current, {
          scale: 1.02,
          duration: 0.3,
          delay: 0.6,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        });
      }
    },
    { dependencies: [checkoutResult], scope: resultRef }
  );

  const animateOut = (elements: HTMLElement[], callback: () => void) => {
    gsap.to(elements, {
      opacity: 0,
      y: -20,
      scale: 0.98,
      duration: 0.3,
      stagger: 0.05,
      ease: "power2.in",
      onComplete: callback,
    });
  };

  const checkoutMutation = useMutation({
    mutationFn: async (params: { ticketId: string; forceConvertToVisitor?: boolean }) => {
      const response = await axiosInstance.post("/tickets/checkout", params);
      return response.data;
    },
    onSuccess: (data) => {
      setCheckoutResult(data);
      setSuccess("Ticket checked out successfully!");
      setError("");

      const elementsToHide = [ticketInfoRef.current, subscriptionRef.current, actionsRef.current].filter(Boolean);

      if (elementsToHide.length > 0) {
        animateOut(elementsToHide as HTMLElement[], () => {
          setTicketId("");
          setTicket(null);
          setSubscription(null);
          setPlateMismatch(false);
        });
      } else {
        setTicketId("");
        setTicket(null);
        setSubscription(null);
        setPlateMismatch(false);
      }

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

    gsap.to(".scanner-container", {
      scale: 0.98,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div ref={containerRef} className="grid gap-6 max-w-4xl mx-auto">
        <div className="scanner-container">
          <TicketScanner
            ticketId={ticketId}
            setTicketId={setTicketId}
            handleTicketLookup={handleTicketLookup}
            ticketLoading={ticketLoading}
            error={error}
            success={success}
          />
        </div>
        {ticket && (
          <div ref={ticketInfoRef}>
            <TicketInfo ticket={ticket} formatDateTime={formatDateTime} />
          </div>
        )}
        {ticket?.type === "subscriber" && (
          <div ref={subscriptionRef}>
            <SubscriptionVerification
              ticketId={ticketId}
              subscription={subscription}
              showVehicleVerification={showVehicleVerification}
              setShowVehicleVerification={setShowVehicleVerification}
              plateMismatch={plateMismatch}
              setPlateMismatch={setPlateMismatch}
              setSubscription={setSubscription}
            />
          </div>
        )}
        {ticket && (
          <div ref={actionsRef}>
            <CheckoutActions
              handleCheckout={handleCheckout}
              plateMismatch={plateMismatch}
              checkoutMutation={checkoutMutation}
              setTicket={setTicket}
              setSubscription={setSubscription}
              setTicketId={setTicketId}
              setError={setError}
              setSuccess={setSuccess}
              setPlateMismatch={setPlateMismatch}
            />
          </div>
        )}
        {checkoutResult && (
          <div ref={resultRef}>
            <CheckoutResult
              checkoutResult={checkoutResult}
              formatDateTime={formatDateTime}
              formatCurrency={formatCurrency}
              user={user}
              contentRef={contentRef}
              handlePrint={handlePrint}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckpointPage;
