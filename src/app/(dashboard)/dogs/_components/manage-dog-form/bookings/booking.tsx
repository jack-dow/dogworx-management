"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CopyIcon, EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { useDayjs } from "~/hooks/use-dayjs";
import { cn } from "~/lib/utils";
import { type ManageDogFormSchema } from "../manage-dog-form";

function Booking({
	booking,
	isLast,
	onEditClick,
	onDelete,
	onCopy,
}: {
	booking: ManageDogFormSchema["bookings"][number];
	isLast: boolean;
	onEditClick: () => void;
	onDelete: () => void;
	onCopy: (booking: ManageDogFormSchema["bookings"][number]) => void;
}) {
	const { dayjs } = useDayjs();
	const [isActionsDropdownOpen, setIsActionsDropdownOpen] = React.useState(false);

	const date = dayjs.tz(booking.date);
	const end = date.add(booking.duration, "seconds");

	return (
		<li>
			<div className={cn("relative flex justify-between", isLast ? "pb-8" : "pb-10")}>
				{!isLast ? (
					<span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
				) : null}

				<div className="relative flex items-start space-x-3">
					<div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-8 ring-white">
						{booking.assignedTo ? (
							booking.assignedTo.profileImageUrl ? (
								<Image
									src={booking.assignedTo.profileImageUrl}
									alt="User's profile image"
									width={128}
									height={128}
									className="aspect-square rounded-full object-cover"
								/>
							) : (
								<>
									{booking.assignedTo.givenName[0]}
									{booking.assignedTo.familyName?.[0]}
								</>
							)
						) : (
							<>D</>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div>
							<div className="text-sm">
								<p className="font-medium text-primary">
									{booking.assignedTo
										? `${booking.assignedTo.givenName} ${booking.assignedTo.familyName}`
										: "Deleted User"}
								</p>
							</div>
							<p className="mt-0.5 text-sm text-slate-500">
								{date.day() !== end.day() ? (
									<>
										{date.format("MMMM Do, YYYY, h:mma")} - {end.format("MMMM Do, YYYY, h:mma")}
									</>
								) : (
									<>
										{date.format("MMMM Do, YYYY")} &bull; {date.format("h:mm")}
										{date.format("a") !== end.format("a") ? date.format("a") : ""} - {end.format("h:mma")}
									</>
								)}
							</p>
						</div>
						{booking.details ? (
							<div
								className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap"
								dangerouslySetInnerHTML={{ __html: booking.details }}
							/>
						) : (
							<div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap">
								<p className="italic text-slate-500">No details provided.</p>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end">
					<DropdownMenu open={isActionsDropdownOpen} onOpenChange={setIsActionsDropdownOpen}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
								<EllipsisVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									onEditClick();
								}}
							>
								<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Edit
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
							>
								<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								<span className="truncate">Delete</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onCopy(booking);
								}}
							>
								<CopyIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								<span className="truncate">Copy</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</li>
	);
}

export { Booking };
