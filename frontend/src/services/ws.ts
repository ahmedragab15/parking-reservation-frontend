/* eslint-disable @typescript-eslint/no-explicit-any */
export class GateWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private gateId: string;
  private onZoneUpdate: (zone: Zone) => void;
  private onAdminUpdate: (data: any) => void;
  private onConnectionChange: (connected: boolean) => void;

  constructor(
    gateId: string,
    onZoneUpdate: (zone: Zone) => void,
    onAdminUpdate: (data: any) => void,
    onConnectionChange: (connected: boolean) => void
  ) {
    this.gateId = gateId;
    this.onZoneUpdate = onZoneUpdate;
    this.onAdminUpdate = onAdminUpdate;
    this.onConnectionChange = onConnectionChange;
    this.connect();
  }

  connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        this.subscribeToGate();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        this.onConnectionChange(false);
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.onConnectionChange(false);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.handleReconnect();
    }
  }

  private subscribeToGate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          payload: { gateId: this.gateId },
        })
      );
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "zone-update":
        this.onZoneUpdate(data.payload);
        break;
      case "admin-update":
        this.onAdminUpdate(data.payload);
        break;
      default:
        console.log("Unknown message type:", data.type);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
