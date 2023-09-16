"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";

import { BOOKING_TYPES_COLORS } from "~/components/manage-booking-types/booking-types-fields";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EditIcon, EllipsisVerticalIcon, TrashIcon } from "~/components/ui/icons";
import { type Dayjs } from "~/hooks/use-dayjs";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

type Booking = RouterOutputs["app"]["bookings"]["all"]["data"][number];

function createBookingsTableColumns(dayjs: Dayjs, onDeleteClick: (booking: Booking) => void): ColumnDef<Booking>[] {
	return [
		{
			accessorKey: "bookingType",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Booking Type</span>
				</div>
			),
			cell: ({ row }) => {
				const bookingType = row.original.bookingType;
				return (
					<div className="relative flex select-none space-x-2">
						<div
							className={cn(
								"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
								bookingType && bookingType?.color in BOOKING_TYPES_COLORS
									? BOOKING_TYPES_COLORS[bookingType.color as keyof typeof BOOKING_TYPES_COLORS]
									: "bg-violet-200",
							)}
						/>
						<span className="truncate pl-6 font-medium capitalize">{bookingType?.name ?? "Default Booking"}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "dogsName",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Dog</span>
				</div>
			),
			cell: ({ row }) => {
				const dog = row.original.dog;
				return (
					<div className="flex select-none space-x-2">
						<span className="truncate font-medium capitalize">
							{dog?.givenName} {dog?.familyName}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "date",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Date</span>
				</div>
			),
			cell: ({ row }) => {
				const date = dayjs.tz(row.getValue("date"));
				const end = date.add(row.original.duration, "seconds");

				return (
					<div className="flex max-w-[500px] select-none items-center">
						<span className="truncate">
							{date.day() !== end.day() ? (
								<>
									{date.format("MMMM Do, YYYY")} - {end.format("MMMM Do, YYYY")}
								</>
							) : (
								<>{date.format("MMMM Do, YYYY")}</>
							)}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "time",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Time</span>
				</div>
			),
			cell: ({ row }) => {
				const date = dayjs.tz(row.getValue("date"));
				const end = date.add(row.original.duration, "seconds");

				return (
					<div className="flex max-w-[500px] select-none items-center">
						<span className="truncate">
							{date.format("h:mm")} {date.format("a") !== end.format("a") ? date.format("a") : ""} -{" "}
							{end.format("h:mma")}
						</span>
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
								<EllipsisVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[160px]">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link href={`/bookings/${row.original.id}`} className="hover:cursor-pointer">
									<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Edit
								</Link>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();

									onDeleteClick(row.original);
								}}
							>
								<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}

export { createBookingsTableColumns };
