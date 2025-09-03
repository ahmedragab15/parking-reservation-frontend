"use client";
import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ZoneControlTab from "@/components/admin/ZoneControlTab";
import CategoryRatesTab from "@/components/admin/CategoryRatesTab";
import RateUpdateDialog from "@/components/admin/RateUpdateDialog";
import RushHoursCard from "@/components/admin/RushHoursCard";
import VacationsCard from "@/components/admin/VacationsCard";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const ControlPanelPage = () => {
  const [isRatesOpen, setIsRatesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState("zones");

  const headerRef = useRef(null);
  const tabsListRef = useRef(null);
  const tabsContentRef = useRef(null);

  gsap.registerPlugin(useGSAP);
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" })
      .fromTo(tabsListRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4")
      .fromTo(tabsContentRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, "-=0.3");
  });

  const handleTabChange = (value: string) => {
    if (value !== activeTab) {
      gsap.to(tabsContentRef.current, {
        opacity: 0,
        y: -15,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setActiveTab(value);
          gsap.fromTo(tabsContentRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        },
      });
    }
  };

  useGSAP(() => {
    if (activeTab === "schedule") {
      gsap.fromTo(
        ".schedule-card",
        { scale: 0.9, opacity: 0, y: 20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "back.out(1.7)",
          delay: 0.1,
        }
      );
    }
  });

  return (
    <div className="space-y-6">
      <div ref={headerRef}>
        <h1 className="text-3xl font-bold">Control Panel</h1>
        <p className="text-gray-600">Manage zones, rates, and system settings</p>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div ref={tabsListRef}>
          <TabsList className="hover:shadow-md transition-shadow duration-300">
            <TabsTrigger value="zones" className="transition-all duration-200 hover:scale-105">
              Zone Control
            </TabsTrigger>
            <TabsTrigger value="rates" className="transition-all duration-200 hover:scale-105">
              Category Rates
            </TabsTrigger>
            <TabsTrigger value="schedule" className="transition-all duration-200 hover:scale-105">
              Rush Hours & Vacations
            </TabsTrigger>
          </TabsList>
        </div>
        <div ref={tabsContentRef}>
          {/* Zone Control Tab */}
          <TabsContent value="zones" className="space-y-4">
            <div className="animate-fade-in">
              <ZoneControlTab />
            </div>
          </TabsContent>
          {/* Category Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <div className="animate-fade-in">
              <CategoryRatesTab
                onEditRates={(category) => {
                  setSelectedCategory(category);
                  setIsRatesOpen(true);
                }}
              />
            </div>
          </TabsContent>
          {/* Schedule Rush Hours & Vacations */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="schedule-card">
                <RushHoursCard />
              </div>
              <div className="schedule-card">
                <VacationsCard />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      {/* Update Category Rates Dialog */}
      <RateUpdateDialog isOpen={isRatesOpen} onOpenChange={setIsRatesOpen} selectedCategory={selectedCategory} />
    </div>
  );
};

export default ControlPanelPage;
