import { Button as ButtonPrimitive } from "@base-ui/react/button"

export function Button({
  className = "",
  ...props
}: Omit<ButtonPrimitive.Props, "className"> & { className?: string }) {
  return <ButtonPrimitive className={`button ${className}`} {...props} />
}
