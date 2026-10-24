import { describe, expect, it } from "vitest";

import {
  ORDER_DEFAULTS,
  orderPayload,
  toFormValues,
  validateOrder,
} from "./orderValidation.js";

describe("order validation", () => {
  it("accepts the default form values once a customer is named", () => {
    expect(validateOrder({ ...ORDER_DEFAULTS, customer: "Whitby Harbour Trust" })).toEqual({});
  });

  it("requires a customer", () => {
    expect(validateOrder(ORDER_DEFAULTS).customer).toMatch(/customer/i);
    expect(validateOrder({ ...ORDER_DEFAULTS, customer: "   " }).customer).toMatch(/customer/i);
  });

  it("rejects a negative or zero lay length with a field error", () => {
    const errors = validateOrder({
      ...ORDER_DEFAULTS,
      customer: "Fenwick Sailmakers",
      lay_length_mm: "-5",
    });
    expect(errors.lay_length_mm).toMatch(/more than 0.1 mm/);
  });

  it("rejects a fractional strand count", () => {
    const errors = validateOrder({
      ...ORDER_DEFAULTS,
      customer: "Fenwick Sailmakers",
      strand_count: "3.5",
    });
    expect(errors.strand_count).toMatch(/whole number/);
  });

  it("rejects a rope longer than the walk can lay", () => {
    const errors = validateOrder({
      ...ORDER_DEFAULTS,
      customer: "Orkney Lighthouse Board",
      length_m: "25000",
    });
    expect(errors.length_m).toMatch(/20000 m or less/);
  });
});

describe("order payload", () => {
  it("converts the numeric strings the inputs hold", () => {
    const payload = orderPayload({
      ...ORDER_DEFAULTS,
      customer: " Saltmarsh Narrowboats ",
      fibre_type: "sisal",
      strand_count: "4",
      lay_direction: "Z",
      lay_length_mm: "45",
      diameter_mm: "28",
      length_m: "320",
      quantity: "2",
      status: "confirmed",
      notes: "  tarred after laying  ",
    });
    expect(payload).toEqual({
      customer: "Saltmarsh Narrowboats",
      fibre_type: "sisal",
      strand_count: 4,
      lay_direction: "Z",
      lay_length_mm: 45,
      diameter_mm: 28,
      length_m: 320,
      quantity: 2,
      status: "confirmed",
      notes: "tarred after laying",
    });
  });

  it("sends empty notes as null", () => {
    expect(orderPayload({ ...ORDER_DEFAULTS, customer: "X", notes: "   " }).notes).toBeNull();
  });

  it("reads an existing order back into form values", () => {
    const values = toFormValues({ customer: "Hartley Bell Foundry", length_m: 90, quantity: 4 });
    expect(values.customer).toBe("Hartley Bell Foundry");
    expect(values.length_m).toBe("90");
    expect(values.quantity).toBe("4");
  });
});
