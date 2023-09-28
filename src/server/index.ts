import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { bookingTypesRouter } from "./router/app/booking-types";
import { bookingsRouter } from "./router/app/bookings";
import { clientsRouter } from "./router/app/clients";
import { dogsRouter } from "./router/app/dogs";
import { vetClinicsRouter } from "./router/app/vet-clinics";
import { vetsRouter } from "./router/app/vets";
import { organizationsRouter } from "./router/auth/organizations";
import { sessionsRouter } from "./router/auth/sessions";
import { signInRouter } from "./router/auth/sign-in";
import { userRouter } from "./router/auth/user";
import { createTRPCRouter } from "./trpc";

export { createTRPCContext } from "./trpc";

export const appRouter = createTRPCRouter({
	app: createTRPCRouter({
		bookingTypes: bookingTypesRouter,
		bookings: bookingsRouter,
		clients: clientsRouter,
		dogs: dogsRouter,
		vetClinics: vetClinicsRouter,
		vets: vetsRouter,
	}),
	auth: createTRPCRouter({
		organizations: organizationsRouter,
		sessions: sessionsRouter,
		user: userRouter,
		signIn: signInRouter,
	}),
});
// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
