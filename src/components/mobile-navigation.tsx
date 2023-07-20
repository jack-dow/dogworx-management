"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import DogworxPawLogoGradient from "~/assets/dogworx-paw-logo-gradient.svg";
import { cn } from "~/lib/utils";
import { navigation } from "./dark-desktop-sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	BookingIcon,
	CalendarDaysIcon,
	ClientsIcon,
	DogIcon,
	InvoiceIcon,
	LogOutIcon,
	MobileMenuIcon,
	UserCircleIcon,
	UserIcon,
	VetClinicIcon,
	VetsIcon,
} from "./ui/icons";
import { Loader } from "./ui/loader";
import { useToast } from "./ui/use-toast";

type Navigation = {
	name: string;
	href: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: (...args: any[]) => JSX.Element | React.ReactNode;
	disabled: boolean;
};

function MobileNavigation() {
	const pathname = usePathname();
	const { toast } = useToast();

	const [isSigningOut, setIsSigningOut] = React.useState(false);

	// const primaryEmailAddress = user?.emailAddresses.find(
	// 	(emailAddress) => emailAddress.id === user.primaryEmailAddressId,
	// );
	return (
		<Sheet>
			<SheetTrigger asChild className="fixed bottom-4 left-4 z-50 shadow-md lg:hidden">
				<Button variant="outline" size="icon" className="h-14 w-14 rounded-full">
					<MobileMenuIcon className="h-5 w-5" />
					<span className="sr-only">Open mobile navigation</span>
				</Button>
			</SheetTrigger>
			<SheetContent className="flex flex-col sm:max-w-md md:max-w-lg lg:hidden" side="left">
				<Link href="/" shallow>
					<Image src={DogworxPawLogoGradient as string} alt="Dogworx Paw Logo (Gradient Version)" />
				</Link>
				<SheetHeader>
					<SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
				</SheetHeader>
				<nav className="flex flex-1 flex-col">
					<ul role="list" className="flex flex-1 flex-col gap-y-7">
						<li>
							<ul role="list" className="-mx-2 space-y-1">
								{Object.values(navigation).map((item) => {
									const current = item.href === pathname || pathname.startsWith(item.href);
									return (
										<li key={item.name}>
											<a
												aria-disabled={item.disabled}
												href={item.disabled ? "#" : item.href}
												className={cn(
													current
														? "bg-slate-50 text-indigo-600"
														: !item.disabled
														? "text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
														: "opacity-25 cursor-not-allowed text-slate-700 hover:bg-transparent hover:text-slate-700",
													"group flex gap-x-4 rounded-md p-2 font-medium text-base leading-6 items-center",
												)}
											>
												<item.icon
													className={cn(
														current
															? "text-indigo-600"
															: !item.disabled
															? "text-slate-400 group-hover:text-indigo-600"
															: "cursor-not-allowed text-slate-700 hover:text-slate-700",

														"h-5 w-5 shrink-0",
													)}
													aria-hidden="true"
												/>
												{item.name}
											</a>
										</li>
									);
								})}
							</ul>
						</li>

						{/* {user && (
							<li className="-mx-2 mt-auto">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="flex h-auto w-full items-center justify-start gap-x-4 px-2 py-3">
											{user?.profileImageUrl ? (
												<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
													<Image
														src={user.profileImageUrl}
														alt="User's profile image"
														width={128}
														height={128}
														className="aspect-square rounded-md object-cover"
													/>
												</div>
											) : (
												<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 ">
													{user.firstName ? (
														user.firstName[0]
													) : (
														<UserCircleIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
													)}
												</div>
											)}
											<div className="flex flex-col items-center justify-start">
												<span className="sr-only">Open user settings</span>
												<span aria-hidden="true" className="block text-xs text-muted-foreground">
													Administrator
												</span>
												<span aria-hidden="true" className="mt-0.5 w-full text-left">
													{user.firstName && user.firstName.length > 0
														? `${user.firstName}${
																user.lastName && user.lastName?.length > 0 ? ` ${user.lastName}` : ""
														  }`
														: primaryEmailAddress?.emailAddress ?? "My Account"}
												</span>
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-[256px]">
										{primaryEmailAddress ? (
											<p className="truncate px-2 py-1.5">
												<span className="block text-xs text-muted-foreground">Signed in as</span>
												<span className="mt-0.5 text-sm font-semibold">{primaryEmailAddress.emailAddress}</span>
											</p>
										) : (
											<DropdownMenuLabel>My Account</DropdownMenuLabel>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem asChild>
												<a href="/account-settings">
													<UserIcon className="mr-2 h-4 w-4" />
													<span>Account Settings</span>
												</a>
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuItem
											onClick={(e) => {
												e.preventDefault();
												setIsSigningOut(true);

												signOut()
													.then(() => {
														toast({
															title: "Signed out",
															description: "You have successfully been signed out of your account.",
														});
													})
													.catch((error) => {
														console.log(error);
														toast({
															title: "Sign out failed",
															description: "We had an issue signing you out of your account. Please try again later.",
														});
													})
													.finally(() => {
														setIsSigningOut(false);
													});
											}}
										>
											{isSigningOut ? <Loader size="sm" variant="black" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
											<span>Sign out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</li>
						)} */}
					</ul>
				</nav>
			</SheetContent>
		</Sheet>
	);
}

export { MobileNavigation };
