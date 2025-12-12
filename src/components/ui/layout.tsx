import * as React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page container with standard padding and spacing
 * Replaces: container mx-auto p-6 space-y-6
 */
export const PageContainer = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("container mx-auto p-6 space-y-6", className)}>
      {children}
    </div>
  )
);
PageContainer.displayName = "PageContainer";

/**
 * Form wrapper with background, padding, and border
 * Replaces: bg-background p-6 rounded-lg border
 */
export const FormWrapper = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("bg-background p-6 rounded-lg border", className)}>
      {children}
    </div>
  )
);
FormWrapper.displayName = "FormWrapper";

/**
 * Form section with card background
 * Replaces: space-y-6 p-6 border rounded-lg bg-card
 */
export const FormSection = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("space-y-6 p-6 border rounded-lg bg-card", className)}>
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";

/**
 * Two-column responsive grid
 * Replaces: grid grid-cols-1 lg:grid-cols-2 gap-6
 */
export const TwoColumnGrid = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {children}
    </div>
  )
);
TwoColumnGrid.displayName = "TwoColumnGrid";

/**
 * Field row for horizontal alignment
 * Replaces: flex items-center gap-4
 */
export const FieldRow = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-4", className)}>
      {children}
    </div>
  )
);
FieldRow.displayName = "FieldRow";

/**
 * Form button row with responsive layout
 * Replaces: flex flex-col gap-2 sm:flex-row sm:justify-end
 */
export const FormButtonRow = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2 sm:flex-row sm:justify-end", className)}>
      {children}
    </div>
  )
);
FormButtonRow.displayName = "FormButtonRow";

/**
 * Spacer for vertical spacing within forms
 * Replaces: space-y-4, space-y-6
 */
interface SpacerProps extends LayoutProps {
  size?: "sm" | "md" | "lg";
}

export const FormSpacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ children, className, size = "md" }, ref) => {
    const sizeClasses = {
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
    };
    return (
      <div ref={ref} className={cn(sizeClasses[size], className)}>
        {children}
      </div>
    );
  }
);
FormSpacer.displayName = "FormSpacer";
