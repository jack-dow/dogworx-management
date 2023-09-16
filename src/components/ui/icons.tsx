/* eslint-disable no-restricted-imports */
import {
	AdjustmentsHorizontalIcon,
	ArrowLeftOnRectangleIcon,
	ArrowsUpDownIcon,
	Bars3BottomLeftIcon,
	BarsArrowDownIcon,
	BarsArrowUpIcon,
	BuildingOffice2Icon,
	CalendarIcon,
	CheckIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpDownIcon,
	ClipboardDocumentIcon,
	ClockIcon,
	EllipsisVerticalIcon,
	EnvelopeIcon,
	EyeIcon,
	EyeSlashIcon,
	MagnifyingGlassIcon,
	PencilSquareIcon,
	PhoneIcon,
	PlusIcon,
	TrashIcon,
	UserCircleIcon,
	UserIcon,
	UserPlusIcon,
	XMarkIcon,
} from "@heroicons/react/20/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
	Square2StackIcon as BookingIcon,
	CalendarDaysIcon,
	UsersIcon as ClientsIcon,
	ReceiptPercentIcon as InvoiceIcon,
	Cog6ToothIcon as SettingsIcon,
	BuildingStorefrontIcon as VetClinicIcon,
} from "@heroicons/react/24/solid";
import { DotFilledIcon } from "@radix-ui/react-icons";

import { cn } from "~/lib/client-utils";

type IconProps = {
	className: string;
};

const GoogleIcon = ({ className, ...props }: IconProps) => (
	<svg
		aria-hidden="true"
		focusable="false"
		data-prefix="fab"
		data-icon="discord"
		role="img"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 488 512"
		className={cn(className)}
		{...props}
	>
		<path
			fill="currentColor"
			d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
		></path>
	</svg>
);
const AppleIcon = ({ className, ...props }: IconProps) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className={cn(className)} {...props}>
		<path
			fill="currentColor"
			d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
		/>
	</svg>
);

const DogIcon = ({ className, ...props }: IconProps) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		className={cn("h-6 w-6", className)}
		{...props}
	>
		<path
			d="M12.5557 7.91654L13.418 2.7391C13.4889 2.31356 13.8585 2 14.2915 2C14.5715 2 14.8328 2.13065 15.0007 2.35462L15.6316 3.19451H17.5764C18.0505 3.19451 18.5059 3.38488 18.8418 3.72084L19.5137 4.38901H21.6041C22.1006 4.38901 22.5 4.78843 22.5 5.2849V6.18078C22.5 7.83069 21.1636 9.16704 19.5137 9.16704H18.3192H17.722H16.9269L16.7365 10.3056L12.5557 7.91654ZM16.5275 11.5598V19.9176C16.5275 20.5783 15.9937 21.1121 15.333 21.1121H14.1384C13.4777 21.1121 12.9439 20.5783 12.9439 19.9176V15.6174C12.0481 16.0765 11.0327 16.3341 9.95767 16.3341C8.88262 16.3341 7.86728 16.0765 6.9714 15.6174V19.9176C6.9714 20.5783 6.43761 21.1121 5.7769 21.1121H4.58239C3.92168 21.1121 3.38788 20.5783 3.38788 19.9176V11.3246C2.31283 10.9177 1.46921 10.0069 1.17804 8.84229L1.0362 8.2637C0.875684 7.62538 1.2639 6.97587 1.90595 6.81536C2.54799 6.65485 3.19378 7.04306 3.35429 7.68511L3.49987 8.2637C3.63052 8.79376 4.10832 9.16704 4.65705 9.16704H5.7769H6.37415H12.3392L16.5275 11.5598ZM18.3192 4.98627C18.3192 4.82787 18.2563 4.67595 18.1443 4.56395C18.0323 4.45194 17.8804 4.38901 17.722 4.38901C17.5636 4.38901 17.4117 4.45194 17.2996 4.56395C17.1876 4.67595 17.1247 4.82787 17.1247 4.98627C17.1247 5.14467 17.1876 5.29658 17.2996 5.40859C17.4117 5.5206 17.5636 5.58352 17.722 5.58352C17.8804 5.58352 18.0323 5.5206 18.1443 5.40859C18.2563 5.29658 18.3192 5.14467 18.3192 4.98627Z"
			fillRule="evenodd"
		/>
	</svg>
);

