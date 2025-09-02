"use client";
import { useEffect, useState } from "react";
import { GateWebSocket } from "@/services/ws";

export function useGateWebSocket(gateIds: string[] = []) {
  const [isConnected, setIsConnected] = useState(false);
  const [adminUpdates, setAdminUpdates] = useState<unknown[]>([]);

  useEffect(() => {
    if (!gateIds.length) return;

    const sockets = gateIds.map(
      (id) =>
        new GateWebSocket(
          id,
          () => {}, 
          (update) => setAdminUpdates((prev) => [update, ...prev]), 
          (connected) => setIsConnected(connected) 
        )
    );

    return () => {
      sockets.forEach((s) => s.disconnect());
    };
  }, [gateIds]);

  return { isConnected, adminUpdates };
}
