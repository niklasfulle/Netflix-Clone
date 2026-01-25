import * as React from "react"
import { cn } from "@/lib/utils"
import {
  PopoverContent as RadixPopoverContent,
} from "@radix-ui/react-popover"

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof RadixPopoverContent>,
  React.ComponentPropsWithoutRef<typeof RadixPopoverContent>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <RadixPopoverContent
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 rounded-md border bg-zinc-800 p-4 text-white shadow-md outline-none animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = "PopoverContent"

export { PopoverContent }
export { PopoverTrigger } from "@radix-ui/react-popover"
export { Popover } from "@radix-ui/react-popover"
