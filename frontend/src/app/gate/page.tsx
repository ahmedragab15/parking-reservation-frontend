"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useCustomQuery from "@/hooks/useCustomQuery";
import { MapPin, Layers } from "lucide-react";
import GatesSkeleton from "@/components/gate/GatesCardsSkeleton";
import ErrorMessage from "@/components/shared/ErrorMessage";

export default function GatesPage() {
  const {
    isLoading,
    data: gates,
    isError,
  } = useCustomQuery({
    queryKey: ["gates"],
    url: "/master/gates",
  });

  if (isLoading) return <GatesSkeleton />;
  if (isError) return <ErrorMessage message="Failed to fetch gates" />;

  return (
    <div className="container mx-auto py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {gates?.map((gate: Gate) => (
        <Card key={gate.id} className="hover:shadow-lg transition-shadow duration-300 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Layers className="w-5 h-5 text-blue-500" />
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
                <Badge key={zoneId} variant="secondary">
                  {zoneId}
                </Badge>
              ))}
            </div>
            <Button asChild className="w-full mt-2">
              <Link href={`/gate/${gate.id}`}>View Details</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
