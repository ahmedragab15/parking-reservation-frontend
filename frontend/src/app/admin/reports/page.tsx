"use client";
import { useRef } from "react";
import useCustomQuery from "@/hooks/useCustomQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const ReportsPage = () => {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const cardRef = useRef(null);

  const { data: parkingState, isLoading } = useCustomQuery({
    queryKey: ["admin", "parking-state"],
    url: "/admin/reports/parking-state",
  });

  gsap.registerPlugin(useGSAP);
  useGSAP(
    () => {
      gsap.set([headerRef.current, cardRef.current], {
        opacity: 0,
        y: 30,
      });
      const tl = gsap.timeline();
      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      }).to(
        cardRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="space-y-6">
      <div ref={headerRef} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parking State Report</h1>
          <p className="text-gray-600">Real-time overview of all parking zones</p>
        </div>
      </div>
      <Card ref={cardRef}>
        <CardHeader>
          <CardTitle>Zone Details</CardTitle>
          <CardDescription>Comprehensive view of occupancy, availability, and subscriber information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading parking state...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Total Slots</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Free</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available for Visitors</TableHead>
                    <TableHead>Available for Subscribers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parkingState?.map((zone: Zone) => {
                    const occupancyPercentage = zone.totalSlots > 0 ? (zone.occupied / zone.totalSlots) * 100 : 0;
                    return (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>
                          <Badge variant={zone.open ? "default" : "secondary"}>{zone.open ? "Open" : "Closed"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={occupancyPercentage} className="w-20" />
                            <span className="text-xs text-gray-500">{occupancyPercentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{zone.totalSlots}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${occupancyPercentage > 90 ? "text-red-600" : occupancyPercentage > 70 ? "text-yellow-600" : "text-green-600"
                              }`}
                          >
                            {zone.occupied}
                          </span>
                        </TableCell>
                        <TableCell>{zone.free}</TableCell>
                        <TableCell>{zone.reserved}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${zone.availableForVisitors === 0 ? "text-red-600" : "text-green-600"}`}>
                            {zone.availableForVisitors}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${zone.availableForSubscribers === 0 ? "text-red-600" : "text-green-600"}`}>
                            {zone.availableForSubscribers}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
