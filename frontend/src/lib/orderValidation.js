/** Order form shape, validation and payload building — shared by create/edit. */

export const FIBRE_OPTIONS = [
  { value: "hemp", label: "Hemp" },
  { value: "sisal", label: "Sisal" },
];

export const LAY_OPTIONS = [
  { value: "Z", label: "Z — right-hand lay" },
  { value: "S", label: "S — left-hand lay" },
];

export const ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "complete", label: "Complete" },
];

export const NUMERIC_FIELDS = [
  {
    name: "lay_length_mm",
    label: "Lay length",
    unit: "mm",
    min: 0.1,
    max: 500,
    step: "0.1",
    inputMode: "decimal",
    hint: "One full turn of the strand, centre to centre.",
  },
  {
    name: "diameter_mm",
    label: "Rope diameter",
    unit: "mm",
    min: 0.1,
    max: 200,
    step: "0.1",
    inputMode: "decimal",
    hint: "Finished diameter once laid.",
  },
  {
    name: "length_m",
    label: "Finished length",
    unit: "m",
    min: 0.1,
    max: 20000,
    step: "0.1",
    inputMode: "decimal",
    hint: "Length of one finished rope.",
  },
];

export const INTEGER_FIELDS = [
  {
    name: "strand_count",
    label: "Strand count",
    min: 1,
    max: 12,
    step: "1",
    inputMode: "numeric",
    hint: "Three-strand is standard; four-strand for heavier work.",
  },
  {
    name: "quantity",
    label: "Quantity",
    min: 1,
    max: 100,
    step: "1",
    inputMode: "numeric",
    hint: "How many ropes of this spec.",
  },
];

export const ORDER_DEFAULTS = {
  customer: "",
  fibre_type: "hemp",
  strand_count: "3",
  lay_direction: "Z",
  lay_length_mm: "36",
  diameter_mm: "20",
  length_m: "120",
  quantity: "1",
  status: "draft",
  notes: "",
};

export function toFormValues(order) {
  if (!order) return { ...ORDER_DEFAULTS };
  return {
    customer: order.customer ?? "",
    fibre_type: order.fibre_type ?? "hemp",
    strand_count: String(order.strand_count ?? ""),
    lay_direction: order.lay_direction ?? "Z",
    lay_length_mm: String(order.lay_length_mm ?? ""),
    diameter_mm: String(order.diameter_mm ?? ""),
    length_m: String(order.length_m ?? ""),
    quantity: String(order.quantity ?? "1"),
    status: order.status ?? "draft",
    notes: order.notes ?? "",
  };
}

export function validateOrder(values) {
  const errors = {};
  const customer = String(values.customer || "").trim();
  if (!customer) errors.customer = "Name the customer or job.";
  else if (customer.length < 2) errors.customer = "Use at least 2 characters.";

  for (const field of NUMERIC_FIELDS) {
    const raw = String(values[field.name] ?? "").trim();
    const number = Number(raw);
    if (!raw) errors[field.name] = `${field.label} is required (${field.unit}).`;
    else if (!Number.isFinite(number)) errors[field.name] = `${field.label} must be a number.`;
    else if (number < field.min)
      errors[field.name] = `${field.label} must be more than ${field.min} ${field.unit}.`;
    else if (number > field.max)
      errors[field.name] = `${field.label} must be ${field.max} ${field.unit} or less.`;
  }

  for (const field of INTEGER_FIELDS) {
    const raw = String(values[field.name] ?? "").trim();
    const number = Number(raw);
    if (!raw) errors[field.name] = `${field.label} is required.`;
    else if (!Number.isInteger(number))
      errors[field.name] = `${field.label} must be a whole number.`;
    else if (number < field.min || number > field.max)
      errors[field.name] = `${field.label} must be between ${field.min} and ${field.max}.`;
  }

  if (String(values.notes || "").length > 2000) {
    errors.notes = "Keep notes under 2000 characters.";
  }

  return errors;
}

export function orderPayload(values) {
  const notes = String(values.notes || "").trim();
  return {
    customer: String(values.customer || "").trim(),
    fibre_type: values.fibre_type,
    strand_count: Number.parseInt(values.strand_count, 10),
    lay_direction: values.lay_direction,
    lay_length_mm: Number.parseFloat(values.lay_length_mm),
    diameter_mm: Number.parseFloat(values.diameter_mm),
    length_m: Number.parseFloat(values.length_m),
    quantity: Number.parseInt(values.quantity, 10),
    status: values.status,
    notes: notes ? notes : null,
  };
}
