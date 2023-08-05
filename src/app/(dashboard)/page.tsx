"use client";

import * as React from "react";
// import { type Metadata } from "next";
import { useRouter } from "next/navigation";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { signOut } from "~/lib/auth";

// export const metadata: Metadata = {
// 	title: "Dashboard | Dogworx Management",
// };

function RootPage() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = React.useState(false);
	const router = useRouter();
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					{process.env.NODE_ENV === "development" && (
						<>
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
												description: "Failed to sign you out. Please try again",
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
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default RootPage;
