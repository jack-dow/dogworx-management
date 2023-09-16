"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { InsertBookingSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { api } from "~/lib/trpc/client";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

dayjs.extend(customParseFormat);

const ManageBookingFormSchema = InsertBookingSchema.extend({
	details: z.string().max(100000, { message: "Details must be less than 100,000 characters long." }).nullable(),
	duration: z.number().nonnegative({
		message: "Duration must be a positive number",
	}),
});
type ManageBookingFormSchema = z.infer<typeof ManageBookingFormSchema>;

type UseManageBookingFormProps = {
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
	booking?: InsertBookingSchema;
	defaultValues?: Partial<ManageBookingFormSchema>;
	onSubmit?: (data: ManageBookingFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageBookingFormSchema) => void;
};

function useManageBookingForm(props: UseManageBookingFormProps) {
	const isNew = !props.booking;

	const user = useUser();
	const { toast } = useToast();

	const form = useForm<ManageBookingFormSchema>({
		resolver: zodResolver(ManageBookingFormSchema),
		defaultValues: {
			duration:
				props.bookingTypes.find(
					(bt) => bt.id === props.booking?.bookingTypeId || bt.id === props.defaultValues?.bookingTypeId,
				)?.duration ?? 1800,
			details: "",
			bookingTypeId: null,
			dogId: null,
			dog: null,
			...props.defaultValues,
			...props.booking,
			assignedToId: props.defaultValues?.assignedToId || props.booking?.assignedToId || user.id,
			assignedTo: props.defaultValues?.assignedTo || props.booking?.assignedTo || user,
			id: props.defaultValues?.id || props.booking?.id || generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.bookings.insert.useMutation();
	const updateMutation = api.app.bookings.update.useMutation();

	React.useEffect(() => {
		if (props.booking) {
			form.reset(props.booking, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [props.booking, form]);

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
					title: `Booking ${isNew ? "Created" : "Updated"}`,
					description: `Successfully ${isNew ? "created" : "updated"} booking.`,
				});
				props.onSuccessfulSubmit?.(data);
			} catch (error) {
				logInDevelopment(error);

				toast({
					title: `Booking ${isNew ? "Creation" : "Update"} Failed`,
					description: `There was an error ${isNew ? "creating" : "updating"} the booking. Please try again.`,
					variant: "destructive",
				});
			}
		})(e);
	}

	return { form, onSubmit };
}

export { type ManageBookingFormSchema, type UseManageBookingFormProps, useManageBookingForm };
