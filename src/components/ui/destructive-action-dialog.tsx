import * as React from "react";

import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";
import { TrashIcon } from "./icons";
import { Loader } from "./loader";

type DestructiveActionDialogProps = {
	name: string;
	requiresSaveOf?: string;
	withoutTrigger?: boolean;
	trigger?: "trash";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onConfirm: () => Promise<void> | void;
	children?: React.ReactNode;
};

function DestructiveActionDialog({
	name,
	requiresSaveOf,
	withoutTrigger,
	onConfirm,
	trigger,
	open,
	onOpenChange,
	children,
}: DestructiveActionDialogProps) {
	const [_open, _setOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const internalOpen = open ?? _open;
	const internalOnOpenChange = onOpenChange ?? _setOpen;

	name = name.toLowerCase();

	return (
		<Dialog open={internalOpen} onOpenChange={internalOnOpenChange}>
			{!withoutTrigger && (
				<DialogTrigger asChild>
					{trigger === "trash" ? (
						<Button variant="outline" size="icon">
							<span className="sr-only">Delete {name}</span>
							<TrashIcon className="h-4 w-4" />
						</Button>
					) : (
						<Button variant="destructive">Delete {name}</Button>
					)}
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						{requiresSaveOf
							? `Once you save this ${requiresSaveOf}, this ${name} will be permanently deleted.`
							: `This action will permanently delete this ${name} and any associated data. This action cannot be undone.`}
					</DialogDescription>
				</DialogHeader>
				{children}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							internalOnOpenChange(false);
						}}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={isSubmitting}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							setIsSubmitting(true);

							Promise.resolve(onConfirm())
								.then(() => {
									internalOnOpenChange(false);
								})
								.catch(() => {})
								.finally(() => {
									setIsSubmitting(false);
								});
						}}
					>
						{isSubmitting && <Loader size="sm" />}
						<span>Delete {name}</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DestructiveActionDialog };
