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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EmployeesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    name: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });

  const {
    data: employees,
    isLoading,
    refetch,
  } = useCustomQuery({
    queryKey: ["admin", "users"],
    url: "/admin/users",
  });

  const createEmployeeMutation = useCustomMutation({
    url: "/admin/users",
    method: "POST",
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployeeMutation.mutateAsync(newEmployee);
      toast.success("Employee created successfully");
      setIsCreateOpen(false);
      setNewEmployee({ username: "", name: "", password: "", role: "employee" });
      refetch();
    } catch (error) {
      toast.error("Failed to create employee" + error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600">Manage employee accounts and permissions</p>
        </div>
        {/* Add Employee/Admin Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
              <DialogDescription>Add a new employee account to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <Input
                  placeholder="Username"
                  value={newEmployee.username}
                  onChange={(e) => setNewEmployee((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Full Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value: "admin" | "employee") => setNewEmployee((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmployeeMutation.isPending}>
                  {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>All registered employees and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading employees...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee: User) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.username}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === "admin" ? "default" : "secondary"}>{employee.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;
