import type { ZodType } from "zod"

import * as stylex from "@stylexjs/stylex"
import { useForm } from "@tanstack/react-form"
import { useId, useState } from "react"

import { Button } from "ui/button"
import { Input } from "ui/input"
import { tokens } from "ui/styles/tokens.stylex"

const styles = stylex.create({
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 500,
  },
  fieldError: {
    minHeight: 24,
    marginBlock: 6,
    fontSize: 12,
  },
  error: {
    padding: 12,
    marginBlock: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--input"],
    borderRadius: 8,
    backgroundColor: tokens["--sidebar"],
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  submit: {
    width: "100%",
  },
})

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
          <div>
            <label {...stylex.props(styles.label)} htmlFor={id}>
              {label}
            </label>
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
            <p
              {...stylex.props(styles.fieldError)}
              id={`${id}-error`}
              aria-live="polite"
            >
              {Array.from(
                new Set(field.state.meta.errors.map((issue) => issue?.message)),
              ).join(" ")}
            </p>
          </div>
        )}
      </form.Field>
      {error ? (
        <p {...stylex.props(styles.error)} role="alert">
          {error}
        </p>
      ) : null}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(pending) => (
          <Button
            type="submit"
            variant="default"
            xstyle={styles.submit}
            disabled={pending}
          >
            {pending ? "Saving…" : submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
