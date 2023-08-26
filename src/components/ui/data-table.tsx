/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
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
} from "@tanstack/react-table";

import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	SortAscIcon,
	SortDescIcon,
	SortIcon,
	UserPlusIcon,
} from "~/components/ui/icons";
import { type SortableColumns } from "~/actions/sortable-columns";
import { type PaginationSearchParams } from "~/actions/utils";
import { useDidUpdate } from "~/hooks/use-did-update";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Loader } from "./loader";
import { SearchCombobox, SearchComboboxAction, type SearchComboboxProps } from "./search-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

declare module "@tanstack/table-core" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string;
	}
}

function constructPaginationSearchParams(currentParams: ReadonlyURLSearchParams, newParams: PaginationSearchParams) {
	const searchParams = new URLSearchParams();

	const page = newParams.page ?? currentParams.get("page") ?? undefined;
	const limit = newParams.limit ?? currentParams.get("limit") ?? undefined;
	const sortBy = newParams.sortBy ?? currentParams.get("sortBy") ?? undefined;
	const sortDirection = newParams.sortDirection ?? currentParams.get("sortDirection") ?? undefined;

	if (page && String(page) !== "1") {
		searchParams.append("page", page.toString());
	}
	if (limit) {
		searchParams.append("limit", limit.toString());
	}
	if (sortBy) {
		searchParams.append("sortBy", sortBy);
	}
	if (sortDirection) {
		searchParams.append("sortDirection", sortDirection);
	}

	return searchParams;
}

type DataTablePagination = Omit<DataTablePaginationProps, "setIsLoading"> & {
	count: number;
	sortBy: string;
	sortDirection: string;
};

interface DataTableProps<TData, TValue, SearchResultType extends { id: string }> {
	pagination: DataTablePagination;
	columns: ColumnDef<TData, TValue>[];
	sortableColumns: SortableColumns;
	data: TData[];
	search?: Pick<SearchComboboxProps<SearchResultType>, "onSearch" | "resultLabel">;
}

