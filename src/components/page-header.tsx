"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "~/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "./ui/icons";

type PageHeaderProps = {
	title: string;
	action?: React.ReactNode;
};

function PageHeader({ title, action }: PageHeaderProps) {
	const router = useRouter();
	const pathname = usePathname();

	const pathnameArray = pathname.split("/").filter((path) => path !== "");

	return (
		<div className="flex shrink-0 flex-col pb-4 lg:pb-6">
			<div className="mb-2">
				<nav className="sm:hidden" aria-label="Back">
					<button
						onClick={() => router.back()}
						className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
					>
						<ChevronLeftIcon className="-ml-1 mr-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
						<span>Back</span>
					</button>
				</nav>

				<nav className="hidden sm:flex" aria-label="Breadcrumb">
					<ol role="list" className="flex items-center space-x-1">
						<li>
							<div className="flex">
								<Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
									Dashboard
								</Link>
							</div>
						</li>
						{pathnameArray.map((path, index) => {
							const pathToThisPoint = `/${pathnameArray.slice(0, index + 1).join("/")}`;

							return (
								<li key={`${path}-${index}`}>
									<div className="flex items-center">
										<ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
										<Link
											href={pathToThisPoint}
											className={cn(
												"ml-1 text-sm font-medium capitalize text-slate-500 hover:text-slate-700",
												pathToThisPoint === pathname && "font-bold",
											)}
										>
											{path.split("-").join(" ")}
										</Link>
									</div>
								</li>
							);
						})}
					</ol>
				</nav>
			</div>

			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
					{title}
				</h1>
				{action}
			</div>
		</div>
	);
}

export { PageHeader };
