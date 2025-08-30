declare interface INavItems {
    name: string;
    href: string;
}

declare interface ActiveLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    activeClassName?: string;
    exact?: boolean;
}