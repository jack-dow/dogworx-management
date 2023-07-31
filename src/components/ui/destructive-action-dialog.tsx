import * as React from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";
import { Loader } from "./loader";

type DestructiveActionDialogProps = {
	title: string;
	description: string;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	actionText: string;
	onConfirm: () => Promise<void> | void;
};

function DestructiveActionDialog({
	title,
	description,
	trigger,
	onConfirm,
	actionText,
	open,
	onOpenChange,
}: DestructiveActionDialogProps) {
	const [_open, _setOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	return (
		<AlertDialog open={open ?? _open} onOpenChange={onOpenChange ?? _setOpen}>
			{trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isSubmitting}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							setIsSubmitting(true);

							Promise.resolve(onConfirm())
								.then(() => {
									if (onOpenChange) {
										onOpenChange(false);
									} else {
										_setOpen(false);
									}
								})
								.catch(() => {})
								.finally(() => {
									setIsSubmitting(false);
								});
						}}
					>
						{isSubmitting && <Loader size="sm" />}
						<span>{actionText}</span>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export { DestructiveActionDialog };
