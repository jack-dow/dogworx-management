import { EllipsisVerticalIcon } from "./ui/icons";
import { Skeleton } from "./ui/skeleton";

function RelationshipLoadingSkeleton() {
	return (
		<div className="flex max-w-full items-center justify-between gap-x-6 py-4">
			<Skeleton className="hidden h-10 w-10 flex-none rounded-full bg-slate-50 sm:flex " />
			<div className="min-w-0 flex-auto truncate">
				<Skeleton className="h-5 w-[70px] rounded" />
				<Skeleton className="mt-1 h-4 w-[170px] rounded" />
			</div>
			<div className="flex space-x-4">
				<Skeleton className="h-8 w-[115px] rounded-md" />
				<div className="flex items-center">
					<div className="flex items-center justify-center rounded-full text-slate-400 opacity-50">
						<EllipsisVerticalIcon className="h-5 w-5" />
					</div>
				</div>
			</div>
		</div>
	);
}

export { RelationshipLoadingSkeleton };
