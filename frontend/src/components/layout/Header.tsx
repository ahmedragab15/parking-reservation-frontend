"use client";
import { navItems } from "@/constants";
import Link from "next/link";
import { useState } from "react";
import ActiveLink from "../shared/ActiveLink";
import { Button } from "../ui/button";

const Header = () => {
    const [mobileNav, setMobileNav] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-white border border-gray-200 px-2 sm:px-4 py-6 rounded shadow">
            <div className="container flex flex-wrap justify-between items-center mx-auto">
                <Link href="/" className="flex items-center">
                    <span className="self-center text-xl font-semibold whitespace-nowrap text-black">Logo</span>
                </Link>
                <div className="flex items-center">
                    <Button
                        size={"icon"}
                        variant={"outline"}
                        className="md:hidden inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        onClick={() => setMobileNav(!mobileNav)}
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </Button>
                </div>
                <nav className={`w-full flex flex-col md:flex-row duration-300 bg-white/70 backdrop-blur-xs left-0 md:flex md:items-center md:w-auto ${mobileNav ? "block" : "hidden"}`}>
                    <ul className="flex flex-col text-center mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
                        {navItems.map(({ name, href }, index) => (
                            <li key={index}>
                                <ActiveLink
                                    href={href}
                                    className="font-medium hover:text-blue-700 block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                                >
                                    {name}
                                </ActiveLink>
                            </li>
                        ))}
                    </ul>
                    <Button className="md:ml-4"><Link href="/login">Get Started</Link></Button>
                </nav>
            </div>
        </header>
    );
};

export default Header;
