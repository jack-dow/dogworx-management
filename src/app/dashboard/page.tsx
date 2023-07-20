"use client";

import { type Metadata } from "next";
import { signOut } from "next-auth/react";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";

// export const metadata: Metadata = {
// 	title: "Dashboard | Dogworx Management",
// };

function RootPage() {
	return (
		<>
			<PageHeader title="Dashboard" />
			<div className="flex flex-col space-y-4 ">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					<Button
						onClick={() => {
							signOut()
								.then(() => {
									console.log("signed out");
								})
								.catch((error) => {
									console.log("error signing out", error);
								});
						}}
					>
						Sign out
					</Button>
				</div>
			</div>
		</>
	);
}

export default RootPage;
