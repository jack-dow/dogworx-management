"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";

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
import { type BookingsList } from "~/actions";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

function createBookingsTableColumns(
	onDeleteClick: (booking: BookingsList["data"][number]) => void,
): ColumnDef<BookingsList["data"][number]>[] {
	return [
		{
			accessorKey: "dogsFullName",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Dog&apos;s full name</span>
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
				const date = dayjs(row.getValue("date"));
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
				const date = dayjs(row.getValue("date"));
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
							<Link href="/bookings">
								<DropdownMenuItem>
									<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Edit
								</DropdownMenuItem>
							</Link>

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
