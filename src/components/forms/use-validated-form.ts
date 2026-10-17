"use client";

import * as React from "react";

type Values = Record<string, string>;
type FieldErrors<T extends Values> = Partial<Record<keyof T, string>>;
type Validate<T extends Values, Valid> = (
  values: T,
) => { ok: true; value: Valid } | { ok: false; fieldErrors: FieldErrors<T> };

/**
 * Local form state with inline validation: a field is checked when it loses focus,
 * re-checked as it's edited once it shows an error, and every field is checked on submit.
 */
export function useValidatedForm<T extends Values, Valid>(
  initialValues: T,
  validate: Validate<T, Valid>,
) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<FieldErrors<T>>({});

  function errorsFor(current: T): FieldErrors<T> {
    const result = validate(current);
    return result.ok ? {} : result.fieldErrors;
  }

  function field(name: keyof T & string) {
    return {
      name,
      value: values[name],
      error: errors[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = { ...values, [name]: event.target.value };
        setValues(next);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: errorsFor(next)[name] }));
      },
      onBlur: () => setErrors((prev) => ({ ...prev, [name]: errorsFor(values)[name] })),
    };
  }

  /** Checks every field and shows all errors. Returns the validated value, or `null`. */
  function validateAll(): Valid | null {
    const result = validate(values);
    setErrors(result.ok ? {} : result.fieldErrors);
    return result.ok ? result.value : null;
  }

  /** Shows errors returned by the server next to their fields. */
  function showErrors(fieldErrors: Partial<Record<string, string>>) {
    setErrors((prev) => ({ ...prev, ...fieldErrors }));
  }

  return { field, validateAll, showErrors };
}
