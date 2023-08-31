"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { actions } from "~/actions";
import { DestructiveActionDialog } from "../ui/destructive-action-dialog";
import { useToast } from "../ui/use-toast";
import { type ManageVetFormSchema } from "./use-manage-vet-form";

function VetDeleteDialog({ setOpen }: { setOpen?: (open: boolean) => void }) {
	const router = useRouter();
	const pathname = usePathname();

	const form = useFormContext<ManageVetFormSchema>();
	const { toast } = useToast();
	return (
		<DestructiveActionDialog
			name="vet"
			onConfirm={async () => {
				const result = await actions.app.vets.delete(form.getValues("id"));

				if (result.success) {
					toast({
						title: `Vet deleted`,
						description: `Successfully deleted vet "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}".`,
					});

					if (pathname.startsWith("/vet/")) {
						router.push("/vets");
						return;
					}

					if (setOpen) {
						setOpen(false);
					}
				} else {
					toast({
						title: `Vet deletion failed`,
						description: `There was an error deleting vet "${form.getValues("givenName")}${
							form.getValues("familyName") ? " " + form.getValues("familyName") : ""
						}". Please try again.`,
						variant: "destructive",
					});
				}
			}}
		/>
	);
}

export { VetDeleteDialog };
