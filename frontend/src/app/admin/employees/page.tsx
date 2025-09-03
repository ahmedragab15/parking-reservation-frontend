"use client";
import { useState, useRef } from "react";
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
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const EmployeesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    name: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });

  const headerRef = useRef(null);
  const addButtonRef = useRef(null);
  const cardRef = useRef(null);

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

  gsap.registerPlugin(useGSAP);
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" })
      .fromTo(addButtonRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4")
      .fromTo(cardRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.5");
  });

  useGSAP(() => {
    if (employees && !isLoading) {
      gsap.fromTo(
        ".employee-row",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.2,
        }
      );
    }
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
        <div ref={headerRef}>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600">Manage employee accounts and permissions</p>
        </div>
        {/* Add Employee/Admin Dialog */}
        <div ref={addButtonRef}>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="hover:scale-105 transition-transform duration-200">
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
      </div>
      {/* Employee List */}
      <Card ref={cardRef}>
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
                  <TableRow key={employee.id} className="employee-row">
                    <TableCell className="font-medium">{employee.username}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === "admin" ? "default" : "secondary"}>{employee.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="hover:scale-110 transition-transform duration-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="hover:scale-110 transition-transform duration-200">
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
