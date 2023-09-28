"use client";

import * as React from "react";
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
import { type RouterOutputs } from "~/server";

type Dog = RouterOutputs["app"]["dogs"]["all"]["data"][number];

function createDogsTableColumns(onDeleteClick: (dog: Dog) => void): ColumnDef<Dog>[] {
	return [
		{
			accessorKey: "givenName",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Name</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex select-none space-x-2">
						<span className="truncate font-medium capitalize">{row.getValue("givenName")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "familyName",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Family name</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex select-none space-x-2">
						<span className="truncate font-medium capitalize">{row.getValue("familyName")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "breed",
			header: () => (
				<div className="text-xs">
					<span className="truncate">Breed</span>
				</div>
			),
			cell: ({ row }) => {
				return (
					<div className="flex max-w-[500px] select-none items-center capitalize">
						<span className="truncate capitalize">{row.getValue("breed")}</span>
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
					<div className="flex select-none items-center ">
						<span className="truncate capitalize">{row.getValue("color")}</span>
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
								<Link href={`/dogs/${row.original.id}`} className="hover:cursor-pointer">
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

export { createDogsTableColumns };