// SEE: https://phosphoricons.com/
function BoldIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<path
				d="M72,120h80a40,40,0,0,1,0,80H72V48h68a36,36,0,0,1,0,72"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function ItalicIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="152"
				y1="56"
				x2="104"
				y2="200"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="64"
				y1="200"
				x2="144"
				y2="200"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="112"
				y1="56"
				x2="192"
				y2="56"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function UnderlineIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="64"
				y1="224"
				x2="192"
				y2="224"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M184,56v80a56,56,0,0,1-112,0V56"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function StrikethroughIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="40"
				y1="128"
				x2="216"
				y2="128"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M76.33,96a25.71,25.71,0,0,1-1.22-8c0-22.09,22-40,52.89-40,23,0,40.24,9.87,48,24"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M72,168c0,22.09,25.07,40,56,40s56-17.91,56-40c0-23.77-21.62-33-45.6-40"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function TextH1Icon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="40"
				y1="56"
				x2="40"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="116"
				x2="40"
				y2="116"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="56"
				x2="144"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<polyline
				points="224 208 224 112 200 128"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function TextH2Icon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="40"
				y1="56"
				x2="40"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="116"
				x2="40"
				y2="116"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="56"
				x2="144"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M240,208H192l43.17-57.56A24,24,0,1,0,193.37,128"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function TextH3Icon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="40"
				y1="56"
				x2="40"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="116"
				x2="40"
				y2="116"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="144"
				y1="56"
				x2="144"
				y2="176"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M192,112h48l-28,40a28,28,0,1,1-20,47.6"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function ListBulletsIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="88"
				y1="64"
				x2="216"
				y2="64"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="88"
				y1="128"
				x2="216"
				y2="128"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="88"
				y1="192"
				x2="216"
				y2="192"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<circle cx="44" cy="64" r="12" />
			<circle cx="44" cy="128" r="12" />
			<circle cx="44" cy="192" r="12" />
		</svg>
	);
}
function ListNumbersIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="104"
				y1="128"
				x2="216"
				y2="128"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="104"
				y1="64"
				x2="216"
				y2="64"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="104"
				y1="192"
				x2="216"
				y2="192"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<polyline
				points="56 104 56 40 40 48"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M72,208H40l28.68-38.37a15.69,15.69,0,0,0-3.24-22.41,16.78,16.78,0,0,0-23.06,3.15,15.85,15.85,0,0,0-2.38,4.3"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function TextAlignLeftIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="40"
				y1="64"
				x2="216"
				y2="64"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="40"
				y1="104"
				x2="168"
				y2="104"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="40"
				y1="144"
				x2="216"
				y2="144"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="40"
				y1="184"
				x2="168"
				y2="184"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function CodeIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<polyline
				points="64 88 16 128 64 168"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<polyline
				points="192 88 240 128 192 168"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="160"
				y1="40"
				x2="96"
				y2="216"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function TextTIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<line
				x1="128"
				y1="56"
				x2="128"
				y2="200"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<polyline
				points="56 88 56 56 200 56 200 88"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<line
				x1="96"
				y1="200"
				x2="160"
				y2="200"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function CheckSquareIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<polyline
				points="88 136 112 160 168 104"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<rect
				x="40"
				y="40"
				width="176"
				height="176"
				rx="8"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function QuotesIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
			<rect width="256" height="256" fill="none" />
			<path
				d="M108,144H40a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
			<path
				d="M224,144H156a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="16"
			/>
		</svg>
	);
}
function PackageIcon({ className }: { className: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className} fill="currentColor">
			<rect width="256" height="256" fill="none" />
			<path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.35,44L178.57,92.29l-80.35-44Zm0,88L47.65,76,81.56,57.43l80.35,44Zm88,55.85h0l-80,43.79V133.83l32-17.51V152a8,8,0,0,0,16,0V107.56l32-17.51v85.76Z" />
		</svg>
	);
}

