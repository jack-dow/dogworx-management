"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "./button";

type ConfirmNavigationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

function ConfirmFormNavigationDialog({ open, onOpenChange, onConfirm }: ConfirmNavigationDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Unsaved changes</DialogTitle>
					<DialogDescription>
						Are you sure you want to exit this form? If you do, any unsaved changes will be lost.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={onConfirm}>Continue</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ConfirmFormNavigationDialog };
