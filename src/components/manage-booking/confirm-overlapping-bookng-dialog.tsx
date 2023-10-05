import * as React from "react";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Loader } from "~/components/ui/loader";
import { type ManageBookingFormSchema } from "./use-manage-booking-form";

type ConfirmOverlappingBookingDialogProps = {
	assignedTo: ManageBookingFormSchema["assignedTo"];
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onConfirm: () => Promise<void> | void;
};

function ConfirmOverlappingBookingDialog({
	assignedTo,
	onConfirm,
	open,
	onOpenChange,
}: ConfirmOverlappingBookingDialogProps) {
	const [_open, _setOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const internalOpen = open ?? _open;
	const internalOnOpenChange = onOpenChange ?? _setOpen;

	return (
		<Dialog open={internalOpen} onOpenChange={internalOnOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						{assignedTo?.givenName} {assignedTo?.familyName} already has a booking at this time. Are you sure you want
						to create another booking?
					</DialogDescription>
				</DialogHeader>
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
						<span>Create overlapping booking</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ConfirmOverlappingBookingDialog };
