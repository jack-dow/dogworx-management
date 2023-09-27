"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { InsertBookingTypeSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/client-utils";
import { api } from "~/lib/trpc/client";
import { type RouterOutputs } from "~/server";

const ManageBookingTypeFormSchema = InsertBookingTypeSchema.extend({
	name: z.string().max(100).nonempty({ message: "Required" }),
	details: z.string().max(100000, { message: "Details must be less than 100,000 characters long." }).nullable(),
	duration: z.number().nonnegative({
		message: "Duration must be a positive number",
	}),
});

type ManageBookingTypeFormSchema = z.infer<typeof ManageBookingTypeFormSchema>;

type UseManageBookingTypeFormProps = {
	bookingType?: RouterOutputs["app"]["bookingTypes"]["byId"]["data"];
	defaultValues?: Partial<ManageBookingTypeFormSchema>;
	onSubmit?: (data: ManageBookingTypeFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageBookingTypeFormSchema) => void;
};

function useManageBookingTypeForm(props: UseManageBookingTypeFormProps) {
	const isNew = !props.bookingType;

	const { toast } = useToast();

	const result = api.app.bookingTypes.byId.useQuery(
		{ id: props.bookingType?.id ?? "new" },
		{ initialData: { data: props.bookingType }, enabled: !isNew },
	);
	const bookingType = result.data?.data;

	const form = useForm<ManageBookingTypeFormSchema>({
		resolver: zodResolver(ManageBookingTypeFormSchema),
		defaultValues: {
			details: "",
			...props.defaultValues,
			...bookingType,
			id: props.defaultValues?.id || bookingType?.id || generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.bookingTypes.insert.useMutation();
	const updateMutation = api.app.bookingTypes.update.useMutation();

	React.useEffect(() => {
		if (bookingType) {
			form.reset(bookingType, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [bookingType, form]);

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();

		void form.handleSubmit(async (data) => {
			try {
				if (props.onSubmit) {
					await props.onSubmit(data);
				} else if (isNew) {
					await insertMutation.mutateAsync(data);
				} else {
					await updateMutation.mutateAsync(data);
				}

				toast({
					title: `Booking type ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} booking type "${data.name}".`,
				});
				props.onSuccessfulSubmit?.(data);
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Booking ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} the booking type "${
						data.name
					}". Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	return { form, onSubmit };
}

export { type ManageBookingTypeFormSchema, type UseManageBookingTypeFormProps, useManageBookingTypeForm };
