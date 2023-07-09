"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import * as chrono from "chrono-node";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useFieldArray, useForm, useFormContext, type Control } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import {
	CalendarIcon,
	ChevronUpDownIcon,
	EditIcon,
	EllipsisVerticalIcon,
	TrashIcon,
	UserCircleIcon,
	XIcon,
} from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Textarea } from "~/components/ui/textarea";
import { InsertDogSessionSchema, UserSchema } from "~/api";
import { generateId } from "~/api/utils";
import { cn } from "~/lib/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

type Session = NonNullable<ManageDogFormSchema["sessions"]>[number];

function SessionHistory({ control }: { control: Control<ManageDogFormSchema> }) {
	const { setValue, getValues } = useFormContext<ManageDogFormSchema>();
	const sessionHistory = useFieldArray({
		control,
		name: "sessions",
		keyName: "rhf-id",
	});

	const [confirmSessionDelete, setConfirmSessionDelete] = React.useState<Session | null>(null);

	return (
		<>
			<DestructiveActionDialog
				title="Are you sure?"
				description="Once you save this dog, this session will be permanently deleted."
				open={!!confirmSessionDelete}
				onOpenChange={() => setConfirmSessionDelete(null)}
				actionText="Delete session"
				onConfirm={() => {
					if (confirmSessionDelete) {
						sessionHistory.remove(sessionHistory.fields.findIndex((f) => f.id === confirmSessionDelete.id));
						setValue("actions.sessions", {
							...getValues("actions.sessions"),
							[confirmSessionDelete.id]: {
								type: "DELETE",
								payload: confirmSessionDelete.id,
							},
						});
					}
				}}
			/>

			<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8">
				<div>
					<h2 className="text-base font-semibold leading-7 text-foreground">Session history</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Keep track of details about this dog&apos;s sessions.
					</p>
				</div>

				<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
					<div className="space-y-8 sm:p-8">
						<EditableSessionDetail
							dogId={getValues("id")}
							onSubmit={(sessionDetail) => {
								sessionHistory.append(sessionDetail);

								setValue("actions.sessions", {
									...getValues("actions.sessions"),
									[sessionDetail.id]: {
										type: "INSERT",
										payload: sessionDetail,
									},
								});
							}}
						/>

						<div>
							<ul role="list" className="-mb-8">
								{sessionHistory.fields
									.sort((a, b) => b.date.getTime() - a.date.getTime())
									.map((session, index) => {
										return (
											<SessionDetail
												key={session.id}
												dogId={getValues("id")}
												session={session}
												index={index}
												isLast={index === sessionHistory.fields.length - 1}
												onUpdate={(sessionDetail) => {
													const sessionHistoryActions = { ...getValues("actions.sessions") };

													sessionHistoryActions[sessionDetail.id] = {
														type: "UPDATE",
														payload: sessionDetail,
													};

													sessionHistory.update(index, sessionDetail);

													setValue("actions.sessions", sessionHistoryActions);
												}}
												onDelete={(session) => {
													setConfirmSessionDelete(session);
												}}
											/>
										);
									})}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function SessionDetail({
	session,
	dogId,
	isLast,
	onUpdate,
	onDelete,
}: {
	index: number;
	session: Session;
	isLast: boolean;
	dogId: string;
	onUpdate: (session: Session) => void;
	onDelete: (session: Session) => void;
}) {
	const [isEditing, setIsEditing] = React.useState(false);

	return (
		<li>
			<div className="relative flex justify-between pb-10">
				{!isLast ? (
					<span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
				) : null}
				{isEditing ? (
					<EditableSessionDetail
						dogId={dogId}
						sessionHistory={session}
						onCancel={() => {
							setIsEditing(false);
						}}
						onSubmit={(session) => {
							setIsEditing(false);
							onUpdate(session);
						}}
					/>
				) : (
					<div className="relative flex items-start space-x-3">
						<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-8 ring-white">
							{session.user && session.user.firstName ? (
								session.user.firstName[0]
							) : (
								<UserCircleIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
							)}
							{/* <img
														className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-400 ring-8 ring-white"
														src={activityItem.imageUrl}
														alt=""
													/> */}

							{/* <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
														<ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
													</span> */}
						</div>
						<div className="min-w-0 flex-1">
							<div>
								<div className="text-sm">
									<p className="font-medium text-slate-900">
										{!session.user ? "Unknown" : ""}
										{session.user?.firstName}
										{session.user?.lastName ? ` ${session.user.lastName}` : ""}
									</p>
								</div>
								<p className="mt-0.5 text-sm text-slate-500">{format(session?.date, "MMMM do, yyyy")}</p>
							</div>
							<div className="mt-2 text-sm text-slate-700">
								<p>{session.details}</p>
							</div>
						</div>
					</div>
				)}

				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
								<EllipsisVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[160px]">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									setIsEditing(!isEditing);
								}}
							>
								{isEditing ? (
									<>
										<XIcon className="mr-2 h-4 w-4 text-muted-foreground/70" />
										Cancel edit
									</>
								) : (
									<>
										<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
										Edit
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(session);
								}}
							>
								<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Delete
							</DropdownMenuItem>
							{/* <DropdownMenuItem>
						<CopyIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Make a copy
					</DropdownMenuItem> */}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</li>
	);
}

