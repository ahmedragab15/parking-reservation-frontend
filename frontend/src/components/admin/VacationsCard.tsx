import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import useCustomMutation from "@/hooks/useCustomMutation";
import { toast } from "sonner";

const VacationsCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [vacationForm, setVacationForm] = useState({ name: "", from: "", to: "" });

    const addVacationMutation = useCustomMutation({
        url: "/admin/vacations",
        method: "POST",
    });

    const handleAddVacation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addVacationMutation.mutateAsync(vacationForm);
            toast.success("Vacation period added successfully");
            setIsOpen(false);
            setVacationForm({ name: "", from: "", to: "" });
        } catch {
            toast.error("Failed to add vacation period");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Calendar className="mr-2 h-5 w-5" />
                        <CardTitle>Vacation Periods</CardTitle>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
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
    );
};

export default VacationsCard;
