"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession } from "~/app/providers";
import DogworxLogoWhite from "~/assets/dogworx-logo-white.svg";
import { env } from "~/env.mjs";
import { cn } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	BookingIcon,
	BuildingOfficeIcon,
	CalendarDaysIcon,
	ClientsIcon,
	DogIcon,
	LogOutIcon,
	SettingsIcon,
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
	adminOnly?: boolean;
	subNavigation?: Array<{
		name: string;
		href: string;
	}>;
};

export const navigation = [
	{ name: "Calendar", href: "/calendar/week", icon: CalendarDaysIcon, disabled: false },
	{ name: "Dogs", href: "/dogs", icon: DogIcon, disabled: false },
	{ name: "Clients", href: "/clients", icon: ClientsIcon, disabled: false },
	{ name: "Vets", href: "/vets", icon: VetsIcon, disabled: false },
	{ name: "Vet Clinics", href: "/vet-clinics", icon: VetClinicIcon, disabled: false },
	{ name: "Bookings", href: "/bookings", icon: BookingIcon, disabled: false },
	{
		name: "Settings",
		href: "/settings/organization",
		icon: SettingsIcon,
		disabled: false,
		adminOnly: true,
		subNavigation: [
			{
				name: "Organization",
				href: "/settings/organization",
			},
			{
				name: "Booking types",
				href: "/settings/booking-types",
			},
		],
	},
] satisfies Array<Navigation>;

function DarkDesktopSidebar() {
	const session = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();

	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const signOutMutation = api.auth.user.signOut.useMutation();

	return (
		<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col 2xl:w-80">
			<div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-950 px-6 ">
				<div className="flex shrink-0 items-center pb-4 pt-6">
					<Link
						href="/"
						shallow
						className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
					>
						<Image src={DogworxLogoWhite as string} alt="Dogworx Logo (White Version)" priority width={150} />
					</Link>
				</div>
				<nav className="flex flex-1 flex-col">
					<ul role="list" className="flex flex-1 flex-col gap-y-7">
						<li>
							<ul role="list" className="-mx-2 space-y-1">
								{Object.values(navigation).map((item) => {
									const current = item.href === pathname || pathname.startsWith(item.href);

									if (
										item.adminOnly &&
										session.user.organizationRole !== "owner" &&
										session.user.organizationRole !== "admin"
									) {
										return null;
									}

									return (
										<React.Fragment key={"desktop-" + item.name}>
											<li>
												<Link
													aria-disabled={item.disabled}
													href={item.disabled ? "#" : item.href}
													className={cn(
														current
															? "bg-slate-900 text-white"
															: !item.disabled
															? "text-slate-300 hover:text-slate-50 hover:bg-slate-900"
															: "opacity-50 cursor-not-allowed text-slate-300 hover:bg-transparent hover:text-slate-300",
														"group flex gap-x-4 font-medium rounded-md p-2 text-base leading-6 items-center",
														"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
													)}
												>
													<item.icon
														className={cn(
															current
																? "text-slate-50"
																: !item.disabled
																? "text-slate-300 group-hover:text-slate-50"
																: "cursor-not-allowed text-slate-300 hover:text-slate-300",

															"h-5 w-5 shrink-0",
														)}
														aria-hidden="true"
													/>
													{item.name}
												</Link>
											</li>
											{current && item.subNavigation && (
												<ul role="list" className="flex flex-1 flex-col gap-y-2">
													{Object.values(item.subNavigation).map((subItem, index) => {
														const current =
															subItem.href === pathname || pathname.startsWith(`${subItem.href.slice(0, -1)}/`);

														const isLast = index === item.subNavigation.length - 1;

														return (
															<li key={"desktop-" + subItem.name}>
																<div className={cn("relative flex justify-between")}>
																	{!isLast ? (
																		<span
																			className="absolute left-[18px] top-6 -ml-px h-full w-0.5 bg-slate-700"
																			aria-hidden="true"
																		/>
																	) : null}

																	<Link
																		href={subItem.href}
																		className={cn(
																			current
																				? "bg-slate-900 text-white"
																				: "text-slate-300 hover:text-slate-50 hover:bg-slate-900",
																			"group flex w-full gap-x-4 font-medium rounded-md p-2 text-base leading-6 items-center",
																			"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
																		)}
																	>
																		<div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
																			<div
																				className={cn(
																					"flex h-2 w-2 items-center justify-center rounded-full border  shadow",
																					current ? "bg-input border-input" : "bg-slate-600 border-slate-600",
																				)}
																			>
																				<div
																					className={cn(
																						"h-1 w-1 rounded-full transition-colors bg-slate-900",
																						!current && "group-hover:bg-primary",
																					)}
																				/>
																			</div>
																		</div>
																		{subItem.name}
																	</Link>
																</div>
															</li>
														);
													})}
												</ul>
											)}
										</React.Fragment>
									);
								})}
								{session.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID && (
									<li>
										<a
											href="/organizations"
											className={cn(
												"/organizations" === pathname
													? "bg-slate-900 text-white"
													: "text-slate-300 hover:text-slate-50 hover:bg-slate-900",
												"group flex gap-x-4 font-medium rounded-md p-2 text-base leading-6 items-center",
												"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
											)}
										>
											<BuildingOfficeIcon
												className={cn(
													"/organizations" === pathname ? "text-slate-50" : "text-slate-300 group-hover:text-slate-50",

													"h-5 w-5 shrink-0",
												)}
												aria-hidden="true"
											/>
											Organizations
										</a>
									</li>
								)}
							</ul>
						</li>
						<li className="-mx-2 mt-auto">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="mb-2 flex h-auto w-full items-center justify-start gap-x-4 px-2 py-3 hover:bg-slate-800"
									>
										{session.user.profileImageUrl ? (
											<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-800">
												<Image
													src={session.user.profileImageUrl}
													alt="User's profile image"
													width={128}
													height={128}
													className="aspect-square rounded-md object-cover"
												/>
											</div>
										) : (
											<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 ">
												{session.user.givenName[0]}
												{session.user.familyName?.[0]}
											</div>
										)}
										<div className="flex flex-col justify-start">
											<span className="sr-only">Open user settings</span>
											<span aria-hidden="true" className="block text-left text-xs capitalize text-muted">
												{session.user.organizationRole}
											</span>
											<span aria-hidden="true" className="mt-0.5 w-full text-left text-white">
												{session.user.givenName} {session.user.familyName}
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[256px] 2xl:w-[288px]">
									<p className="truncate px-2 py-1.5">
										<span className="block text-xs text-muted-foreground">Signed in as</span>
										<span className="mt-0.5 text-sm font-semibold">{session.user.emailAddress}</span>
									</p>

									<DropdownMenuSeparator />
									<DropdownMenuGroup>
										<DropdownMenuItem asChild>
											<a href="/account">
												<UserIcon className="mr-2 h-4 w-4" />
												<span>Account Settings</span>
											</a>
										</DropdownMenuItem>
									</DropdownMenuGroup>
									<DropdownMenuItem
										onClick={(e) => {
											e.preventDefault();
											setIsSigningOut(true);

											signOutMutation
												.mutateAsync()
												.then(() => {
													router.push("/sign-in");
													router.refresh();
													toast({
														title: "Signed out",
														description: "You have successfully been signed out of your account.",
													});
												})
												.catch(() => {
													toast({
														title: "Sign out failed",
														description: "We had an issue signing you out of your account. Please try again.",
														variant: "destructive",
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
					</ul>
				</nav>
			</div>
		</div>
	);
}

export { DarkDesktopSidebar };
