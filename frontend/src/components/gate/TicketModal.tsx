import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export default function TicketModal({ isOpen, onClose, ticket }: TicketModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef });

  if (!ticket) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in Successful</DialogTitle>
        </DialogHeader>
        <div className="p-4 border rounded-md space-y-3" ref={contentRef}>
          <div className="flex justify-between">
            <span className="font-semibold">Ticket ID:</span>
            <span>{ticket.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Check-in Time:</span>
            <span>{new Date(ticket.checkinAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Zone:</span>
            <span>{ticket.zoneId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Gate:</span>
            <span>{ticket.gateId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Type:</span>
            <span className="capitalize">{ticket.type}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>Print Ticket</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
