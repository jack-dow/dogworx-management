"use client";

import * as React from "react";
// import { type Metadata } from "next";
import { useRouter } from "next/navigation";

import { ManageBookingDialog } from "~/components/manage-booking/manage-booking-dialog";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { TimeInput } from "~/components/ui/time-input";
import { useToast } from "~/components/ui/use-toast";
import { signOut } from "~/lib/auth";

// export const metadata: Metadata = {
// 	title: "Dashboard | Dogworx Management",
// };

function RootPage() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = React.useState(false);
	const router = useRouter();

	if (process.env.NODE_ENV !== "development") {
		router.replace("/calendar/week");
	}

	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 gap-4 pb-3 pt-6">
					{process.env.NODE_ENV === "development" && (
						<>
							<ManageBookingDialog />

							<Button
								disabled={isLoading}
								onClick={() => {
									setIsLoading(true);
									signOut()
										.then((result) => {
											if (result.success) {
												router.push("/sign-in");
												router.refresh();
											}
										})
										.catch(() => {
											toast({
												title: "Something went wrong",
												description: "An unknown error ocurred and we failed to sign you out. Please try again.",
												variant: "destructive",
											});
										})
										.finally(() => {
											setIsLoading(false);
										});
								}}
							>
								{isLoading && <Loader size="sm" aria-hidden="true" className="mr-2" />}
								Sign out
							</Button>

							<div className="flex flex-col gap-y-6">
								<Button>Button Text</Button>
								<Button variant="destructive">Button Text</Button>
								<Button variant="ghost">Button Text</Button>
								<Button variant="link">Button Text</Button>
								<Button variant="outline">Button Text</Button>
								<Button variant="secondary">Button Text</Button>
							</div>
							<div className="flex flex-col gap-y-6">
								<Input placeholder="Search..." />
								<TimeInput />
							</div>
							<div className="min-w-[400px]">
								<RichTextEditor />
							</div>
							<div className="flex flex-col gap-y-6">
								<Checkbox />
								<Checkbox checked />
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default RootPage;
