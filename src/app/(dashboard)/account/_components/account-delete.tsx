"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { actions } from "~/actions";
import { useUser } from "../../../providers";

function AccountDelete() {
	const user = useUser();
	const { toast } = useToast();
	const router = useRouter();

	const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

	return (
		<div className="grid grid-cols-1 items-center gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Delete account</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					Once you delete your account, there is no going back. All data associated with your account will be
					permanently deleted.
				</p>
			</div>
			<div className="flex flex-col space-y-4 xl:col-span-2">
				{user.organizationRole === "owner" && (
					<div className="shrink-0 text-sm">
						Your account is currently the owner of the organization. You must transfer ownership of the organization to
						another user before you can delete your account.
					</div>
				)}
				<div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button disabled={user.organizationRole === "owner"} variant="destructive">
								Delete your account
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									Once you delete your account, it and all associated data will be permanently deleted.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									disabled={isDeletingAccount}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setIsDeletingAccount(true);
										actions.auth.user
											.delete()
											.then(() => {
												void router.push("/sign-in");
												toast({
													title: "Account deleted",
													description: "Your account was successfully deleted.",
												});
											})
											.catch(() => {
												toast({
													title: "Something went wrong",
													description:
														"An unknown error ocurred and we were unable to delete your account. Please try again.",
													variant: "destructive",
												});
												setIsDeletingAccount(false);
											});
									}}
								>
									{isDeletingAccount && <Loader size="sm" />}
									<span>Delete account</span>
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

export { AccountDelete };
