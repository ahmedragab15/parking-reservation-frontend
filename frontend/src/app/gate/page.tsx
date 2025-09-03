"use client";
import { useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useCustomQuery from "@/hooks/useCustomQuery";
import { MapPin, Layers } from "lucide-react";
import GatesSkeleton from "@/components/gate/GatesCardsSkeleton";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function GatesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  gsap.registerPlugin(useGSAP);

  const {
    isLoading,
    data: gates,
    isError,
  } = useCustomQuery({
    queryKey: ["gates"],
    url: "/master/gates",
  });

  useGSAP(
    () => {
      if (gates && containerRef.current) {
        const cards = containerRef.current.querySelectorAll(".gate-card");
        gsap.set(cards, {
          opacity: 0,
          y: 50,
          scale: 0.95,
          rotationX: -15,
        });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 0.6,
          stagger: {
            amount: 0.8,
            grid: "auto",
            from: "start",
          },
          ease: "back.out(1.7)",
        });
      }
    },
    { dependencies: [gates], scope: containerRef }
  );

  useGSAP(
    () => {
      if (gates && containerRef.current) {
        const cards = containerRef.current.querySelectorAll(".gate-card");
        cards.forEach((card) => {
          const cardElement = card as HTMLElement;
          cardElement.addEventListener("mouseenter", () => {
            gsap.to(cardElement, {
              y: -8,
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
            });
            const icon = cardElement.querySelector(".gate-icon");
            if (icon) {
              gsap.to(icon, {
                rotation: 360,
                duration: 0.6,
                ease: "power2.out",
              });
            }
            const badges = cardElement.querySelectorAll(".zone-badge");
            gsap.to(badges, {
              scale: 1.1,
              duration: 0.2,
              stagger: 0.05,
              ease: "power2.out",
            });
          });
          cardElement.addEventListener("mouseleave", () => {
            gsap.to(cardElement, {
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: "power2.out",
            });
            const badges = cardElement.querySelectorAll(".zone-badge");
            gsap.to(badges, {
              scale: 1,
              duration: 0.2,
              stagger: 0.05,
              ease: "power2.out",
            });
          });
          cardElement.addEventListener("mousedown", () => {
            gsap.to(cardElement, {
              scale: 0.98,
              duration: 0.1,
              ease: "power2.out",
            });
          });
          cardElement.addEventListener("mouseup", () => {
            gsap.to(cardElement, {
              scale: 1.02,
              duration: 0.1,
              ease: "power2.out",
            });
          });
        });
      }
    },
    { dependencies: [gates], scope: containerRef }
  );

  if (isLoading) return <GatesSkeleton />;
  if (isError) return <ErrorMessage message="Failed to fetch gates" />;

  return (
    <div ref={containerRef} className="container mx-auto py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {gates?.map((gate: Gate) => (
        <Card key={gate.id} className="gate-card hover:shadow-xl transition-shadow duration-300 rounded-2xl cursor-pointer overflow-hidden">
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Layers className="gate-icon w-5 h-5 text-blue-500" />
              {gate.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4" />
              {gate.location}
            </div>
            <div className="flex flex-wrap gap-2">
              {gate.zoneIds.map((zoneId) => (
                <Badge key={zoneId} variant="secondary" className="zone-badge">
                  {zoneId}
                </Badge>
              ))}
            </div>
            <Button asChild className="w-full mt-2 button-hover">
              <Link href={`/gate/${gate.id}`}>View Details</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
