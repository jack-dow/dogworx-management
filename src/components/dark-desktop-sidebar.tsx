"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";
import {
	CalendarDaysIcon,
	ClipboardListIcon,
	ContactIcon,
	DogIcon,
	ReceiptIcon,
	StoreIcon,
	UserIcon,
	type Icon,
} from "./ui/icons";

type Navigation = {
	name: string;
	href: string;
	icon: Icon;
	disabled: boolean;
};

const navigation: Record<string, Navigation> = {
	"/test": { name: "Calendar", href: "/test", icon: CalendarDaysIcon, disabled: true },
	"/dogs": { name: "Dogs", href: "/dogs", icon: DogIcon, disabled: false },
	"/clients": { name: "Clients", href: "/clients", icon: UserIcon, disabled: false },
	"/vets": { name: "Vets", href: "/vets", icon: ContactIcon, disabled: true },
	"/vet-clinics": { name: "Vet Clinics", href: "/vet-clinics", icon: StoreIcon, disabled: true },
	"/invoices": { name: "Invoices", href: "/invoices", icon: ReceiptIcon, disabled: true },
	"/bookings": { name: "Bookings", href: "/bookings", icon: ClipboardListIcon, disabled: true },
};

function DarkDesktopSidebar() {
	const pathname = usePathname();

	return (
		<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col xl:w-80">
			<div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-950 px-6 ">
				<div className="flex shrink-0 items-center pb-4 pt-6">
					<Link href="/" shallow>
						<Image src="/dogworx-logo-white.svg" alt="Dogworx Paw Logo White" height={56} width={47} />
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
												className={cn(
													current
														? "bg-gray-900 text-white"
														: !item.disabled
														? "text-gray-300 hover:text-gray-50 hover:bg-gray-900"
														: "opacity-50 cursor-not-allowed text-gray-300 hover:bg-transparent hover:text-gray-300",
													"group flex gap-x-4 font-medium rounded-md p-2 text-base leading-6 items-center",
												)}
											>
												<item.icon
													className={cn(
														current
															? "text-gray-50"
															: !item.disabled
															? "text-gray-300 group-hover:text-gray-50"
															: "cursor-not-allowed text-gray-300 hover:text-gray-300",

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
					</ul>
				</nav>
			</div>
		</div>
	);
}

export { DarkDesktopSidebar };
