"use client";

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
import { type OrganizationsList } from "~/actions";

function createOrganizationsTableColumns(
	onDeleteClick: (organization: OrganizationsList["data"][number]) => void,
): ColumnDef<OrganizationsList["data"][number]>[] {
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
			accessorKey: "users",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Users</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex items-center">
						<span className="truncate">
							{row.original.users.length}/{row.original.maxUsers}
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
									<Link href={`/organizations/${row.original.id}`} className="hover:cursor-pointer">
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

export { createOrganizationsTableColumns };