function DataTable<TData extends { id: string }, TValue, SearchResultType extends { id: string }>({
	search,
	pagination: { count, sortBy, sortDirection, page, maxPage, limit },
	columns,
	sortableColumns,
	data,
}: DataTableProps<TData, TValue, SearchResultType>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [rowSelection, setRowSelection] = React.useState({});
	const [isLoading, setIsLoading] = React.useState(false);

	const table = useReactTable({
		data,
		columns,
		state: {
			rowSelection,
			pagination: {
				pageIndex: 0,
				pageSize: limit,
			},
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	useDidUpdate(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [pathname, searchParams]);

	let name = pathname.split("/")[1];
	name?.endsWith("s") ? (name = name.slice(0, -1)) : (name = name);
	name = name?.split("-").join(" ");

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="flex flex-1 items-center space-x-3">
					<div className="relative w-full max-w-[288px]">
						{search ? (
							<SearchCombobox
								{...search}
								onSelectChange={(result) => {
									if (result) {
										setIsLoading(true);
										router.push(`${pathname.slice(0, -1)}/${result.id}`);
									}
								}}
								placeholder={`Search ${count} ${name}s...`}
								className="h-8"
								classNames={{
									results: "max-w-[288px]",
								}}
								renderActions={({ searchTerm }) => (
									<SearchComboboxAction
										onSelect={() => {
											setIsLoading(true);
											router.push(
												`${pathname.slice(0, -1)}/new${
													searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : ""
												}`,
											);
											return;
										}}
									>
										<UserPlusIcon className="mr-2 h-4 w-4" />
										<span className="truncate">
											Create new {name} {searchTerm && `"${searchTerm}"`}
										</span>
									</SearchComboboxAction>
								)}
							/>
						) : (
							<SearchCombobox
								disabled
								resultLabel={() => ""}
								// eslint-disable-next-line @typescript-eslint/require-await
								onSearch={async () => {
									return [{ id: "" }];
								}}
							/>
						)}
					</div>

					{isLoading && <Loader variant="black" size="sm" />}
				</div>
				<div className="flex flex-1 items-center justify-end gap-x-3 md:gap-x-5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="flex h-8 gap-1">
								<SortIcon className="h-4 w-4 sm:hidden" />
								<span className="sr-only sm:not-sr-only">Sort by</span>
								<ChevronDownIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[150px]">
							<DropdownMenuLabel>Sort columns</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{Object.values(sortableColumns).map((column) => {
								return (
									<DropdownMenuItem asChild key={column.id}>
										<Link
											href={`${pathname}?${constructPaginationSearchParams(searchParams, {
												sortBy: column.id,
												sortDirection: column.id === sortBy ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
											}).toString()}`}
											onClick={() => setIsLoading(true)}
											className="justify-between hover:cursor-pointer"
										>
											{column.label}
											{column.id === sortBy ? (
												sortDirection === "asc" ? (
													<SortAscIcon className="h-4 w-4" />
												) : (
													<SortDescIcon className="h-4 w-4" />
												)
											) : null}
										</Link>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Separator orientation="vertical" className="h-4" />
					<Button size="sm" asChild>
						<Link href={`${name?.split(" ").join("-")}/new`} onClick={() => setIsLoading(true)}>
							Create {name}
						</Link>
					</Button>
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
									onClick={(event) => {
										setIsLoading(true);
										if (event.metaKey || event.ctrlKey) {
											window.open(`${pathname.slice(0, -1)}/${row.original.id}`, "_blank");
										} else {
											router.push(`${pathname.slice(0, -1)}/${row.original.id}`, {
												scroll: false,
											});
										}
									}}
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="cursor-pointer"
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
			<DataTablePagination page={page} maxPage={maxPage} limit={limit} setIsLoading={setIsLoading} />
		</div>
	);
}

function PaginationLink({
	href,
	onClick,
	disabled,
	children,
}: {
	href: string;
	onClick: () => void;
	disabled: boolean;
	children: React.ReactNode;
}) {
	if (disabled) {
		return (
			<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={disabled}>
				{children}
			</Button>
		);
	}

	return (
		<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={disabled} asChild>
			<Link href={href} onClick={onClick}>
				{children}
			</Link>
		</Button>
	);
}

type DataTablePaginationProps = {
	page: number;
	maxPage: number;
	limit: number;
	setIsLoading: (isLoading: boolean) => void;
};

function DataTablePagination({ page, maxPage, limit, setIsLoading }: DataTablePaginationProps) {
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
						{[20, 30, 40, 50].map((pageSize) => {
							const currentOffset = (page - 1) * limit;
							const newPage = Math.floor(currentOffset / Number(pageSize)) + 1;

							return (
								<SelectItem value={`${pageSize}`} key={pageSize} asChild>
									<Link
										href={`${pathname}?${constructPaginationSearchParams(params, {
											page: newPage,
											limit: pageSize,
										}).toString()}`}
										onClick={() => setIsLoading(true)}
										className="hover:cursor-pointer"
									>
										{pageSize}
									</Link>
								</SelectItem>
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
					<PaginationLink
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === 1}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronDoubleLeftIcon className="h-4 w-4" />
					</PaginationLink>
					<PaginationLink
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: page === 1 ? 1 : page - 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === 1}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</PaginationLink>

					<PaginationLink
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: page === maxPage ? maxPage : page + 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === maxPage}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon className="h-4 w-4" />
					</PaginationLink>
					<PaginationLink
						href={`${pathname}?${constructPaginationSearchParams(params, {
							page: maxPage,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === maxPage}
					>
						<span className="sr-only">Go to last page</span>
						<ChevronDoubleRightIcon className="h-4 w-4" />
					</PaginationLink>
				</div>
			</div>
		</div>
	);
}

export { DataTable };
