"use client";

import { type Column, type ColumnDef } from "@tanstack/react-table";
import { ChevronsUpDown, CopyIcon, Edit2Icon, EyeOff, MoreVerticalIcon, SortAsc, SortDesc } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type ClientWithDogRelationships } from "~/db/drizzle-schema";
import { cx } from "~/lib/utils";

const clientTableColumns: ColumnDef<ClientWithDogRelationships>[] = [
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
				<div className="flex w-[100px] items-center">
					<span>{row.getValue("emailAddress")}</span>
				</div>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "phoneNumber",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
		cell: ({ row }) => {
			return (
				<div className="flex items-center">
					<span>{row.getValue("phoneNumber")}</span>
				</div>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
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
								<MoreVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[160px]">
							<DropdownMenuItem>
								<Edit2Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Edit
							</DropdownMenuItem>

							<DropdownMenuItem>
								<CopyIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Make a copy
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cx(className)}>{title}</div>;
	}

	return (
		<div className={cx("flex items-center space-x-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
						<span>{title}</span>
						{column.getIsSorted() === "desc" ? (
							<SortDesc className="ml-2 h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<SortAsc className="ml-2 h-4 w-4" />
						) : (
							<ChevronsUpDown className="ml-2 h-4 w-4" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<SortAsc className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<SortDesc className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
						<EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Hide
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export { clientTableColumns };
