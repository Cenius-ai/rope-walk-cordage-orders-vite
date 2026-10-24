import { useState } from "react";

import {
  FIBRE_OPTIONS,
  INTEGER_FIELDS,
  LAY_OPTIONS,
  NUMERIC_FIELDS,
  ORDER_STATUS_OPTIONS,
  orderPayload,
  toFormValues,
  validateOrder,
} from "../lib/orderValidation.js";
import { SelectField, TextField, TextareaField } from "./Field.jsx";
import Icon from "./Icon.jsx";

const FIELD_ORDER = [
  "customer",
  ...NUMERIC_FIELDS.map((field) => field.name),
  ...INTEGER_FIELDS.map((field) => field.name),
  "notes",
];

export default function OrderForm({
  initial = null,
  submitLabel = "Save order",
  onSubmit,
  onCancel = null,
}) {
  const [values, setValues] = useState(() => toFormValues(initial));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (name) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: undefined } : previous));
  };

  const focusFirstError = (nextErrors) => {
    const first = FIELD_ORDER.find((name) => nextErrors[name]);
    if (first) document.getElementById(`order-${first}`)?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return; // re-entrancy guard: a double click cannot create two orders
    const nextErrors = validateOrder(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      focusFirstError(nextErrors);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(orderPayload(values));
    } catch (error) {
      if (error.fields && Object.keys(error.fields).length) {
        setErrors(error.fields);
        focusFirstError(error.fields);
      }
      setFormError(error.message || "Could not save the order.");
      setBusy(false);
    }
  };

  return (
    <form className="form order-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <TextField
          id="order-customer"
          label="Customer or job"
          wide
          value={values.customer}
          onChange={update("customer")}
          error={errors.customer}
          placeholder="Whitby Harbour Trust"
          autoComplete="off"
          maxLength={120}
          required
        />

        <SelectField
          id="order-fibre_type"
          label="Fibre"
          options={FIBRE_OPTIONS}
          value={values.fibre_type}
          onChange={update("fibre_type")}
          error={errors.fibre_type}
        />

        <SelectField
          id="order-lay_direction"
          label="Lay direction"
          options={LAY_OPTIONS}
          value={values.lay_direction}
          onChange={update("lay_direction")}
          error={errors.lay_direction}
        />

        {NUMERIC_FIELDS.map((field) => (
          <TextField
            key={field.name}
            id={`order-${field.name}`}
            label={`${field.label} (${field.unit})`}
            type="number"
            inputMode={field.inputMode}
            step={field.step}
            min={field.min}
            max={field.max}
            value={values[field.name]}
            onChange={update(field.name)}
            hint={field.hint}
            error={errors[field.name]}
            required
          />
        ))}

        {INTEGER_FIELDS.map((field) => (
          <TextField
            key={field.name}
            id={`order-${field.name}`}
            label={field.label}
            type="number"
            inputMode={field.inputMode}
            step={field.step}
            min={field.min}
            max={field.max}
            value={values[field.name]}
            onChange={update(field.name)}
            hint={field.hint}
            error={errors[field.name]}
            required
          />
        ))}

        <SelectField
          id="order-status"
          label="Status"
          options={ORDER_STATUS_OPTIONS}
          value={values.status}
          onChange={update("status")}
          hint="Confirmed orders are what the run list is generated from."
          error={errors.status}
        />

        <TextareaField
          id="order-notes"
          label="Notes"
          wide
          rows={3}
          value={values.notes}
          onChange={update("notes")}
          error={errors.notes}
          hint="Splicing, finishing or delivery instructions."
          maxLength={2000}
        />
      </div>

      {formError ? (
        <p className="form-error" role="alert">
          <Icon name="alert" />
          {formError}
        </p>
      ) : null}

      <div className="row-actions">
        <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy ? "true" : undefined}>
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
