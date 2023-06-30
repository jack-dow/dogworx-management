/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/
/** @typedef  {import("prettier").Config} PrettierConfig*/
/** @typedef  {{ tailwindConfig: string }} TailwindConfig*/

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
	printWidth: 120,
	trailingComma: "all",
	plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-packagejson"],
	importOrder: [
		"^(react/(.*)$)|^(react$)",
		"^(next/(.*)$)|^(next$)",
		"<THIRD_PARTY_MODULES>",
		"",
		"^~/utils/(.*)$",
		"^~/components/(.*)$",
		"^~/styles/(.*)$",
		"^~/(.*)$",
		"^[./]",
	],
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderTypeScriptVersion: "5.0.4",
	useTabs: true,
};

module.exports = config;
