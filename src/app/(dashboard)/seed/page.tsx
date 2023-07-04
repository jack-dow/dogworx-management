"use client";

import * as React from "react";

import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { seed } from "~/db/seed/seed";

function SeedPage() {
	const [seeded, setSeeded] = React.useState(false);
	const [isSeeding, setIsSeeding] = React.useState(false);

	const { toast } = useToast();

	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	return (
		<>
			<PageHeader title="Seed" />
			<div>
				<Button
					disabled={seeded || isSeeding}
					onClick={() => {
						setIsSeeding(true);
						seed()
							.then(() => {
								toast({
									title: "Seeded",
									description: "Seeded the database",
								});
								setSeeded(true);
							})
							.catch((error) => {
								console.error(error);
								toast({
									title: "Failed to seed",
									description: "Failed to seed the database. Check console for more details",
								});
							})
							.finally(() => {
								setIsSeeding(false);
							});
					}}
				>
					{isSeeding && <Loader size="sm" />}
					Seed data
				</Button>
			</div>
		</>
	);
}

export default SeedPage;
