"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Editor } from "@tiptap/react";
import * as chrono from "chrono-node";
import dayjs from "dayjs";
import { useFieldArray, useForm, useFormContext, type Control } from "react-hook-form";
import sanitizeHtml from "sanitize-html";
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
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import {
	CalendarIcon,
	ChevronUpDownIcon,
	EditIcon,
	EllipsisVerticalIcon,
	TrashIcon,
	XIcon,
} from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { useUser } from "~/app/(dashboard)/providers";
import { InsertDogSessionSchema, SelectUserSchema } from "~/db/validation";
import { cn, generateId } from "~/lib/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

type Session = NonNullable<ManageDogFormSchema["sessions"]>[number];

function DogSessionsHistory({
	control,
	existingDogSessions,
}: {
	control: Control<ManageDogFormSchema>;
	existingDogSessions: Array<Session>;
}) {
	const form = useFormContext<ManageDogFormSchema>();
	const sessionHistory = useFieldArray({
		control,
		name: "sessions",
		keyName: "rhf-id",
	});

	const [confirmSessionDelete, setConfirmSessionDelete] = React.useState<string | null>(null);

	function handleDogSessionDelete(sessionId: string) {
		const dogSessionActions = form.getValues("actions.sessions");

		sessionHistory.remove(sessionHistory.fields.findIndex((f) => f.id === sessionId));

		if (dogSessionActions[sessionId]?.type === "INSERT") {
			delete dogSessionActions[sessionId];
		} else {
			dogSessionActions[sessionId] = {
				type: "DELETE",
				payload: sessionId,
			};
		}

		form.setValue("actions.sessions", dogSessionActions);
	}

	function removeSessionFromUnsavedSessions(sessionId: string) {
		const unsavedSessionIds = form.getValues("unsavedSessionIds");
		if (unsavedSessionIds.includes(sessionId)) {
			form.setValue(
				"unsavedSessionIds",
				unsavedSessionIds.filter((i) => i !== sessionId),
			);
		}
	}

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
						handleDogSessionDelete(confirmSessionDelete);
					}
				}}
			/>

			<div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
				<div>
					<h2 className="text-base font-semibold leading-7 text-foreground">Session history</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Keep track of details about this dog&apos;s sessions.
					</p>
				</div>

				<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
					<div className="space-y-8 sm:p-8">
						<EditableSessionDetail
							dogId={form.getValues("id")}
							onSubmit={(session) => {
								removeSessionFromUnsavedSessions(session.id);

								sessionHistory.append(session);

								form.setValue("actions.sessions", {
									...form.getValues("actions.sessions"),
									[session.id]: {
										type: "INSERT",
										payload: session,
									},
								});
							}}
							onDetailsTextChange={(text, id) => {
								const unsavedSessionIds = form.getValues("unsavedSessionIds");
								if (text && !unsavedSessionIds.includes(id)) {
									form.setValue("unsavedSessionIds", [...unsavedSessionIds, id]);
								}

								if (!text) {
									removeSessionFromUnsavedSessions(id);
								}
							}}
						/>

						<div>
							<ul role="list" className="-mb-8">
								{[...sessionHistory.fields]
									.sort((a, b) => b.date.getTime() - a.date.getTime())
									.map((session, index) => {
										return (
											<SessionDetail
												key={session.id}
												dogId={form.getValues("id")}
												session={session}
												isLast={index === sessionHistory.fields.length - 1}
												onUpdate={(updatedSession) => {
													removeSessionFromUnsavedSessions(updatedSession.id);

													const sessionHistoryActions = { ...form.getValues("actions.sessions") };

													sessionHistoryActions[updatedSession.id] = {
														type: "UPDATE",
														payload: updatedSession,
													};

													sessionHistory.update(
														sessionHistory.fields.findIndex((f) => f.id === updatedSession.id),
														updatedSession,
													);

													form.setValue("actions.sessions", sessionHistoryActions);
												}}
												onDelete={() => {
													removeSessionFromUnsavedSessions(session.id);

													if (existingDogSessions.some((s) => s.id === session.id)) {
														setConfirmSessionDelete(session.id);
													} else {
														handleDogSessionDelete(session.id);
													}
												}}
												onDetailsTextChange={(text, id) => {
													const unsavedSessionIds = form.getValues("unsavedSessionIds");
													if (text && !unsavedSessionIds.includes(id)) {
														form.setValue("unsavedSessionIds", [...unsavedSessionIds, id]);
													}

													if (!text) {
														removeSessionFromUnsavedSessions(id);
													}
												}}
												onCancel={() => {
													removeSessionFromUnsavedSessions(session.id);
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
	onDetailsTextChange,
	onUpdate,
	onDelete,
	onCancel,
}: {
	session: Session;
	isLast: boolean;
	dogId: string;
	onDetailsTextChange: (text: string, id: string) => void;
	onUpdate: (session: Session) => void;
	onDelete: () => void;
	onCancel: () => void;
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
							onCancel();
							setIsEditing(false);
						}}
						onSubmit={(session) => {
							setIsEditing(false);
							onUpdate(session);
						}}
						onDetailsTextChange={onDetailsTextChange}
					/>
				) : (
					<div className="relative flex items-start space-x-3">
						<div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-8 ring-white">
							{session.user ? (
								session.user.profileImageUrl ? (
									<Image
										src={session.user.profileImageUrl}
										alt="User's profile image"
										width={128}
										height={128}
										className="aspect-square rounded-full object-cover"
									/>
								) : (
									<>
										{session.user.givenName[0]}
										{session.user.familyName?.[0]}
									</>
								)
							) : (
								<>D</>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div>
								<div className="text-sm">
									<p className="font-medium text-slate-900">{session.user?.name ?? "Deleted User"}</p>
								</div>
								<p className="mt-0.5 text-sm text-slate-500">{dayjs(session.date).format("MMMM D, YYYY")}</p>
							</div>
							<div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: session.details }} />
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
									if (isEditing) {
										onCancel();
									}
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
									onDelete();
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
		.min(1, { message: "Must include some details about this session" })
		.max(100000, { message: "Details must be less than 100,000 characters long." }),
	date: z.date({
		required_error: "Must select a date for this session",
	}),
	user: SelectUserSchema.nullable(),
});
type EditableSessionDetailFormSchema = z.infer<typeof EditableSessionDetailFormSchema>;

type EditableSessionDetailProps =
	| {
			sessionHistory: Session;
			onCancel: () => void;
			onDetailsTextChange: (text: string, id: string) => void;
			onSubmit: (sessionHistory: Session) => void;
			dogId: string;
	  }
	| {
			sessionHistory?: never;
			onCancel?: never;
			onDetailsTextChange: (text: string, id: string) => void;
			onSubmit: (sessionHistory: Session) => void;
			dogId: string;
	  };

function EditableSessionDetail({
	sessionHistory,
	onCancel,
	onSubmit,
	dogId,
	onDetailsTextChange,
}: EditableSessionDetailProps) {
	const user = useUser();

	const [editor, setEditor] = React.useState<Editor | null>(null);

	const form = useForm<EditableSessionDetailFormSchema>({
		resolver: zodResolver(EditableSessionDetailFormSchema),
		defaultValues: {
			id: generateId(),
			dogId,
			details: "",
			date: undefined,
			user: user ?? null,
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
					{user.profileImageUrl ? (
						<Image
							src={user.profileImageUrl}
							alt="User's profile image"
							width={128}
							height={128}
							className="aspect-square rounded-full object-cover"
						/>
					) : (
						<>
							{user.givenName[0]}
							{user.familyName?.[0]}
						</>
					)}
				</div>
				<div className="min-w-0 flex-1 space-y-2">
					<div className="relative">
						<div className="rounded-lg shadow-sm ring-1 ring-inset ring-input focus-within:ring-2 focus-within:ring-indigo-600">
							<Label className="sr-only" htmlFor={sessionHistory?.id ?? "add-session-detail"}>
								Add session details
							</Label>
							<RichTextEditor
								id={sessionHistory?.id ?? "add-session-detail"}
								onEditorChange={setEditor}
								content={sessionHistory?.details ?? ""}
								className="resize-none rounded-b-none border-0 border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
								onTextValueChange={(text) => {
									onDetailsTextChange(text, form.getValues("id"));
								}}
							/>

							{/* Spacer element to match the height of the toolbar */}
							<div aria-hidden="true">
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
														<span className="mr-2 truncate">
															{field.value ? dayjs(field.value).format("MMMM D, YYYY") : "Select a date"}
														</span>
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
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	setIsDatePickerOpen(false);
																}
															}}
														/>
													</div>
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
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

										const text = editor?.getText();

										if (text === "") {
											form.setValue("details", text);
										} else {
											form.setValue("details", sanitizeHtml(editor?.getHTML() ?? ""));
										}

										void form.handleSubmit((data) => {
											onSubmit(data);
											form.reset({
												id: generateId(),
												dogId,
												details: "",
												date: undefined,
												user: user ?? undefined,
												userId: user?.id ?? undefined,
												...sessionHistory,
											});
											editor?.commands.clearContent();
										})(e);
									}}
									size="sm"
								>
									{sessionHistory?.id ? (
										<div>
											Update <span className="hidden md:inline">Session</span>
										</div>
									) : (
										"Add Session"
									)}
								</Button>
							</div>
						</div>
					</div>
					{form.formState.errors?.details && (
						<p className="text-sm font-medium text-destructive">{form.formState.errors?.details?.message}</p>
					)}
					{form.formState.errors?.date && (
						<p className="text-sm font-medium text-destructive">{form.formState.errors?.date?.message}</p>
					)}
				</div>
			</div>
		</Form>
	);
}

export { DogSessionsHistory };
