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
} from "~/components/ui/alert-dialog";
import { DataTable } from "~/components/ui/data-table";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { api, type DogsList } from "~/api";
import { dogTableColumns } from "./dog-table-columns";

const DogTableContext = React.createContext<{
	deletingDog: DogsList[number] | null;
	setDeletingDog: (id: DogsList[number]) => void;
} | null>(null);

function DogTable({ dogs }: { dogs: DogsList }) {
	const router = useRouter();
	const { toast } = useToast();

	const [deletingDog, setDeletingDog] = React.useState<DogsList[number] | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);

	async function handleDogDelete() {
		setIsDeleting(true);

		if (deletingDog) {
			const result = await api.dogs.delete(deletingDog.id);

			if (result.success) {
				toast({
					title: `Dog deleted`,
					description: `Successfully deleted dog "${deletingDog.givenName}"`,
				});
			} else {
				toast({
					title: `Dog deletion failed`,
					description: `There was an error deleting dog "${deletingDog.givenName}". Please try again.`,
				});
			}
		}

		setDeletingDog(null);
		setIsDeleting(false);
	}

	return (
		<>
			<AlertDialog
				open={!!deletingDog}
				onOpenChange={(value) => {
					if (!value) {
						setDeletingDog(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete this dog and any associated relationships.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={isDeleting} onClick={() => void handleDogDelete()}>
							{isDeleting && <Loader className="mr-2" size="sm" />}
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<DogTableContext.Provider
				value={{
					deletingDog,
					setDeletingDog,
				}}
			>
				<DataTable
					data={dogs}
					columns={dogTableColumns}
					onTableRowClick={(dog) => {
						router.push(`/dogs/${dog.id}`);
					}}
				/>
			</DogTableContext.Provider>
		</>
	);
}

export { DogTable, DogTableContext };
