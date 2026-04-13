"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "relative inline-flex items-center rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-gray-400 data-[state=on]:bg-black",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "w-14 h-8",
        sm: "w-12 h-6",
        lg: "w-16 h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const knobVariants = cva(
  "absolute bg-white rounded-full shadow-md transition-transform pointer-events-none",
  {
    variants: {
      size: {
        default: "w-6 h-6 left-1",
        sm: "w-5 h-5 left-0.5",
        lg: "w-7 h-7 left-1.5",
      },
      stateOn: {
        true: "", // We will handle translation via group state below
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      stateOn: false,
    },
  }
);

interface ToggleWithKnobProps
  extends React.ComponentProps<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants>,
    VariantProps<typeof knobVariants> {}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleWithKnobProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleVariants({ variant, size, className }), "group")}
        {...props}
      >
        {/* The knob */}
        <span
          className={cn(
            knobVariants({ size }),
            // Translate knob when toggle is ON using group state selector:
            "group-data-[state=on]:translate-x-6",
            "translate-x-0"
          )}
        />
        {/* Optional children like text or icons */}
        {children}
      </TogglePrimitive.Root>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
