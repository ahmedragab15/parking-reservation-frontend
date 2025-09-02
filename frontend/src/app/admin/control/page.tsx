"use client";
import { useState } from "react";
import useCustomQuery from "@/hooks/useCustomQuery";
import useCustomMutation from "@/hooks/useCustomMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Settings, DollarSign, Clock, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/config/axios.config";
import { weekDays } from "@/constants";

const ControlPanelPage = () => {
  // State for dialogs
  const [isRatesOpen, setIsRatesOpen] = useState(false);
  const [isRushOpen, setIsRushOpen] = useState(false);
  const [isVacationOpen, setIsVacationOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // update
  const [zoneToUpdate, setZoneToUpdate] = useState("");
  const [categoryToUpdate, setCategoryToUpdate] = useState("");

  // Form states
  const [rateForm, setRateForm] = useState({ rateNormal: 0, rateSpecial: 0 });
  const [rushForm, setRushForm] = useState({ weekDay: 1, from: "", to: "" });
  const [vacationForm, setVacationForm] = useState({ name: "", from: "", to: "" });

  // Queries
  const { data: zones, refetch: refetchZones } = useCustomQuery({
    queryKey: ["admin", "zones"],
    url: "/master/zones",
  });

  const { data: categories, refetch: refetchCategories } = useCustomQuery({
    queryKey: ["admin", "categories"],
    url: "/master/categories",
  });

  // Mutations
  const toggleZoneMutation = useCustomMutation({
    url: `/admin/zones/${zoneToUpdate}/open`,
    method: "PUT",
  });

  const updateRatesMutation = useCustomMutation({
    url: `/admin/categories/${categoryToUpdate}`,
    method: "PUT",
  });

  const addRushMutation = useCustomMutation({
    url: "/admin/rush-hours",
    method: "POST",
  });

  const addVacationMutation = useCustomMutation({
    url: "/admin/vacations",
    method: "POST",
  });

  const handleToggleZone = async (zoneId: string, currentOpen: boolean) => {
    try {
      toggleZoneMutation.mutate(
        { open: !currentOpen },
        {
          onSuccess: () => {
            toast.success(`Zone ${currentOpen ? "closed" : "opened"} successfully`);
            refetchZones();
          },
          onError: () => {
            toast.error("Failed to update zone status");
          },
        }
      );
      toggleZoneMutation.mutateAsync = async (data: { open: boolean }) => {
        const response = await axiosInstance.put(`/admin/zones/${zoneId}/open`, !data.open);
        return response.data;
      };
    } catch {
      toast.error("Failed to update zone status");
    }
  };

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      await updateRatesMutation.mutateAsync(rateForm);
      toast.success("Rates updated successfully");
      setIsRatesOpen(false);
      refetchCategories();
    } catch {
      toast.error("Failed to update rates");
    }
  };

  const handleAddRush = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRushMutation.mutateAsync(rushForm);
      toast.success("Rush hour added successfully");
      setIsRushOpen(false);
      setRushForm({ weekDay: 1, from: "", to: "" });
    } catch {
      toast.error("Failed to add rush hour");
    }
  };

  const handleAddVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVacationMutation.mutateAsync(vacationForm);
      toast.success("Vacation period added successfully");
      setIsVacationOpen(false);
      setVacationForm({ name: "", from: "", to: "" });
    } catch {
      toast.error("Failed to add vacation period");
    }
  };

  const openRatesDialog = (category: Category) => {
    setSelectedCategory(category);
    setRateForm({
      rateNormal: category.rateNormal,
      rateSpecial: category.rateSpecial,
    });
    setIsRatesOpen(true);
  };

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Zone Management
              </CardTitle>
              <CardDescription>Open or close parking zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones?.map((zone: Zone) => (
                  <Card key={zone.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{zone.name}</h3>
                        <Badge variant={zone.open ? "default" : "secondary"}>{zone.open ? "Open" : "Closed"}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>Total Slots: {zone.totalSlots}</p>
                        <p>Occupied: {zone.occupied}</p>
                        <p>Available for Visitors: {zone.availableForVisitors}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`zone-${zone.id}`} className="text-sm">
                          Zone Status
                        </Label>
                        <Switch
                          id={`zone-${zone.id}`}
                          checked={zone.open}
                          onCheckedChange={() => {
                            handleToggleZone(zone.id, zone.open);
                            setZoneToUpdate(zone.id);
                          }}
                          disabled={toggleZoneMutation.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Category Rates Tab */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Category Rates
              </CardTitle>
              <CardDescription>Manage pricing for different parking categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Normal Rate ($/hour)</TableHead>
                    <TableHead>Special Rate ($/hour)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>${category.rateNormal.toFixed(2)}</TableCell>
                      <TableCell>${category.rateSpecial.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            openRatesDialog(category);
                            setCategoryToUpdate(category.id);
                          }}
                        >
                          Edit Rates
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Rush Hours & Vacations Schedule Tab */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    <CardTitle>Rush Hours</CardTitle>
                  </div>
                  <Dialog open={isRushOpen} onOpenChange={setIsRushOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Rush Hour
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Rush Hour</DialogTitle>
                        <DialogDescription>Define a rush hour period with special pricing</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddRush} className="space-y-4">
                        <div>
                          <Label>Day of Week</Label>
                          <Select
                            value={rushForm.weekDay.toString()}
                            onValueChange={(value) => setRushForm((prev) => ({ ...prev, weekDay: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {weekDays.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>From</Label>
                            <Input
                              type="time"
                              value={rushForm.from}
                              onChange={(e) => setRushForm((prev) => ({ ...prev, from: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label>To</Label>
                            <Input
                              type="time"
                              value={rushForm.to}
                              onChange={(e) => setRushForm((prev) => ({ ...prev, to: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsRushOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addRushMutation.isPending}>
                            Add Rush Hour
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {/* Vacations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    <CardTitle>Vacation Periods</CardTitle>
                  </div>
                  <Dialog open={isVacationOpen} onOpenChange={setIsVacationOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vacation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Vacation Period</DialogTitle>
                        <DialogDescription>Define a vacation period with special pricing</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddVacation} className="space-y-4">
                        <div>
                          <Label>Vacation Name</Label>
                          <Input
                            placeholder="e.g., Summer Break"
                            value={vacationForm.name}
                            onChange={(e) => setVacationForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>From Date</Label>
                            <Input
                              type="date"
                              value={vacationForm.from}
                              onChange={(e) => setVacationForm((prev) => ({ ...prev, from: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label>To Date</Label>
                            <Input
                              type="date"
                              value={vacationForm.to}
                              onChange={(e) => setVacationForm((prev) => ({ ...prev, to: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsVacationOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addVacationMutation.isPending}>
                            Add Vacation
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* Rate Update Dialog */}
      <Dialog open={isRatesOpen} onOpenChange={setIsRatesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category Rates</DialogTitle>
            <DialogDescription>Modify pricing for {selectedCategory?.name} category</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRates} className="space-y-4">
            <div>
              <Label>Normal Rate ($/hour)</Label>
              <Input
                type="number"
                step="0.01"
                value={rateForm.rateNormal}
                onChange={(e) => setRateForm((prev) => ({ ...prev, rateNormal: parseFloat(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label>Special Rate ($/hour)</Label>
              <Input
                type="number"
                step="0.01"
                value={rateForm.rateSpecial}
                onChange={(e) => setRateForm((prev) => ({ ...prev, rateSpecial: parseFloat(e.target.value) }))}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsRatesOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRatesMutation.isPending}>
                Update Rates
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ControlPanelPage;
