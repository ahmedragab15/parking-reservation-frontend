import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import useCustomMutation from "@/hooks/useCustomMutation";
import { toast } from "sonner";
import useCustomQuery from "@/hooks/useCustomQuery";

interface RateUpdateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCategory: Category | null;
}

const RateUpdateDialog = ({ isOpen, onOpenChange, selectedCategory }: RateUpdateDialogProps) => {
    const [rateForm, setRateForm] = useState({ rateNormal: 0, rateSpecial: 0 });
    const { refetch: refetchCategories } = useCustomQuery({
        queryKey: ["admin", "categories"],
        url: "/master/categories",
    });

    const updateRatesMutation = useCustomMutation({
        url: `/admin/categories/${selectedCategory?.id}`,
        method: "PUT",
    });

    const handleUpdateRates = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        try {
            await updateRatesMutation.mutateAsync(rateForm);
            toast.success("Rates updated successfully");
            onOpenChange(false);
            refetchCategories();
        } catch {
            toast.error("Failed to update rates");
        }
    };

    useEffect(() => {
        if (selectedCategory) {
            setRateForm({
                rateNormal: selectedCategory.rateNormal,
                rateSpecial: selectedCategory.rateSpecial,
            });
        }
    }, [selectedCategory]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateRatesMutation.isPending}>
                            Update Rates
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RateUpdateDialog;
