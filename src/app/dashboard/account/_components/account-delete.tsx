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
import { useUser } from "../../providers";

function AccountDelete() {
	const user = useUser();
	const { toast } = useToast();
	const router = useRouter();

	const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

	return (
		<div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-3 lg:gap-8">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Delete account</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					Once you delete your account, there is no going back. All data associated with your account will be
					permanently deleted.
				</p>
			</div>
			<div className="flex space-y-2 md:col-span-2">
				{user.organizationRole === "owner" && (
					<div className="shrink-0">
						Your account is currently the owner of the organization. You must transfer ownership of the organization to
						another user before you can delete your account.
					</div>
				)}
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
									// user
									// 	.delete()
									// 	.then(() => {
									// 		void router.push("/sign-in");
									// 		toast({
									// 			title: "Account deleted",
									// 			description: "Your account was successfully deleted.",
									// 		});
									// 	})
									// 	.catch(() => {
									// 		toast({
									// 			title: "Something went wrong",
									// 			description: "We were unable to delete your account. Please try again later.",
									// 		});
									// 		setIsDeletingAccount(false);
									// 	});
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
	);
}

export { AccountDelete };