function VetsIcon({ className }: { className: string }) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clipPath="url(#clip0_503_6)">
				<path d="M11.5 11.8571C12.9397 11.8571 14.3205 11.2852 15.3386 10.2672C16.3566 9.2491 16.9286 7.86832 16.9286 6.42857C16.9286 4.98882 16.3566 3.60805 15.3386 2.58999C14.3205 1.57194 12.9397 1 11.5 1C10.0603 1 8.67947 1.57194 7.66142 2.58999C6.64337 3.60805 6.07143 4.98882 6.07143 6.42857C6.07143 7.86832 6.64337 9.2491 7.66142 10.2672C8.67947 11.2852 10.0603 11.8571 11.5 11.8571ZM7.42857 14.1982C4.29018 15.1185 2 18.0194 2 21.4547C2 22.1502 2.56406 22.7143 3.2596 22.7143H19.7404C20.4359 22.7143 21 22.1502 21 21.4547C21 18.0194 18.7098 15.1185 15.5714 14.1982V16.3527C16.742 16.6538 17.6071 17.7183 17.6071 18.9821V20.6786C17.6071 21.0518 17.3018 21.3571 16.9286 21.3571H16.25C15.8768 21.3571 15.5714 21.0518 15.5714 20.6786C15.5714 20.3054 15.8768 20 16.25 20V18.9821C16.25 18.2315 15.6435 17.625 14.8929 17.625C14.1422 17.625 13.5357 18.2315 13.5357 18.9821V20C13.9089 20 14.2143 20.3054 14.2143 20.6786C14.2143 21.0518 13.9089 21.3571 13.5357 21.3571H12.8571C12.4839 21.3571 12.1786 21.0518 12.1786 20.6786V18.9821C12.1786 17.7183 13.0438 16.6538 14.2143 16.3527V13.931C13.9598 13.9056 13.7011 13.8929 13.4382 13.8929H9.56183C9.29888 13.8929 9.04018 13.9056 8.78571 13.931V16.7047C9.7654 16.9973 10.4821 17.9049 10.4821 18.9821C10.4821 20.2926 9.41763 21.3571 8.10714 21.3571C6.79665 21.3571 5.73214 20.2926 5.73214 18.9821C5.73214 17.9049 6.44888 16.9973 7.42857 16.7047V14.1982ZM8.10714 20C8.3771 20 8.63599 19.8928 8.82688 19.7019C9.01776 19.511 9.125 19.2521 9.125 18.9821C9.125 18.7122 9.01776 18.4533 8.82688 18.2624C8.63599 18.0715 8.3771 17.9643 8.10714 17.9643C7.83719 17.9643 7.57829 18.0715 7.38741 18.2624C7.19652 18.4533 7.08929 18.7122 7.08929 18.9821C7.08929 19.2521 7.19652 19.511 7.38741 19.7019C7.57829 19.8928 7.83719 20 8.10714 20Z" />
			</g>
			<defs>
				<clipPath id="clip0_503_6">
					<rect width="19" height="21.7143" fill="white" transform="translate(2 1)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	StrikethroughIcon,
	TextAlignLeftIcon,
	TextH1Icon,
	TextH2Icon,
	TextH3Icon,
	ListBulletsIcon,
	ListNumbersIcon,
	QuotesIcon,
	CodeIcon,
	TextTIcon,
	CheckSquareIcon,
	AppleIcon,
	AdjustmentsHorizontalIcon,
	ArrowLeftOnRectangleIcon as LogOutIcon,
	ArrowsUpDownIcon as SortIcon,
	BarsArrowDownIcon as SortDescIcon,
	BarsArrowUpIcon as SortAscIcon,
	Bars3BottomLeftIcon as MobileMenuIcon,
	BuildingOffice2Icon as BuildingOfficeIcon,
	BookingIcon,
	CalendarIcon,
	CalendarDaysIcon,
	CheckIcon,
	ClockIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronDownIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronUpDownIcon,
	ClientsIcon,
	DotFilledIcon,
	DogIcon,
	GoogleIcon,
	MagnifyingGlassIcon,
	ClipboardDocumentIcon as CopyIcon,
	PencilSquareIcon as EditIcon,
	PhoneIcon,
	EllipsisVerticalIcon,
	EnvelopeIcon,
	EyeIcon,
	ExclamationTriangleIcon,
	EyeSlashIcon,
	InvoiceIcon,
	PlusIcon,
	TrashIcon,
	UserCircleIcon,
	UserPlusIcon,
	UserIcon,
	PackageIcon,
	VetsIcon,
	SettingsIcon,
	VetClinicIcon,
	XMarkIcon as XIcon,
};
