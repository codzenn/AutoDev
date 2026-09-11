import { cn } from "cn"
import { RiLoaderLine } from "@remixicon/react"

type SpinnerProps = React.ComponentProps<typeof RiLoaderLine> & {
  className?: string
}

function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <RiLoaderLine data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
