import type { ZodType } from "zod"

import { useForm } from "@tanstack/react-form"
import { useId, useState } from "react"

import { Button } from "ui/button"
import { Input } from "ui/input"

export function ValueForm({
  label,
  placeholder,
  submitLabel,
  schema,
  onSubmit,
  type = "text",
}: {
  label: string
  placeholder: string
  submitLabel: string
  schema: ZodType<string, string>
  onSubmit: (value: string) => Promise<void>
  type?: "text" | "url"
}) {
  const id = useId()
  const [error, setError] = useState("")

  const form = useForm({
    defaultValues: { value: "" },
    onSubmit: async ({ value }) => {
      setError("")

      try {
        await onSubmit(value.value.trim())
        form.reset()
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not save. Try again.",
        )
      }
    },
  })

  return (
    <form
      className="value-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="value"
        validators={{ onBlur: schema, onSubmit: schema }}
      >
        {(field) => (
          <div className="field">
            <label htmlFor={id}>{label}</label>
            <Input
              id={id}
              type={type}
              placeholder={placeholder}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby={`${id}-error`}
            />
            <p id={`${id}-error`} className="field-error" aria-live="polite">
              {field.state.meta.errors.map((issue) => issue?.message).join(" ")}
            </p>
          </div>
        )}
      </form.Field>
      {error ? (
        <p role="alert" className="error-message">
          {error}
        </p>
      ) : null}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(pending) => (
          <Button type="submit" variant="default" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
