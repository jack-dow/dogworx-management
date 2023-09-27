"use vet";

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
import { cn, secondsToHumanReadable } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

type BookingType = RouterOutputs["app"]["bookingTypes"]["all"]["data"][number];

function createBookingTypesTableColumns(onDeleteClick: (bookingType: BookingType) => void): ColumnDef<BookingType>[] {
	return [
		{
			accessorKey: "name",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Name</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex max-w-[500px] flex-col">
						<span className="truncate font-medium">{row.getValue("name")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "duration",
			header: () => (
				<div className="hidden text-xs sm:table-cell">
					<span className="truncate">Duration</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="hidden max-w-[500px] items-center sm:flex">
						<span className="truncate">{secondsToHumanReadable(row.getValue("duration"))}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "color",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Color</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="relative flex items-center">
						{row.original.color in BOOKING_TYPES_COLORS && (
							<div
								className={cn(
									"w-4 h-4 rounded-full absolute mt-0.5 left-2 flex items-center justify-center",
									BOOKING_TYPES_COLORS[row.original.color as keyof typeof BOOKING_TYPES_COLORS],
								)}
							/>
						)}
						<span className={cn("truncate capitalize", row.original.color in BOOKING_TYPES_COLORS && "pl-8")}>
							{row.getValue("color")}
						</span>
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
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
									<Link href={`/booking-types/${row.original.id}`} className="hover:cursor-pointer">
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
				);
			},
		},
	];
}

export { createBookingTypesTableColumns };
