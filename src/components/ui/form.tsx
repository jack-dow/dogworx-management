import * as React from "react";
import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
	Controller,
	FormProvider,
	useFormContext,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { Label } from "~/components/ui/label";
import { cn } from "~/utils";

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const id = React.useId();

		return (
			<FormItemContext.Provider value={{ id }}>
				<div ref={ref} className={cn("space-y-2", className)} {...props} />
			</FormItemContext.Provider>
		);
	},
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
	const { error, formItemId } = useFormField();
	const formItemContext = React.useContext(FormItemContext);

	if (!formItemContext) {
		throw new Error("<FormLabel /> should be used within <FormItem>");
	}

	return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
	({ ...props }, ref) => {
		const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

		return (
			<Slot
				ref={ref}
				id={formItemId}
				aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
				aria-invalid={!!error}
				{...props}
			/>
		);
	},
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => {
		const { formDescriptionId } = useFormField();

		return (
			<p ref={ref} id={formDescriptionId} className={cn("text-[0.8rem] text-muted-foreground", className)} {...props} />
		);
	},
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, children, ...props }, ref) => {
		const { error, formMessageId } = useFormField();
		let body = children;

		if (error) {
			const message = String(error.message);
			if (message.startsWith("String must contain at least")) {
				const length = parseInt(message.match(/\d+/)?.[0] ?? "-1");
				if (length !== -1) {
					body = `Must be at least ${length} character${length > 1 ? "s" : ""} long`;
				}
			} else if (message.startsWith("String must contain at most")) {
				const length = parseInt(message.match(/\d+/)?.[0] ?? "-1");
				if (length !== -1) {
					body = `Cannot be longer than ${length} character${length > 1 ? "s" : ""}`;
				}
			} else if (message === "Invalid email") {
				body = "Must be a valid email address";
			} else {
				body = message;
			}
		}

		if (!body) {
			return null;
		}

		return (
			<p
				ref={ref}
				id={formMessageId}
				className={cn("text-[0.8rem] font-medium text-destructive", className)}
				{...props}
			>
				{body}
			</p>
		);
	},
);
FormMessage.displayName = "FormMessage";

const formTitleClasses = cn("text-base font-semibold leading-7 text-foreground");
const formDescriptionClasses = cn("text-sm leading-6 text-muted-foreground");

type FormSectionProps = {
	title: string;
	description: string;
	children: React.ReactNode;
};

function FormSection({ title, description, children }: FormSectionProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className={formTitleClasses}>{title}</h2>
				<p className={formDescriptionClasses}>{description}</p>
			</div>
			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
				<div className="sm:p-8">{children}</div>
			</div>
		</div>
	);
}

type FormGroupProps = {
	title?: string;
	description?: string;
	children: React.ReactNode;
};

function FormGroup({ title, description, children }: FormGroupProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:gap-y-6">
			{title && description && (
				<div className="col-span-full">
					<h3 className={formTitleClasses}>{title}</h3>
					<p className={formDescriptionClasses}>{description}</p>
				</div>
			)}
			{children}
		</div>
	);
}

type FormSheetGroupProps = {
	title: string;
	description: string;
	children: React.ReactNode;
};

function FormSheetGroup({ title, description, children }: FormSheetGroupProps) {
	return (
		<div>
			<div>
				<h2 className={formTitleClasses}>{title}</h2>
				<p className={formDescriptionClasses}>{description}</p>
			</div>
			<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">{children}</div>
		</div>
	);
}

export {
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
	FormSection,
	FormGroup,
	FormSheetGroup,
};
