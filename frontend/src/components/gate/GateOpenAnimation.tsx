import { useEffect } from "react";

interface GateOpenAnimationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GateOpenAnimation({ isOpen, onClose }: GateOpenAnimationProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🚗</div>
        <div className="text-4xl font-bold mb-2">Gate Opening</div>
        <div className="text-2xl">Please proceed</div>
        <div className="mt-8">
          <div className="w-64 h-32 mx-auto border-4 border-white relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
