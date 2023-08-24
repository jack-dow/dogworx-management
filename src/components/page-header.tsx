"use client";

import Link from "next/link";

import { ChevronLeftIcon } from "./ui/icons";

type PageHeaderProps = {
	title: string;
	back?: {
		href: string;
		label?: string;
	};
};

function PageHeader({ title, back }: PageHeaderProps) {
	return (
		<div className="flex shrink-0 flex-col pb-4 lg:pb-6">
			{back && (
				<div className="mb-2">
					<nav aria-label="Back" className="flex">
						<Link
							href={back.href}
							className="flex items-center text-sm font-medium capitalize text-slate-500 hover:text-slate-700"
						>
							<ChevronLeftIcon className="-ml-1 mr-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
							<span>
								{back.label ?? back.href === "/" ? "Dashboard" : back.href.split("/")[1]?.split("-").join(" ")}
							</span>
						</Link>
					</nav>
				</div>
			)}

			<div className="flex items-center space-x-2">
				<h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
					{title}
				</h1>
			</div>
		</div>
	);
}

export { PageHeader };
