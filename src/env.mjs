import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
	shared: {
		VERCEL_URL: z
			.string()
			.optional()
			.transform((v) => (v ? `https://${v}` : undefined)),
		PORT: z.coerce.number().default(3000),
		NEXT_PUBLIC_ADMIN_ORG_ID: z.string().cuid2().length(24),
		NEXT_PUBLIC_DEFAULT_TIMEZONE: z.string().min(1),
	},
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
	 * built with invalid env vars.
	 */
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		CRON_SECRET: z.string().min(1),
		DATABASE_HOST: z.string().min(1),
		DATABASE_USERNAME: z.string().min(1),
		DATABASE_PASSWORD: z.string().min(1),
		DATABASE_NAME: z.string().min(1),
		DATABASE_URL: z.string().url(),
		JWT_SECRET: z.string().min(1),
		RESEND_API_KEY: z.string().min(1),
		AWS_S3_ACCESS_KEY: z.string().min(1),
		AWS_S3_SECRET_KEY: z.string().min(1),
		AWS_S3_BUCKET_NAME: z.string().min(1),
		AWS_S3_REGION: z.string().min(1),
	},
	/**
	 * Specify your client-side environment variables schema here.
	 * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url(),
	},
	/**
	 * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
	 */
	runtimeEnv: {
		VERCEL_URL: process.env.VERCEL_URL,
		PORT: process.env.PORT,
		NEXT_PUBLIC_ADMIN_ORG_ID: process.env.NEXT_PUBLIC_ADMIN_ORG_ID,
		NEXT_PUBLIC_DEFAULT_TIMEZONE: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE,
		NODE_ENV: process.env.NODE_ENV,
		CRON_SECRET: process.env.CRON_SECRET,
		DATABASE_HOST: process.env.DATABASE_HOST,
		DATABASE_USERNAME: process.env.DATABASE_USERNAME,
		DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
		DATABASE_NAME: process.env.DATABASE_NAME,
		DATABASE_URL: process.env.DATABASE_URL,
		JWT_SECRET: process.env.JWT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		AWS_S3_ACCESS_KEY: process.env.AWS_S3_ACCESS_KEY,
		AWS_S3_SECRET_KEY: process.env.AWS_S3_SECRET_KEY,
		AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
		AWS_S3_REGION: process.env.AWS_S3_REGION,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	},
	skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});

export { env };
