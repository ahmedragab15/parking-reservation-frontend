import Image from "next/image";
import React from "react";
import { Separator } from "../ui/separator";

const Footer = () => {
    return (
        <footer className="bg-blue-100/80 font-sans dark:bg-gray-900">
            <div className="container px-6 py-12 mx-auto">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                        <h1 className="max-w-lg text-xl font-semibold tracking-tight text-gray-800 xl:text-2xl dark:text-white">
                            Subscribe our newsletter to get an update.
                        </h1>
                        <div className="flex flex-col mx-auto mt-6 space-y-3 md:space-y-0 md:flex-row">
                            <input
                                id="email"
                                type="text"
                                className="px-4 py-2 text-gray-700 bg-white border rounded-md dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-blue-300"
                                placeholder="Email Address"
                            />
                            <button className="w-full px-6 py-2.5 text-sm font-medium tracking-wider text-white transition-colors duration-300 transform md:w-auto md:mx-4 focus:outline-none bg-gray-800 rounded-lg hover:bg-gray-700 focus:ring focus:ring-gray-300 focus:ring-opacity-80">
                                Subscribe
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">Quick Link</p>
                        <div className="flex flex-col items-start mt-5 space-y-2">
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Contact Support
                            </p>
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Who We Are
                            </p>
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Privacy Policy
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">Quick Access</p>
                        <div className="flex flex-col items-start mt-5 space-y-2">
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Employee Checkout
                            </p>
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Gate Check-in
                            </p>
                            <p className="text-gray-600 transition-colors duration-300 dark:text-gray-300 dark:hover:text-blue-400 hover:underline hover:cursor-pointer hover:text-blue-500">
                                Help Center
                            </p>
                        </div>
                    </div>
                </div>
                <Separator className="mt-6 bg-gray-300" />
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="flex flex-1 gap-4 hover:cursor-pointer">
                        <Image src="https://www.svgrepo.com/show/303139/google-play-badge-logo.svg" width="130" height="110" alt="Google Play Link" />
                        <Image
                            src="https://www.svgrepo.com/show/303128/download-on-the-app-store-apple-logo.svg"
                            width="130"
                            height="110"
                            alt="App Store Link"
                        />
                    </div>
                    <div className="flex gap-4 hover:cursor-pointer">
                        <Image src="https://www.svgrepo.com/show/303114/facebook-3-logo.svg" width="30" height="30" alt="Facebook Link" />
                        <Image src="https://www.svgrepo.com/show/303115/twitter-3-logo.svg" width="30" height="30" alt="X Link" />
                        <Image src="https://www.svgrepo.com/show/303145/instagram-2-1-logo.svg" width="30" height="30" alt="Instagram Link" />
                        <Image src="https://www.svgrepo.com/show/28145/linkedin.svg" width="30" height="30" alt="Linkedin Link" />
                    </div>
                </div>
                <div className="border-t border-border/50 py-6">
                    <p className="text-center text-md text-muted-foreground">© 2025 Parking Reservation. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
