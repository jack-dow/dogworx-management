"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
	AscendingIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	DescendingIcon,
	SortIcon,
	UserPlusIcon,
} from "~/components/ui/icons";
import { type SortableColumns } from "~/actions/sortable-columns";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useDidUpdate } from "~/hooks/use-did-update";
import { cn, constructPaginationSearchParams } from "~/utils";
import { Button } from "./button";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxPopover } from "./combobox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Loader } from "./loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { useToast } from "./use-toast";

declare module "@tanstack/table-core" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string;
	}
}

type DataTablePagination = Omit<DataTablePaginationProps, "setIsLoading"> & {
	count: number;
	sortBy: string;
	sortDirection: string;
};

interface DataTableProps<TData, TValue, SearchResultType extends { id: string }> {
	search: Omit<DataTableSearchComboboxProps<SearchResultType>, "count">;
	pagination: DataTablePagination;
	columns: ColumnDef<TData, TValue>[];
	sortableColumns: SortableColumns;
	data: TData[];
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

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="flex flex-1 items-center space-x-3">
					<DataTableSearchCombobox count={count} {...search} />
					{isLoading && <Loader variant="black" size="sm" />}
				</div>
				<div className="flex flex-1 items-center justify-end space-x-3 md:space-x-5">
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
									<Link
										key={column.id}
										href={`${pathname}?${constructPaginationSearchParams(searchParams, {
											sortBy: column.id,
											sortDirection: column.id === sortBy ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
										}).toString()}`}
										onClick={() => setIsLoading(true)}
									>
										<DropdownMenuItem className="justify-between">
											{column.label}
											{column.id === sortBy ? (
												sortDirection === "asc" ? (
													<AscendingIcon className="h-4 w-4" />
												) : (
													<DescendingIcon className="h-4 w-4" />
												)
											) : null}
										</DropdownMenuItem>
									</Link>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Separator orientation="vertical" className="h-4" />
					<Link href={`${pathname}/new`} onClick={() => setIsLoading(true)}>
						<Button size="sm">Create {pathname.split("/")[1]?.slice(0, -1).split("-").join(" ")}</Button>
					</Link>
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
											window.open(`${pathname}/${row.original.id}`, "_blank");
										} else {
											router.push(`${pathname}/${row.original.id}`);
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
									onClick={() => setIsLoading(true)}
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
						onClick={() => setIsLoading(true)}
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
						onClick={() => setIsLoading(true)}
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
						onClick={() => setIsLoading(true)}
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
						onClick={() => setIsLoading(true)}
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

type DataTableSearchComboboxProps<ResultType extends { id: string }> = {
	count: number;
	onSearch: (searchTerm: string) => Promise<ResultType[]>;
	renderSearchResultItemText: (item: ResultType) => string;
	onNoResultsActionSelect: (searchTerm: string) => void;
};

function DataTableSearchCombobox<ResultType extends { id: string }>({
	count,
	onSearch,
	renderSearchResultItemText,
	onNoResultsActionSelect,
}: DataTableSearchComboboxProps<ResultType>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	const [searchTerm, setSearchTerm] = React.useState("");
	const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 250);
	const [isFetchingResults, setIsFetchingResults] = React.useState(false);
	const [isNavigatingToResult, setIsNavigatingToResult] = React.useState<string | false>(false);
	const [results, setResults] = React.useState<ResultType[]>([]);
	const [confirmedNoResults, setConfirmedNoResults] = React.useState(false);

	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (!debouncedSearchTerm) {
			return;
		}

		onSearch(debouncedSearchTerm)
			.then((data) => {
				setResults(data);

				if (!data || data.length === 0) {
					setConfirmedNoResults(true);
				}
			})
			.catch(() => {
				toast({
					title: `Failed to search ${pathname.split("/")[1]}`,
					description: `An unknown error occurred whilst trying to search. Please try again later.`,
					variant: "destructive",
				});
			})
			.finally(() => {
				setIsFetchingResults(false);
			});
	}, [debouncedSearchTerm, onSearch, pathname, toast]);

	useDidUpdate(() => {
		if (isNavigatingToResult) {
			setIsNavigatingToResult(false);
		}
	}, [pathname, searchParams]);

	return (
		<Combobox
			nullable
			onChange={(result: ResultType | null) => {
				if (result) {
					if (result.id === "new") {
						onNoResultsActionSelect(searchTerm);
						return;
					}
					setIsNavigatingToResult(result.id);
					router.push(`${pathname}/${result.id}`);
				}
			}}
		>
			<div className="relative w-full max-w-[288px]">
				<ComboboxInput
					ref={inputRef}
					className="h-8"
					placeholder={`Search ${count} ${pathname.split("/")[1]?.split("-").join(" ")}...`}
					defaultValue={searchTerm}
					onChange={(event) => {
						setSearchTerm(event.currentTarget.value);

						if (event.currentTarget.value) {
							setIsFetchingResults(true);
						}

						setResults([]);
						setConfirmedNoResults(false);
					}}
				/>
				<ComboboxPopover className={cn(!isFetchingResults && !confirmedNoResults && results.length === 0 && "hidden")}>
					{isFetchingResults && (
						<div className="flex items-center justify-center py-6">
							<Loader className="m-0" variant="black" size="sm" />
						</div>
					)}

					{!isFetchingResults && confirmedNoResults && (
						<ComboboxItem value="not-found" disabled className="py-6 text-center text-sm">
							No results found...
						</ComboboxItem>
					)}

					{!isFetchingResults && !confirmedNoResults && results.length > 0 && (
						<>
							{results.map((result) => (
								<ComboboxItem
									key={result.id}
									value={result}
									onClick={(event) => {
										if (event.metaKey || event.ctrlKey) {
											event.preventDefault();
											event.stopPropagation();
											window.open(`${pathname}/${result.id}`, "_blank");
										}
									}}
									className="justify-between"
								>
									<span className="truncate">{renderSearchResultItemText(result)}</span>
									{isNavigatingToResult === result.id && (
										<div>
											<Loader variant="black" size="sm" />
										</div>
									)}
								</ComboboxItem>
							))}
						</>
					)}

					{((results.length === 0 && searchTerm === "") || confirmedNoResults) && (
						<div className="overflow-hidden p-1 text-foreground">
							<div className=" px-2 py-1.5 text-xs font-medium text-muted-foreground">Actions</div>
							<ComboboxItem value={{ id: "new" }}>
								<UserPlusIcon className="mr-2 h-4 w-4" />
								<span>
									Create new {pathname.split("/")[1]?.slice(0, -1).split("-").join(" ")}{" "}
									{searchTerm && `"${searchTerm}"`}
								</span>
							</ComboboxItem>
						</div>
					)}
				</ComboboxPopover>
			</div>
		</Combobox>
	);
}

export { DataTable };
