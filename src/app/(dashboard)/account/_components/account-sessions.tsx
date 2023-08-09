import * as React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFieldArray, type Control } from "react-hook-form";
import UAParser from "ua-parser-js";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { actions } from "~/actions";
import { useSession } from "../../providers";
import { type ManageAccountFormSchema } from "./manage-account-form";

dayjs.extend(relativeTime);

function AccountSessions({ control }: { control: Control<ManageAccountFormSchema> }) {
	const currentSession = useSession();

	const sessions = useFieldArray({
		control,
		name: "sessions",
		keyName: "rhf-id",
	});

	const activeSession = sessions.fields.find((session) => session.id === currentSession?.id);

	return (
		<div className="grid grid-cols-1 gap-2 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Sessions</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					These are the sessions/devices that have logged into your account. Click the session to view more information.
				</p>
			</div>
			<div className="xl:col-span-2">
				<Accordion type="single" collapsible className="w-full">
					{activeSession && (
						<SessionAccordion
							session={activeSession}
							isCurrentSession
							onDelete={(session) => {
								sessions.remove(sessions.fields.findIndex((s) => s.id === session.id));
							}}
						/>
					)}

					{sessions.fields
						.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
						.map((session) => {
							const isCurrentSession = currentSession?.id === session.id;

							if (isCurrentSession) {
								return null;
							}

							return (
								<SessionAccordion
									key={session.id}
									session={session}
									onDelete={(session) => {
										sessions.remove(sessions.fields.findIndex((s) => s.id === session.id));
									}}
								/>
							);
						})}
				</Accordion>
			</div>
		</div>
	);
}

function SessionAccordion({
	session,
	isCurrentSession = false,
	onDelete,
}: {
	session: ManageAccountFormSchema["sessions"][number];
	isCurrentSession?: boolean;
	onDelete: (session: ManageAccountFormSchema["sessions"][number]) => void;
}) {
	const [isSignOutConfirmDialogOpen, setIsSignOutConfirmDialogOpen] = React.useState(false);
	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const hasCityOrCountry = session.city || session.country;

	const { toast } = useToast();

	const parsedUA = new UAParser(session.userAgent ?? undefined);
	const os = parsedUA.getOS();
	const browser = parsedUA.getBrowser();

	return (
		<AccordionItem value={session.id}>
			<AccordionTrigger>
				<div className="flex space-x-4">
					<div>
						<p className="text-left">
							{os.name}{" "}
							{hasCityOrCountry
								? `(${session.city ?? ""}${session.city && session.country ? ", " : ""}${session.country ?? ""})`
								: ""}
						</p>
						<p className="text-left text-xs text-muted-foreground">{dayjs(session.updatedAt).fromNow(true)} ago</p>
					</div>
					<div>{isCurrentSession && <Badge>This Session</Badge>}</div>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-semibold">Additional Information</p>
						<p className="text-xs text-muted-foreground">
							Browser: {browser.name} v{browser.version}
						</p>
						<p className="text-xs text-muted-foreground">
							{session.ipAddress ? (
								<>
									IP Address: {session.ipAddress}{" "}
									{hasCityOrCountry
										? `(${session.city ?? ""}${session.city && session.country ? ", " : ""}${session.country ?? ""})`
										: ""}
								</>
							) : (
								"IP Address: Unknown"
							)}
						</p>
					</div>
					<div>
						<p className="text-sm font-medium">{isCurrentSession ? "Current session" : "Sign out"}</p>
						<p className="text-xs text-muted-foreground">
							{isCurrentSession
								? "This is the session you are currently using."
								: "Click the button below to sign this session out of your account. "}
						</p>
						{!isCurrentSession && (
							<Dialog open={isSignOutConfirmDialogOpen} onOpenChange={setIsSignOutConfirmDialogOpen}>
								<DialogTrigger asChild>
									<Button variant="link" className="-ml-4 text-destructive">
										Remove this session
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Are you sure?</DialogTitle>
										<DialogDescription>
											You are about to sign this session out of your account. If you believe this is a suspicious login,
											please reset your password and contact support.
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsSignOutConfirmDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											variant="destructive"
											disabled={isSigningOut}
											onClick={(e) => {
												e.preventDefault();
												setIsSigningOut(true);

												actions.auth.sessions
													.invalidate(session.id)
													.then(() => {
														toast({
															title: "Signed out session",
															description: "Successfully signed session/ out of your account.",
														});
														onDelete(session);
														setIsSignOutConfirmDialogOpen(false);
													})
													.catch(() => {
														toast({
															title: "Failed to sign session out",
															description:
																"An error occurred while signing the session out of your account. Please try again later.",
														});
													})
													.finally(() => {
														setIsSigningOut(false);
													});
											}}
										>
											{isSigningOut && <Loader size="sm" />}
											<span>Sign session out</span>
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

export { AccountSessions };
