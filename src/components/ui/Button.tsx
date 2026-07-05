import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary:
    "bg-graphite-950 text-white shadow-soft hover:bg-graphite-800 dark:bg-white dark:text-graphite-950 dark:hover:bg-zinc-200",
  secondary:
    "border border-zinc-200 bg-white text-graphite-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
  ghost:
    "text-graphite-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-graphite-950",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-graphite-950",
        variants[variant ?? "primary"],
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

