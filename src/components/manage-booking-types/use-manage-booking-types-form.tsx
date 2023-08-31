"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingTypeById, type BookingTypeInsert, type BookingTypeUpdate } from "~/actions";
import { InsertBookingTypeSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue } from "~/utils";

dayjs.extend(customParseFormat);

const ManageBookingTypeFormSchema = InsertBookingTypeSchema.extend({
	name: z.string().max(100).nonempty({ message: "Required" }),
	details: z.string().max(100000, { message: "Details must be less than 100,000 characters long." }).nullable(),
	duration: z.number().nonnegative({
		message: "Duration must be a positive number",
	}),
});

// Had to add `Type` suffix because was getting "Cannot access before initialization" error
type ManageBookingTypeFormSchema = z.infer<typeof ManageBookingTypeFormSchema>;

type UseManageBookingTypeFormProps = {
	bookingType?: BookingTypeById;
	defaultValues?: Partial<ManageBookingTypeFormSchema>;
	onSubmit?: (
		data: ManageBookingTypeFormSchema,
	) => Promise<{ success: boolean; data: BookingTypeInsert | BookingTypeUpdate | null | undefined }>;
};

function useManageBookingTypeForm(props: UseManageBookingTypeFormProps) {
	const isNew = !props.bookingType;

	const { toast } = useToast();

	const form = useForm<ManageBookingTypeFormSchema>({
		resolver: zodResolver(ManageBookingTypeFormSchema),
		defaultValues: {
			details: "",
			...props.bookingType,
			...props.defaultValues,
			id: props.bookingType?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		function syncBookingType(booking: BookingTypeById) {
			form.reset(booking, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}

		if (props.bookingType) {
			syncBookingType(props.bookingType);
		}
	}, [props.bookingType, form]);

	async function onSubmit(data: ManageBookingTypeFormSchema) {
		let success = false;
		let newBookingType: BookingTypeInsert | BookingTypeUpdate | null | undefined;

		if (props.onSubmit) {
			const response = await props.onSubmit(data);
			success = response.success;
			newBookingType = response.data;
			return { success, data: newBookingType };
		} else if (props.bookingType) {
			const response = await actions.app.bookingTypes.update(data);
			success = response.success && !!response.data;
			newBookingType = response.data;
		} else {
			const response = await actions.app.bookingTypes.insert(data);
			success = response.success;
			newBookingType = response.data;
		}

		if (success) {
			toast({
				title: `Booking type ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} booking.`,
			});
		} else {
			toast({
				title: `Booking type ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} the booking. Please try again.`,
				variant: "destructive",
			});
		}

		return { success, data: newBookingType };
	}

	return { form, onSubmit };
}

export { type ManageBookingTypeFormSchema, type UseManageBookingTypeFormProps, useManageBookingTypeForm };
