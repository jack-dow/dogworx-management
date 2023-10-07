"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormProps } from "react-hook-form";
import { type z, type ZodType } from "zod";

export function useZodForm<TSchema extends ZodType>(
	props: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & {
		schema: TSchema;
	},
) {
	const form = useForm<z.infer<TSchema>>({
		...props,
		resolver: zodResolver(props.schema, undefined),
	});

	return form;
}