const EditableSessionDetailFormSchema = InsertDogSessionSchema.extend({
	details: z
		.string()
		.nonempty({ message: "Please enter some details about the session." })
		.max(500, { message: "Details must be less than 500 characters long." }),
	user: UserSchema,
});
type EditableSessionDetailFormSchema = z.infer<typeof EditableSessionDetailFormSchema>;

type EditableSessionDetailProps =
	| {
			sessionHistory: Session;
			onCancel: () => void;
			onSubmit: (sessionHistory: Session) => void;
			dogId: string;
	  }
	| {
			sessionHistory?: never;
			onCancel?: never;
			onSubmit: (sessionHistory: Session) => void;
			dogId: string;
	  };

function EditableSessionDetail({ sessionHistory, onCancel, onSubmit, dogId }: EditableSessionDetailProps) {
	const { user } = useUser();

	const form = useForm<EditableSessionDetailFormSchema>({
		resolver: zodResolver(EditableSessionDetailFormSchema),
		defaultValues: {
			id: generateId(),
			dogId,
			details: "",
			date: new Date(),
			user: user ?? undefined,
			userId: user?.id ?? undefined,
			...sessionHistory,
		},
	});

	const [inputValue, setInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(form.getValues("date"));

	React.useEffect(() => {
		if (user) {
			form.setValue("user", user);
			form.setValue("userId", user?.id);
		}
	}, [form, user]);

	return (
		<Form {...form}>
			<div className={cn("flex flex-1 items-start space-x-4", sessionHistory && "pr-2")}>
				<div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-8 ring-white">
					{user && user.firstName ? (
						user.firstName[0]
					) : (
						<UserCircleIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
					)}
				</div>
				<div className="min-w-0 flex-1 space-y-2">
					<div className="relative">
						<div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-input focus-within:ring-2 focus-within:ring-indigo-600">
							<FormField
								control={form.control}
								name="details"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="sr-only">Add session details</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												rows={3}
												className="resize-none rounded-b-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
												placeholder="Add session details..."
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* Spacer element to match the height of the toolbar */}
							<div aria-hidden="true">
								<div className="py-2">
									<div className="h-9" />
								</div>
								<div className="h-px" />
								<div className="py-2">
									<div className="py-px">
										<div className="h-9" />
									</div>
								</div>
							</div>
						</div>

						<div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
												<PopoverTrigger asChild>
													<Button className="w-full" variant="outline">
														<CalendarIcon className="mr-2 h-4 w-4" />
														<span className="mr-2 truncate">{dayjs(field.value).format("MMMM D, YYYY")}</span>
														<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0">
													<div className="space-y-2 p-3 pb-1">
														<Label htmlFor="session-date-input">Date</Label>
														<Input
															id="session-date-input"
															autoComplete="off"
															value={inputValue}
															onChange={(e) => {
																const val = e.target.value;
																setInputValue(val);

																const date = chrono.parseDate(val) ?? new Date();

																form.setValue("date", date);
																setMonth(date);
															}}
														/>
													</div>
													<Calendar
														mode="single"
														selected={field.value ?? new Date()}
														month={month}
														onMonthChange={setMonth}
														onSelect={(value) => {
															if (value) {
																field.onChange(value);
															}
															setIsDatePickerOpen(false);
															setInputValue("");
														}}
														initialFocus={false}
													/>
												</PopoverContent>
											</Popover>
										</FormControl>
									</FormItem>
								)}
							/>
							<div className="shrink-0 space-x-2.5">
								{sessionHistory && (
									<Button variant="outline" size="sm" onClick={onCancel} className="hidden 2xl:inline-flex">
										Cancel
									</Button>
								)}
								<Button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();

										void form.handleSubmit((data) => {
											onSubmit(data);
											form.reset({
												id: generateId(),
												dogId,
												details: "",
												date: new Date(),
												user: user ?? undefined,
												userId: user?.id ?? undefined,
												...sessionHistory,
											});
										})(e);
									}}
									size="sm"
								>
									{sessionHistory?.id ? (
										<div>
											Update <span className="hidden md:inline">Session</span>
										</div>
									) : (
										"Create Session"
									)}
								</Button>
							</div>
						</div>
					</div>
					{form.formState.errors?.details && (
						<p className="text-sm font-medium text-destructive">{form.formState.errors?.details?.message}</p>
					)}
				</div>
			</div>
		</Form>
	);
}

export { SessionHistory };
