// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** @type {import("eslint").Linter.Config & { [key:string]: any }} */
const config = {
	root: true,
	overrides: [
		{
			extends: ["plugin:@typescript-eslint/recommended-requiring-type-checking"],
			files: ["*.ts", "*.tsx"],
			parserOptions: {
				project: path.join(__dirname, "tsconfig.json"),
			},
		},
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: path.join(__dirname, "tsconfig.json"),
	},
	plugins: ["@typescript-eslint"],
	extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "plugin:tailwindcss/recommended"],
	rules: {
		"@typescript-eslint/consistent-type-imports": [
			"warn",
			{
				prefer: "type-imports",
				fixStyle: "inline-type-imports",
			},
		],
		"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
		"no-restricted-imports": [
			"error",
			{
				name: "lucide-react",
				message:
					"Icons should be imported from '~/components/ui/icons' instead of 'lucide-react' to ensure consistent styling",
			},
			{
				name: "@heroicons/react/20/solid",
				message:
					"Icons should be imported from '~/components/ui/icons' instead of '@heroicons/react to ensure consistent styling'",
			},
			{
				name: "@heroicons/react/24/solid",
				message:
					"Icons should be imported from '~/components/ui/icons' instead of '@heroicons/react to ensure consistent styling'",
			},
			{
				name: "@heroicons/react/20/outline",
				message:
					"Icons should be imported from '~/components/ui/icons' instead of '@heroicons/react to ensure consistent styling'",
			},
		],
	},
	settings: {
		tailwindcss: {
			cssFiles: ["src/styles/globals.css"],
		},
	},
};

module.exports = config;
