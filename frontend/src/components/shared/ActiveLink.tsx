"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface IProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  onClick?: () => void;
}

const ActiveLink = ({ href, children, className, activeClassName = "text-blue-700",exact, onClick }: IProps) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={cn(className, isActive && activeClassName)} onClick={onClick}>
      {children}
    </Link>
  );
};

export default ActiveLink;
