"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useUser } from "~/app/providers";
import { useDayjs } from "~/hooks/use-dayjs";
import { api } from "~/lib/trpc/client";
import { Loader } from "./ui/loader";
import { useToast } from "./ui/use-toast";

export function UpdateTimezoneDialog({ timezoneDialogCookie }: { timezoneDialogCookie: string }) {
	const user = useUser();
	const { dayjs } = useDayjs();
	const { toast } = useToast();
	const localTimezone = dayjs.tz.guess() ?? "Australia/Brisbane";
	const [open, onOpenChange] = React.useState(user.timezone !== localTimezone && timezoneDialogCookie !== "1");

	React.useEffect(() => {
		if (localTimezone && user.timezone !== localTimezone && timezoneDialogCookie !== "1") {
			onOpenChange(true);
		}
	}, [localTimezone, user.timezone, timezoneDialogCookie]);

	const updateUserMutation = api.auth.user.update.useMutation({
		onSuccess() {
			toast({
				title: "Timezone updated",
				description: "Your timezone has been updated successfully",
			});
			onOpenChange(false);
		},
		onError() {
			toast({
				title: "Timezone update failed",
				description: "An error occurred while updating your timezone. Please try again.",
				variant: "destructive",
			});
		},
	});
	const updateTimezoneDialogCookie = api.auth.user.setDoNotShowUpdateTimezoneDialog.useMutation({
		onSuccess() {
			toast({
				title: "We won't ask again",
				description: (
					<>
						To update your timezone in the future, you can do so in your{" "}
						<Button variant="link" asChild className="h-auto p-0 text-xs">
							<Link href="/account">personal settings</Link>
						</Button>
						.
					</>
				),
			});
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (value === false) {
					updateTimezoneDialogCookie.mutate();
				}
				onOpenChange(value);
			}}
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Update Timezone?</DialogTitle>
					<DialogDescription>
						It looks like your local timezone has changed from <strong>{user.timezone}</strong> to{" "}
						<strong>{localTimezone}</strong>. It is very important to keep your timezone up to date to ensure times are
						displayed correctly. Would you like to update it?
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						disabled={updateUserMutation.isLoading}
						onClick={() => {
							updateUserMutation.mutate({ timezone: localTimezone });
						}}
					>
						{updateUserMutation.isLoading && <Loader size="sm" />}
						Update Timezone
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
