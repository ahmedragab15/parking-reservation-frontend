import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus } from "lucide-react";
import { useState } from "react";
import useCustomMutation from "@/hooks/useCustomMutation";
import { toast } from "sonner";
import { weekDays } from "@/constants";

const RushHoursCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rushForm, setRushForm] = useState({ weekDay: 1, from: "", to: "" });

    const addRushMutation = useCustomMutation({
        url: "/admin/rush-hours",
        method: "POST",
    });

    const handleAddRush = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addRushMutation.mutateAsync(rushForm);
            toast.success("Rush hour added successfully");
            setIsOpen(false);
            setRushForm({ weekDay: 1, from: "", to: "" });
        } catch {
            toast.error("Failed to add rush hour");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Clock className="mr-2 h-5 w-5" />
                        <CardTitle>Rush Hours</CardTitle>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                                        <Input type="time" value={rushForm.from} onChange={(e) => setRushForm((prev) => ({ ...prev, from: e.target.value }))} required />
                                    </div>
                                    <div>
                                        <Label>To</Label>
                                        <Input type="time" value={rushForm.to} onChange={(e) => setRushForm((prev) => ({ ...prev, to: e.target.value }))} required />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
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
    );
};

export default RushHoursCard;
