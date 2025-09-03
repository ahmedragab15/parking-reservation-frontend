import { dashboardSidebar } from "@/constants";
import { Wifi, WifiOff, X } from "lucide-react";
import ActiveLink from "../shared/ActiveLink";
import { Button } from "../ui/button";
import { SetStateAction } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface IProps {
    isMobile?: boolean;
    user: User | null;
    isConnected: boolean;
    setSidebarOpen: (value: SetStateAction<boolean>) => void;
}

const AdminDashboardSidebar = ({ isMobile = false, user, isConnected, setSidebarOpen }: IProps) => (
    <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-6 border-b">
            <h1 className="text-lg md:text-xl font-semibold">
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
            </h1>
            <div className="flex items-center space-x-2">
                {!isMobile ? isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" /> : null}
                {isMobile && (
                    <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} >
                        <X className="h-20 w-20" />
                    </Button>
                )}
            </div>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
            {dashboardSidebar.map((item) => {
                return (
                    <ActiveLink
                        key={item.name}
                        href={item.href}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                        exact
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                    </ActiveLink>
                );
            })}
        </nav>
        <div className="border-t p-4">
            <div className="flex items-center justify-between">
                <div className="text-sm min-w-0 flex-1">
                    <p className="font-medium truncate">{user?.username || "username"}</p>
                    <p className="text-gray-500 text-xs">Administrator</p>
                </div>
                <Avatar className="h-8 w-8 ml-3 flex-shrink-0">
                    <AvatarImage src="https://github.com/shadcn.png" alt="user avatar" />
                    <AvatarFallback className="text-xs">{user?.username?.slice(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    </div>
);

export default AdminDashboardSidebar;
