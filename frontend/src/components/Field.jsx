/** Labelled form controls with aria wiring for hints and inline errors. */

function describedBy(id, hint, error) {
  const ids = [];
  if (hint) ids.push(`${id}-hint`);
  if (error) ids.push(`${id}-error`);
  return ids.length ? ids.join(" ") : undefined;
}

export function Field({ id, label, hint, error, wide = false, children }) {
  return (
    <div className={`field${error ? " field--invalid" : ""}${wide ? " field--wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ id, label, hint, error, wide, ...inputProps }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} wide={wide}>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...inputProps}
      />
    </Field>
  );
}

export function SelectField({ id, label, hint, error, wide, options, ...selectProps }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} wide={wide}>
      <select
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextareaField({ id, label, hint, error, wide, ...textareaProps }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} wide={wide}>
      <textarea
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...textareaProps}
      />
    </Field>
  );
}
