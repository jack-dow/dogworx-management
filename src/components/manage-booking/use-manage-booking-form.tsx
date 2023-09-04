"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingById, type BookingInsert, type BookingTypesList, type BookingUpdate } from "~/actions";
import { useUser } from "~/app/providers";
import { InsertBookingSchema, SelectDogSchema, SelectUserSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue } from "~/utils";

dayjs.extend(customParseFormat);

const ManageBookingFormSchema = InsertBookingSchema.extend({
	details: z.string().max(100000, { message: "Details must be less than 100,000 characters long." }).nullable(),
	dog: SelectDogSchema.pick({
		id: true,
		givenName: true,
		familyName: true,
	}).nullish(),
	date: z.date(),
	duration: z.number().nonnegative({
		message: "Duration must be a positive number",
	}),
	assignedTo: SelectUserSchema.pick({
		id: true,
		givenName: true,
		familyName: true,
		emailAddress: true,
		organizationId: true,
		organizationRole: true,
		profileImageUrl: true,
	}).nullish(),
}).superRefine((val, ctx) => {
	if (!val.bookingTypeId) {
		if (dayjs(val.date).isBefore(dayjs()) && !val.details) {
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: "Details must be provided for past bookings",
				path: ["details"],
			});
		}
	}
});

// Had to add `Type` suffix because was getting "Cannot access before initialization" error
type ManageBookingFormSchema = z.infer<typeof ManageBookingFormSchema>;

type UseManageBookingFormProps = {
	bookingTypes: BookingTypesList["data"];
	booking?: BookingById;
	defaultValues?: Partial<ManageBookingFormSchema>;
	onSubmit?: (
		data: ManageBookingFormSchema,
	) => Promise<{ success: boolean; data: BookingInsert | BookingUpdate | null | undefined }>;
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
			assignedToId: user.id,
			assignedTo: user,
			details: "",
			bookingTypeId: null,
			dogId: null,
			...props.booking,
			...props.defaultValues,
			id: props.booking?.id ?? generateId(),
		},
	});
	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	React.useEffect(() => {
		function syncBooking(booking: BookingById) {
			form.reset(booking, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}

		if (props.booking) {
			syncBooking(props.booking);
		}
	}, [props.booking, form]);

	async function onSubmit(data: ManageBookingFormSchema) {
		let success = false;
		let newBooking: BookingInsert | BookingUpdate | null | undefined;

		if (props.onSubmit) {
			const response = await props.onSubmit(data);
			success = response.success;
			newBooking = response.data;
			return { success, data: newBooking };
		} else if (props.booking) {
			const response = await actions.app.bookings.update(data);
			success = response.success && !!response.data;
			newBooking = response.data;
		} else {
			const response = await actions.app.bookings.insert(data);
			success = response.success;
			newBooking = response.data;
		}

		if (success) {
			toast({
				title: `Booking ${isNew ? "Created" : "Updated"}`,
				description: `Successfully ${isNew ? "created" : "updated"} booking.`,
			});
		} else {
			toast({
				title: `Booking ${isNew ? "Creation" : "Update"} Failed`,
				description: `There was an error ${isNew ? "creating" : "updating"} the booking. Please try again.`,
				variant: "destructive",
			});
		}

		return { success, data: newBooking };
	}

	return { form, onSubmit };
}

export { type ManageBookingFormSchema, type UseManageBookingFormProps, useManageBookingForm };
