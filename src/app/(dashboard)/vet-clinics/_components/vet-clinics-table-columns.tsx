"use vet";

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
import { type VetClinicsList } from "~/actions";

function createVetClinicsTableColumns(
	onDeleteClick: (vetClinic: VetClinicsList["data"][number]) => void,
): ColumnDef<VetClinicsList["data"][number]>[] {
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
				<div className="text-xs">
					<span className="truncate">Phone number</span>
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
								<DropdownMenuItem>
									<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
									Edit
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

export { createVetClinicsTableColumns };
