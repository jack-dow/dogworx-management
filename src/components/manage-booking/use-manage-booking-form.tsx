"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useToast } from "~/components/ui/use-toast";
import { useUser } from "~/app/providers";
import { InsertBookingSchema } from "~/db/validation/app";
import { useConfirmPageNavigation } from "~/hooks/use-confirm-page-navigation";
import { api } from "~/lib/trpc/client";
import { generateId, hasTrueValue, logInDevelopment } from "~/lib/utils";
import { type RouterOutputs } from "~/server";

dayjs.extend(customParseFormat);

const ManageBookingFormSchema = InsertBookingSchema;
type ManageBookingFormSchema = z.infer<typeof ManageBookingFormSchema>;

type UseManageBookingFormProps = {
	bookingTypes: RouterOutputs["app"]["bookingTypes"]["all"]["data"];
	booking?: RouterOutputs["app"]["bookings"]["byId"]["data"];
	defaultValues?: Partial<ManageBookingFormSchema>;
	onSubmit?: (data: ManageBookingFormSchema) => Promise<void>;
	onSuccessfulSubmit?: (data: ManageBookingFormSchema) => void;
};

function useManageBookingForm(props: UseManageBookingFormProps) {
	const isNew = !props.booking;

	const user = useUser();
	const { toast } = useToast();

	const result = api.app.bookings.byId.useQuery(
		{ id: props.booking?.id ?? "new" },
		{ initialData: { data: props.booking }, enabled: !isNew },
	);
	const booking = result.data?.data;

	const defaultBookingType = props.bookingTypes.find((bt) => bt.isDefault);

	const form = useForm<ManageBookingFormSchema>({
		resolver: zodResolver(ManageBookingFormSchema),
		defaultValues: {
			duration:
				props.bookingTypes.find(
					(bt) => bt.id === booking?.bookingTypeId || bt.id === props.defaultValues?.bookingTypeId,
				)?.duration ?? 1800,
			details: "",
			...props.defaultValues,
			...booking,
			bookingTypeId: props.defaultValues?.bookingTypeId || booking?.bookingTypeId || (defaultBookingType?.id ?? null),
			assignedToId: props.defaultValues?.assignedToId || booking?.assignedToId || user.id,
			assignedTo: props.defaultValues?.assignedTo || booking?.assignedTo || user,
			id: props.defaultValues?.id || booking?.id || generateId(),
			dogId: props.defaultValues?.dogId ?? booking?.dogId ?? null,
			dog: props.defaultValues?.dog ?? booking?.dog ?? null,
		},
	});

	const isFormDirty = hasTrueValue(form.formState.dirtyFields);
	useConfirmPageNavigation(isFormDirty);

	const insertMutation = api.app.bookings.insert.useMutation();
	const updateMutation = api.app.bookings.update.useMutation();

	React.useEffect(() => {
		if (booking) {
			form.reset(booking, {
				keepDirty: true,
				keepDirtyValues: true,
			});
		}
	}, [booking, form]);

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
