"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	CalendarDaysIcon,
	ClipboardList,
	ContactIcon,
	DogIcon,
	ReceiptIcon,
	StoreIcon,
	UserIcon,
	type LucideIcon,
} from "lucide-react";

import { cx } from "~/lib/utils";
import DogworxLogoGradient from "../../../../public/dogworx-logo-gradient.svg";

type Navigation = {
	name: string;
	href: string;
	icon: LucideIcon;
	disabled: boolean;
};

const navigation: Record<string, Navigation> = {
	"/test": { name: "Calendar", href: "/test", icon: CalendarDaysIcon, disabled: true },
	"/dogs": { name: "Dogs", href: "/dogs", icon: DogIcon, disabled: false },
	"/clients": { name: "Clients", href: "/clients", icon: UserIcon, disabled: false },
	"/vets": { name: "Vets", href: "/vets", icon: ContactIcon, disabled: true },
	"/vet-clinics": { name: "Vet Clinics", href: "/vet-clinics", icon: StoreIcon, disabled: true },
	"/invoices": { name: "Invoices", href: "/invoices", icon: ReceiptIcon, disabled: true },
	"/bookings": { name: "Bookings", href: "/bookings", icon: ClipboardList, disabled: true },
};

const teams = [
	{ id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
	{ id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
	{ id: 3, name: "Workcation", href: "#", initial: "W", current: false },
];

export function DesktopSidebar() {
	const pathname = usePathname();

	return (
		<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
			{/* Sidebar component, swap this element with another sidebar if you like */}
			<div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 shadow-sm">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					<Link href="/" shallow>
						<Image src={DogworxLogoGradient as ImageProps["src"]} alt="Dogworx Logo Full" className="h-10 w-auto" />
					</Link>
				</div>
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
												className={cx(
													current
														? "bg-gray-50 text-indigo-600"
														: !item.disabled
														? "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
														: "opacity-50 cursor-not-allowed text-gray-700 hover:bg-transparent hover:text-gray-700",
													"group flex gap-x-4 rounded-md p-2 text-base leading-6 items-center",
												)}
											>
												<item.icon
													className={cx(
														current
															? "text-indigo-600"
															: !item.disabled
															? "text-gray-400 group-hover:text-indigo-600"
															: "cursor-not-allowed text-gray-700 hover:text-gray-700",

														"h-6 w-6 shrink-0",
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
						{/* <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Your teams</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {teams.map((team) => (
                    <li key={team.name}>
                      <a
                        href={team.href}
                        className={cx(
                          team.current
                            ? "bg-gray-50 text-indigo-600"
                            : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 ",
                        )}
                      >
                        <span
                          className={cx(
                            team.current
                              ? "text-indigo-600 border-indigo-600"
                              : "text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600",
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white",
                          )}
                        >
                          {team.initial}
                        </span>
                        <span className="truncate">{team.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="#"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                >
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">Tom Cook</span>
                </a>
                          </li> */}
					</ul>
				</nav>
			</div>
		</div>
	);
}
