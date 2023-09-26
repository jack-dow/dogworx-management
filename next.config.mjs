import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	images: {
		domains: [
			"dogworx-management-dev.s3.ap-southeast-2.amazonaws.com",
			"dogworx-management.s3.ap-southeast-2.amazonaws.com",
		],
	},
};
export default withBundleAnalyzer(config);
