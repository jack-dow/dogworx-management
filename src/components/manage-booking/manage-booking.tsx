"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "~/components/ui/form";
import { useToast } from "~/components/ui/use-toast";
import { actions, type BookingById, type BookingInsert, type BookingUpdate } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { InsertBookingSchema, SelectDogSchema, SelectUserSchema } from "~/db/validation";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { generateId, hasTrueValue } from "~/utils";
import { ManageBookingDialog, type ManageBookingDialogProps } from "./manage-booking-dialog";
import { ManageBookingForm, type ManageBookingFormProps } from "./manage-booking-form";

dayjs.extend(customParseFormat);

const ManageBookingFormSchema = InsertBookingSchema.extend({
	details: z.string().max(100000, { message: "Details must be less than 100,000 characters long." }).nullable(),
	dogId: z.string({
		required_error: "Must select a dog for this booking",
	}),
	dog: SelectDogSchema.pick({
		id: true,
		givenName: true,
		familyName: true,
	}).nullish(),
	date: z.date({
		required_error: "Must select a date for this booking",
	}),
	duration: z
		.number({
			required_error: "Must provide a duration for this booking",
		})
		.positive({
			message: "Duration must be a positive number",
		}),
	createdBy: SelectUserSchema.pick({
		id: true,
		givenName: true,
		familyName: true,
		emailAddress: true,
		organizationId: true,
		organizationRole: true,
		profileImageUrl: true,
	}).nullish(),
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
});

// Had to add `Type` suffix because was getting "Cannot access before initialization" error
type ManageBookingFormSchemaType = z.infer<typeof ManageBookingFormSchema>;

type ManageBookingProps<
	VariantType extends "dialog" | "form",
	BookingProp extends BookingById | undefined,
> = VariantType extends "dialog"
	? Omit<ManageBookingDialogProps<BookingProp>, "onSubmit"> & {
			variant: VariantType;
			onSubmit?: ManageBookingDialogProps<BookingProp>["onSubmit"];
	  }
	: Omit<ManageBookingFormProps, "onSubmit"> & { variant: VariantType };

function ManageBooking<VariantType extends "dialog" | "form", BookingProp extends BookingById | undefined>(
	props: ManageBookingProps<VariantType, BookingProp>,
) {
	const isNew = !props.booking;

	const user = useUser();

	const { toast } = useToast();

	const form = useForm<ManageBookingFormSchemaType>({
		resolver: zodResolver(ManageBookingFormSchema),
		defaultValues: {
			id: props.booking?.id || generateId(),
			createdById: user.id,
			createdBy: user,
			details: "",
			...props.booking,
			dogId: props.booking?.dogId || props.dog?.id || undefined,
			dog: props.dog,
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

	React.useEffect(() => {
		if (props.defaultValues) {
			form.reset({
				...form.getValues(),
				...props.defaultValues,
				id: generateId(),
			});
		}
	}, [props.defaultValues, form]);

	async function onSubmit(data: ManageBookingFormSchemaType) {
		let success = false;
		let newBooking: BookingInsert | BookingUpdate | null | undefined;

		if (props.booking) {
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

	return (
		<Form {...form}>
			{props.variant === "dialog" ? (
				<ManageBookingDialog {...props} onSubmit={props.onSubmit ?? onSubmit} />
			) : (
				<ManageBookingForm {...props} onSubmit={onSubmit} />
			)}
		</Form>
	);
}

export { type ManageBookingFormSchemaType, ManageBooking };
