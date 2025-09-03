import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import useCustomQuery from "@/hooks/useCustomQuery";

interface CategoryRatesTabProps {
    onEditRates: (category: Category) => void;
}

const CategoryRatesTab = ({ onEditRates }: CategoryRatesTabProps) => {
    const { data: categories } = useCustomQuery({
        queryKey: ["admin", "categories"],
        url: "/master/categories",
    });

    return (
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
                                    <Button variant="outline" size="sm" onClick={() => onEditRates(category)}>
                                        Edit Rates
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default CategoryRatesTab;
