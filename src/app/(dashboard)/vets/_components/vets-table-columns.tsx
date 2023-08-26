"use vet";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";

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
import { type VetsList } from "~/actions";

function createVetsTableColumns(
	onDeleteClick: (vet: VetsList["data"][number]) => void,
): ColumnDef<VetsList["data"][number]>[] {
	return [
		{
			accessorKey: "fullName",
			accessorFn: (row) => `${row.givenName} ${row.familyName}`,
			header: () => (
				<div className="text-xs">
					<span className="truncate">Full name</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex max-w-[500px] flex-col">
						<span className="truncate font-medium">{row.getValue("fullName")}</span>
						<span className="text-xs text-muted-foreground sm:hidden">{row.original.emailAddress}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "emailAddress",
			header: () => (
				<div className="hidden text-xs sm:table-cell">
					<span className="truncate">Email address</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="hidden max-w-[500px] items-center sm:flex">
						<span className="truncate">{row.getValue("emailAddress")}</span>
					</div>
				);
			},
			meta: {
				className: "hidden sm:table-cell",
			},
		},
		{
			accessorKey: "phoneNumber",
			header: () => (
				<div className="truncate text-xs">
					Phone <span className="hidden sm:inline">number</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex items-center">
						<span className="truncate">{row.getValue("phoneNumber")}</span>
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
									<Link href={`/vet/${row.original.id}`} className="hover:cursor-pointer">
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

export { createVetsTableColumns };
