/* eslint-disable no-restricted-imports */
import {
	AdjustmentsHorizontalIcon,
	ArrowLeftOnRectangleIcon,
	Bars3BottomLeftIcon,
	BarsArrowDownIcon,
	BarsArrowUpIcon,
	CalendarIcon,
	CheckIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpDownIcon,
	ClipboardDocumentIcon,
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
import {
	Square2StackIcon as BookingIcon,
	CalendarDaysIcon,
	UsersIcon as ClientsIcon,
	ReceiptPercentIcon as InvoiceIcon,
	BuildingStorefrontIcon as VetClinicIcon,
	UserGroupIcon as VetsIcon,
} from "@heroicons/react/24/solid";
import { DotFilledIcon } from "@radix-ui/react-icons";

import { cn } from "~/lib/utils";

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

export {
	AppleIcon,
	AdjustmentsHorizontalIcon,
	ArrowLeftOnRectangleIcon as LogOutIcon,
	BarsArrowDownIcon as SortDescIcon,
	BarsArrowUpIcon as SortAscIcon,
	Bars3BottomLeftIcon as MobileMenuIcon,
	BookingIcon,
	CalendarIcon,
	CalendarDaysIcon,
	CheckIcon,
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
	EyeSlashIcon,
	InvoiceIcon,
	PlusIcon,
	TrashIcon,
	UserCircleIcon,
	UserPlusIcon,
	UserIcon,
	VetsIcon,
	VetClinicIcon,
	XMarkIcon as XIcon,
};
