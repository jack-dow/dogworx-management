import "next-auth";

import { type InsertUserSchema, type SelectUserSchema } from "~/db/zod-validation";

declare module "next-auth/adapters" {
	interface AdapterUser extends InsertUserSchema {
		name: string;
	}
}

declare module "next-auth" {
	interface User extends SelectUserSchema {
		name: string;
	}

	interface Session {
		user: SelectUserSchema;
	}
}
