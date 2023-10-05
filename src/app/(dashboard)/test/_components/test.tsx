"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Loader } from "~/components/ui/loader";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { TimeInput } from "~/components/ui/time-input";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/lib/trpc/client";

function Test() {
	const { toast } = useToast();
	const emailMutation = api.app.bookings.testConfirmationEmail.useMutation({
		onSuccess: () => {
			console.log("Email sent successfully!");
		},
		onError: (error) => {
			console.error("Email failed to send:", error);
		},
	});
	return (
		<>
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 gap-4 pb-3 pt-6">
					{process.env.NODE_ENV === "development" && (
						<>
							<Button
								onClick={() => {
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
									// emailMutation.mutate({ bookingId: "r75e55cp4pin1x37gdhmh0e4" });
								}}
							>
								{emailMutation.isLoading && <Loader size="sm" />}Test email
							</Button>
							<div className="flex flex-col justify-center gap-y-6">
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

export { Test };
