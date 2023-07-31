"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
} from "@tanstack/react-table";

import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "~/components/ui/icons";
import { type SortableColumns } from "~/actions/sortable-columns";
import { cn, constructPaginationSearchParams } from "~/utils";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

declare module "@tanstack/table-core" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string;
	}
}

interface DataTableProps<TData, TValue> extends DataTablePaginationProps {
	count: number;
	sortBy: string;
	sortDirection: string;
	columns: ColumnDef<TData, TValue>[];
	sortableColumns: SortableColumns;
	data: TData[];
	onTableRowClick?: (row: TData) => void;
}

function DataTable<TData, TValue>({
	count,
	sortBy,
	sortDirection,
	page,
	maxPage,
	limit,
	columns,
	sortableColumns,
	data,
	onTableRowClick,
}: DataTableProps<TData, TValue>) {
	const pathname = usePathname();
	const params = useSearchParams();

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [globalFilterValue, setGlobalFilterValue] = React.useState("");

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			globalFilter: globalFilterValue,
			pagination: {
				pageIndex: 0,
				pageSize: limit,
			},
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilterValue,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center space-x-2">
					<Input
						placeholder={`Filter ${count} ${pathname.slice(1)}...`}
						value={globalFilterValue ?? ""}
						onChange={(event) => {
							setGlobalFilterValue(event.target.value);
						}}
						className="h-8 w-[150px] lg:w-[250px] xl:w-[275px]"
					/>
				</div>
				<div className="flex items-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="ml-auto hidden h-8 gap-1 lg:flex">
								<span>Sort by</span>
								<ChevronDownIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[150px]">
							<DropdownMenuLabel>Sort columns</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{Object.values(sortableColumns).map((column) => {
								return (
									<Link
										key={column.id}
										href={`${pathname}?${constructPaginationSearchParams(params, {
											sortBy: column.id,
											sortDirection: column.id === sortBy ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
										}).toString()}`}
									>
										<DropdownMenuItem>{column.label}</DropdownMenuItem>
									</Link>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Separator orientation="vertical" className="mx-5 h-4" />
					<Button size="sm">Create Client</Button>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} clickable={false}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} className={header.column.columnDef.meta?.className}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									onClick={() => {
										if (onTableRowClick) {
											onTableRowClick(row.original);
										}
									}}
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={cn(onTableRowClick && "cursor-pointer")}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow clickable={false}>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination page={page} maxPage={maxPage} limit={limit} />
		</div>
	);
}

type DataTablePaginationProps = {
	page: number;
	maxPage: number;
	limit: number;
};

function DataTablePagination({ page, maxPage, limit }: DataTablePaginationProps) {
	const pathname = usePathname();
	const params = useSearchParams();

	return (
		<div className="flex w-full items-center justify-between space-x-6 lg:space-x-8">
			<div className="flex items-center space-x-2">
				<p className="text-sm font-medium">Rows per page</p>
				<Select>
					<SelectTrigger className="h-8 w-[70px]">
						<SelectValue>{limit}</SelectValue>
					</SelectTrigger>
					<SelectContent className="pointer-events-none">
						{[5, 20, 30, 40, 50].map((pageSize) => {
							const currentOffset = (page - 1) * limit;
							const newPage = Math.floor(currentOffset / Number(pageSize)) + 1;

							return (
								<Link
									key={pageSize}
									href={`${pathname}?${constructPaginationSearchParams(params, {
										page: newPage,
										limit: pageSize,
									}).toString()}`}
								>
									<SelectItem value={`${pageSize}`}>{pageSize}</SelectItem>
								</Link>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			<div className="flex">
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {page} of {maxPage}
				</div>
				<div className="flex items-center space-x-2">
					<Link
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: 1,
						}).toString()}`}
					>
						<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={page === 1}>
							<span className="sr-only">Go to first page</span>
							<ChevronDoubleLeftIcon className="h-4 w-4" />
						</Button>
					</Link>
					<Link
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: page === 1 ? 1 : page - 1,
						}).toString()}`}
					>
						<Button variant="outline" className="h-8 w-8 p-0" disabled={page === 1}>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
					</Link>
					<Link
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: page === maxPage ? maxPage : page + 1,
						}).toString()}`}
					>
						<Button variant="outline" className="h-8 w-8 p-0" disabled={page === maxPage}>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					</Link>
					<Link
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: maxPage,
						}).toString()}`}
					>
						<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={page === maxPage}>
							<span className="sr-only">Go to last page</span>
							<ChevronDoubleRightIcon className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

export { DataTable };
