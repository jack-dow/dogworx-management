"use client";

import { type Column, type ColumnDef } from "@tanstack/react-table";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	ChevronUpDownIcon,
	EditIcon,
	EllipsisVerticalIcon,
	EyeSlashIcon,
	SortAscIcon,
	SortDescIcon,
	TrashIcon,
} from "~/components/ui/icons";
import { type ClientsList } from "~/api";
import { cn } from "~/lib/utils";

function clientTableColumns(onDeleteClick: (client: ClientsList[number]) => void): ColumnDef<ClientsList[number]>[] {
	return [
		{
			accessorKey: "givenName",
			header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
			cell: ({ row }) => {
				return (
					<div className="flex space-x-2">
						<span className="max-w-[500px] truncate font-medium">{row.getValue("givenName")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "familyName",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
			cell: ({ row }) => {
				return (
					<div className="flex space-x-2">
						<span className="max-w-[500px] truncate font-medium">{row.getValue("familyName")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "emailAddress",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Email Address" />,
			cell: ({ row }) => {
				return (
					<div className="flex max-w-[500px] items-center">
						<span className="truncate">{row.getValue("emailAddress")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "phoneNumber",
			header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
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

								{/* <DropdownMenuItem
								className="opacity-75"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<CopyIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Make a copy
							</DropdownMenuItem> */}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn("flex items-center space-x-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
						<span>{title}</span>
						{column.getIsSorted() === "desc" ? (
							<SortDescIcon className="ml-2 h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<SortAscIcon className="ml-2 h-4 w-4" />
						) : (
							<ChevronUpDownIcon className="ml-2 h-4 w-4" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<SortAscIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<SortDescIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
						<EyeSlashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Hide
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export { clientTableColumns };
