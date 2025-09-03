"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ZoneControlTab from "@/components/admin/ZoneControlTab";
import CategoryRatesTab from "@/components/admin/CategoryRatesTab";
import RateUpdateDialog from "@/components/admin/RateUpdateDialog";
import RushHoursCard from "@/components/admin/RushHoursCard";
import VacationsCard from "@/components/admin/VacationsCard";

const ControlPanelPage = () => {
  const [isRatesOpen, setIsRatesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Control Panel</h1>
        <p className="text-gray-600">Manage zones, rates, and system settings</p>
      </div>
      <Tabs defaultValue="zones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="zones">Zone Control</TabsTrigger>
          <TabsTrigger value="rates">Category Rates</TabsTrigger>
          <TabsTrigger value="schedule">Rush Hours & Vacations</TabsTrigger>
        </TabsList>
        {/* Zone Control Tab */}
        <TabsContent value="zones">
          <ZoneControlTab />
        </TabsContent>
        {/* Category Rates Tab */}
        <TabsContent value="rates">
          <CategoryRatesTab
            onEditRates={(category) => {
              setSelectedCategory(category);
              setIsRatesOpen(true);
            }}
          />
        </TabsContent>
        {/* Schedule Rush Hours & Vacations*/}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RushHoursCard />
            <VacationsCard />
          </div>
        </TabsContent>
      </Tabs>
      {/* Update Category Rates Dialog */}
      <RateUpdateDialog isOpen={isRatesOpen} onOpenChange={setIsRatesOpen} selectedCategory={selectedCategory} />
    </div>
  );
};

export default ControlPanelPage;
