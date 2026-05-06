import type { ComponentType, SVGProps } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  Bars3Icon,
  BoltIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  CreditCardIcon,
  CubeIcon,
  EyeIcon,
  FlagIcon,
  GiftIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  StopIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<string, HeroIcon> = {
  "fa-arrow-left": ArrowLeftIcon,
  "fa-arrow-right": ArrowRightIcon,
  "fa-arrows-rotate": ArrowPathIcon,
  "fa-bag-shopping": BriefcaseIcon,
  "fa-bars": Bars3Icon,
  "fa-bolt": BoltIcon,
  "fa-box-open": CubeIcon,
  "fa-briefcase": BriefcaseIcon,
  "fa-camera": CameraIcon,
  "fa-camera-retro": CameraIcon,
  "fa-check": CheckIcon,
  "fa-chevron-down": ChevronDownIcon,
  "fa-chevron-left": ChevronLeftIcon,
  "fa-chevron-right": ChevronRightIcon,
  "fa-chevron-up": ChevronUpIcon,
  "fa-circle-check": CheckCircleIcon,
  "fa-circle-xmark": XCircleIcon,
  "fa-clock": ClockIcon,
  "fa-couch": HomeIcon,
  "fa-credit-card": CreditCardIcon,
  "fa-eye": EyeIcon,
  "fa-eye-slash": EyeIcon,
  "fa-flag": FlagIcon,
  "fa-flag-checkered": FlagIcon,
  "fa-gavel": SparklesIcon,
  "fa-gem": GiftIcon,
  "fa-hand-holding-dollar": HandRaisedIcon,
  "fa-heart": HeartIcon,
  "fa-house": HomeIcon,
  "fa-laptop": Squares2X2Icon,
  "fa-layer-group": Squares2X2Icon,
  "fa-lock": LockClosedIcon,
  "fa-magnifying-glass": MagnifyingGlassIcon,
  "fa-mobile-screen": DevicePhoneMobileIcon,
  "fa-plus": PlusIcon,
  "fa-scale-balanced": ScaleIcon,
  "fa-shield-halved": ShieldCheckIcon,
  "fa-shirt": TagIcon,
  "fa-sliders": Squares2X2Icon,
  "fa-star": StarIcon,
  "fa-star-half-stroke": StarIcon,
  "fa-stop": StopIcon,
  "fa-table-cells": Squares2X2Icon,
  "fa-tags": TagIcon,
  "fa-truck-fast": TruckIcon,
  "fa-undo": ArrowPathIcon,
  "fa-user": UserIcon,
  "fa-user-plus": UserPlusIcon,
  "fa-users": UserGroupIcon,
  "fa-xmark": XMarkIcon,
};

export type IconProps = {
  name: string;
  className?: string;
  "aria-hidden"?: boolean;
};

export default function Icon({ name, className, "aria-hidden": ariaHidden }: IconProps) {
  const normalizedName = name
    .split(" ")
    .map((token) => token.trim())
    .find((token) => token.startsWith("fa-") && token !== "fa-solid" && token !== "fa-regular");
  const HeroIconComponent = (normalizedName && ICON_MAP[normalizedName]) || QuestionMarkCircleIcon;
  return (
    <HeroIconComponent
      className={`inline-block h-[1.22em] w-[1.22em] shrink-0 align-middle ${className ?? ""}`.trim()}
      aria-hidden={ariaHidden}
    />
  );
}
