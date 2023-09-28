import * as React from "react";
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
import { useDayjs } from "~/hooks/use-dayjs";
import { api, type RouterOutputs } from "~/lib/trpc/client";
import { sessionJWTExpiry } from "~/lib/utils";
import { useSession } from "../../../providers";

type Sessions = RouterOutputs["auth"]["user"]["sessions"]["all"]["data"];

function AccountSessions({ initialSessions }: { initialSessions: RouterOutputs["auth"]["user"]["sessions"]["all"] }) {
	const currentSession = useSession();

	const { data } = api.auth.user.sessions.all.useQuery(undefined, {
		initialData: initialSessions,
	});

	const sessions = data.data;

	const activeSession = sessions.find((session) => session.id === currentSession?.id);

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
					{activeSession && <SessionAccordionItem session={activeSession} isCurrentSession />}

					{sessions.map((session) => {
						const isCurrentSession = currentSession?.id === session.id;

						if (isCurrentSession) {
							return null;
						}

						return (
							<SessionAccordionItem
								key={session.id}
								session={session}
								onDelete={() => {
									// void refetch();
								}}
							/>
						);
					})}
				</Accordion>
			</div>
		</div>
	);
}

type SessionAccordionItemProps =
	| {
			session: Sessions[number];
			isCurrentSession: true;
			onDelete?: undefined;
	  }
	| {
			session: Sessions[number];
			isCurrentSession?: false;
			onDelete: (session: Sessions[number]) => void;
	  };

function SessionAccordionItem({ session, isCurrentSession = false, onDelete }: SessionAccordionItemProps) {
	const { toast } = useToast();

	const { dayjs } = useDayjs();

	const [isDeleteSessionConfirmDialogOpen, setIsDeleteSessionConfirmDialogOpen] = React.useState(false);
	const [isDeletingSession, setIsDeletingSession] = React.useState(false);

	const deleteMutation = api.auth.user.sessions.delete.useMutation({
		onSuccess: () => {
			toast({
				title: "Signed session out",
				description: "Successfully signed session/device out of your account.",
			});
			onDelete?.(session);
			setIsDeleteSessionConfirmDialogOpen(false);
		},
		onError: () => {
			toast({
				title: "Failed to sign session out",
				description: "An error occurred while signing the session out of your account. Please try again.",
				variant: "destructive",
			});
		},
		onSettled: () => {
			setIsDeletingSession(false);
		},
	});

	const hasCityOrCountry = session.city || session.country;

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
						{dayjs.tz(session.lastActiveAt).isAfter(dayjs.tz().subtract(sessionJWTExpiry, "seconds")) ||
						isCurrentSession ? (
							<div className="mt-1 flex items-center gap-x-1.5">
								<div className="flex-none rounded-full bg-emerald-500/20 p-1">
									<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
								</div>
								<p className="text-xs leading-5 text-muted-foreground">Online</p>
							</div>
						) : (
							<p className="mt-1 text-xs leading-5 text-muted-foreground">
								Last seen{" "}
								<time dateTime={dayjs.tz(session.lastActiveAt).toISOString()}>
									{dayjs.tz(session.lastActiveAt).fromNow()}
								</time>
							</p>
						)}
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
							<Dialog open={isDeleteSessionConfirmDialogOpen} onOpenChange={setIsDeleteSessionConfirmDialogOpen}>
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
											please contact support.
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsDeleteSessionConfirmDialogOpen(false)}>
											Cancel
										</Button>
										<Button
											variant="destructive"
											disabled={isDeletingSession}
											onClick={(e) => {
												e.preventDefault();
												setIsDeletingSession(true);

												deleteMutation.mutate({ id: session.id });
											}}
										>
											{isDeletingSession && <Loader size="sm" />}
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
