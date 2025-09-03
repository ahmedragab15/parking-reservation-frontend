"use client";
import { ReactNode, useEffect, useState, useRef } from "react";
import { useGateWebSocket } from "@/hooks/useGateWebSocket";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Wifi, WifiOff, Menu } from "lucide-react";
import axiosInstance from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import AdminDashboardSidebar from "@/components/admin/AdminDashboardSidebar";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface LayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: LayoutProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gateIds, setGateIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const desktopSidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const connectionIconRef = useRef<HTMLDivElement>(null);
  gsap.registerPlugin(useGSAP);

  useEffect(() => {
    (async () => {
      const res = await axiosInstance("/master/gates");
      setGateIds(res.data.map((g: Gate) => g.id));
    })();
  }, []);

  const { isConnected } = useGateWebSocket(gateIds);

  useGSAP(
    () => {
      if (containerRef.current) {
        const elements = [mobileHeaderRef.current, desktopSidebarRef.current, mainContentRef.current].filter(Boolean);
        gsap.fromTo(
          elements,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          }
        );
      }
    },
    { scope: containerRef }
  );
  useGSAP(
    () => {
      if (mobileSidebarRef.current) {
        if (sidebarOpen) {
          gsap.fromTo(
            mobileSidebarRef.current,
            {
              x: "-100%",
              opacity: 0,
            },
            {
              x: "0%",
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
            }
          );
          const backdrop = document.querySelector(".mobile-backdrop");
          if (backdrop) {
            gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
          }
        } else {
          gsap.to(mobileSidebarRef.current, {
            x: "-100%",
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          });
          const backdrop = document.querySelector(".mobile-backdrop");
          if (backdrop) {
            gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: "power2.in" });
          }
        }
      }
    },
    { dependencies: [sidebarOpen], scope: mobileSidebarRef }
  );
  const handleMenuClick = () => {
    const menuButton = document.querySelector("#menu-button");
    if (menuButton) {
      gsap.to(menuButton, {
        rotation: 90,
        scale: 0.9,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(menuButton, { rotation: 0 });
        },
      });
    }
    setSidebarOpen(true);
  };
  useGSAP(
    () => {
      if (mainContentRef.current && window.innerWidth >= 1024) {
        gsap.to(mainContentRef.current, {
          paddingLeft: sidebarOpen ? "16rem" : "2rem",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    },
    { dependencies: [sidebarOpen], scope: mainContentRef }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const menuButton = document.getElementById("menu-button");
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) && menuButton && !menuButton.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div ref={mobileHeaderRef} className="lg:hidden sticky top-21 left-0 right-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button id="menu-button" variant="ghost" size="sm" onClick={handleMenuClick} className="p-2 menu-button">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div ref={connectionIconRef} className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="mobile-backdrop lg:hidden fixed inset-0 z-40 bg-black/30 bg-opacity-50 transition-opacity" />}
      {/* Mobile sidebar */}
      <div
        ref={mobileSidebarRef}
        id="mobile-sidebar"
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg"
        style={{ transform: "translateX(-100%)" }}
      >
        <AdminDashboardSidebar isMobile={true} user={user} isConnected={isConnected} setSidebarOpen={setSidebarOpen} />
      </div>
      {/* Desktop sidebar */}
      <div ref={desktopSidebarRef} className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
        <AdminDashboardSidebar user={user} isConnected={isConnected} setSidebarOpen={setSidebarOpen} />
      </div>
      {/* Main content */}
      <div className="lg:pl-64">
        <main ref={mainContentRef} className="p-4 md:p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
