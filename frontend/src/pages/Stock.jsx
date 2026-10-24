import { useCallback, useEffect, useState } from "react";

import { api } from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import Icon from "../components/Icon.jsx";
import { SelectField, TextField } from "../components/Field.jsx";
import { SkeletonRows, SkeletonTiles } from "../components/Skeleton.jsx";
import StatTile from "../components/StatTile.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { TODAY_ISO, fibreLabel, formatDate, formatNumber } from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

const FIBRE_OPTIONS = [
  { value: "hemp", label: "Hemp" },
  { value: "sisal", label: "Sisal" },
];

const STATUS_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "opened", label: "Opened" },
  { value: "used", label: "Used" },
];

const EMPTY_BALE = {
  bale_ref: "",
  fibre_type: "hemp",
  weight_kg: "",
  received_on: TODAY_ISO(),
  status: "in_stock",
};

function WeightCell({ bale, onCommit }) {
  const [value, setValue] = useState(String(bale.weight_kg));

  useEffect(() => {
    setValue(String(bale.weight_kg));
  }, [bale.weight_kg]);

  const commit = () => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0 || number > 2000) {
      setValue(String(bale.weight_kg));
      return;
    }
    if (number !== bale.weight_kg) onCommit(number);
  };

  return (
    <input
      className="inline-number"
      type="number"
      inputMode="decimal"
      min="0.1"
      max="2000"
      step="0.1"
      value={value}
      aria-label={`Weight of bale ${bale.bale_ref} in kilograms`}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          event.target.blur();
        }
      }}
    />
  );
}

export default function Stock() {
  usePageTitle("Bale stock");

  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState(null);
  const [usedCount, setUsedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [values, setValues] = useState({ ...EMPTY_BALE });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .bales()
      .then((data) => {
        setItems(data.items);
        setTotals(data.totals);
        setUsedCount(data.used_count);
      })
      .catch((err) => setError(err.message || "Could not load the bale ledger."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const update = (name) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => (previous[name] ? { ...previous, [name]: undefined } : previous));
  };

  const validate = () => {
    const next = {};
    const ref = values.bale_ref.trim();
    if (!ref) next.bale_ref = "Give the bale a reference.";
    else if (ref.length < 2) next.bale_ref = "Use at least 2 characters.";
    const weight = Number(values.weight_kg);
    if (!String(values.weight_kg).trim()) next.weight_kg = "Weight is required (kg).";
    else if (!Number.isFinite(weight) || weight <= 0) next.weight_kg = "Weight must be more than 0 kg.";
    else if (weight > 2000) next.weight_kg = "Weight must be 2000 kg or less.";
    if (!values.received_on) next.received_on = "Pick the date the bale arrived.";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return; // re-entrancy guard
    const nextErrors = validate();
    setFormErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      const first = ["bale_ref", "weight_kg", "received_on"].find((name) => nextErrors[name]);
      if (first) document.getElementById(`bale-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await api.createBale({
        bale_ref: values.bale_ref.trim(),
        fibre_type: values.fibre_type,
        weight_kg: Number(values.weight_kg),
        received_on: values.received_on,
        status: values.status,
      });
      setValues({ ...EMPTY_BALE });
      setAddOpen(false);
      load();
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setFormErrors(err.fields);
      setFormError(err.message || "Could not record that bale.");
    } finally {
      setSaving(false);
    }
  };

  const patch = async (bale, changes) => {
    setRowError("");
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === bale.id ? { ...item, ...changes } : item))
    );
    try {
      await api.updateBale(bale.id, changes);
      load();
    } catch (err) {
      setItems(previous);
      setRowError(err.message || "That bale didn’t save. Try again.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setRowError("");
    try {
      await api.deleteBale(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setRowError(err.message || "Could not delete that bale.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Fibre store</p>
          <h1>Bale stock</h1>
          <p className="page-head__meta">
            A manual ledger of hemp and sisal bales received at the ropewalk, in kilograms.
          </p>
        </div>
        <div className="page-head__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setAddOpen((open) => !open)}
            aria-expanded={addOpen}
            aria-controls="add-bale"
          >
            <Icon name="plus" />
            {addOpen ? "Close form" : "Add bale"}
          </button>
        </div>
      </div>

      {error ? <ErrorCard title="The ledger didn’t load" message={error} onRetry={load} /> : null}
      {rowError ? <ErrorCard title="Bale not saved" message={rowError} /> : null}

      {loading || !totals ? (
        <SkeletonTiles count={3} />
      ) : (
        <div className="tile-grid tile-grid--three">
          <StatTile
            label="Hemp in stock"
            value={formatNumber(totals.hemp.weight_kg)}
            unit="kg"
            meta={`${totals.hemp.count} bales in stock or opened`}
          />
          <StatTile
            label="Sisal in stock"
            value={formatNumber(totals.sisal.weight_kg)}
            unit="kg"
            meta={`${totals.sisal.count} bales in stock or opened`}
          />
          <StatTile
            label="Used bales"
            value={formatNumber(usedCount)}
            unit="bales"
            meta="drawn down on the walk"
          />
        </div>
      )}

      {addOpen ? (
        <section className="panel panel--pad" id="add-bale" aria-labelledby="add-bale-heading">
          <h2 className="panel__title" id="add-bale-heading">
            Record a bale
          </h2>
          <form className="form" onSubmit={submit} noValidate>
            <div className="form-grid">
              <TextField
                id="bale-bale_ref"
                label="Bale reference"
                value={values.bale_ref}
                onChange={update("bale_ref")}
                error={formErrors.bale_ref}
                placeholder="HEMP-1211"
                maxLength={40}
                autoComplete="off"
                required
              />
              <SelectField
                id="bale-fibre_type"
                label="Fibre"
                options={FIBRE_OPTIONS}
                value={values.fibre_type}
                onChange={update("fibre_type")}
                error={formErrors.fibre_type}
              />
              <TextField
                id="bale-weight_kg"
                label="Weight (kg)"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                max="2000"
                value={values.weight_kg}
                onChange={update("weight_kg")}
                error={formErrors.weight_kg}
                required
              />
              <TextField
                id="bale-received_on"
                label="Received on"
                type="date"
                value={values.received_on}
                onChange={update("received_on")}
                error={formErrors.received_on}
                required
              />
              <SelectField
                id="bale-status"
                label="Status"
                options={STATUS_OPTIONS}
                value={values.status}
                onChange={update("status")}
                error={formErrors.status}
              />
            </div>

            {formError ? (
              <p className="form-error" role="alert">
                <Icon name="alert" />
                {formError}
              </p>
            ) : null}

            <div className="row-actions">
              <button type="submit" className="btn btn--primary" disabled={saving} aria-busy={saving ? "true" : undefined}>
                {saving ? "Saving…" : "Add bale"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setAddOpen(false);
                  setFormErrors({});
                  setFormError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? (
        <SkeletonRows rows={8} columns={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="stock"
          title="No bales in the store yet"
          action={
            <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" />
              Record the first bale
            </button>
          }
        >
          Record each hemp or sisal bale with its reference, weight in kilograms and the date it
          arrived. Per-fibre totals update as bales are added and drawn down.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Bale ref</th>
                <th scope="col">Fibre</th>
                <th scope="col" className="num">
                  Weight
                </th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((bale) => (
                <tr key={bale.id}>
                  <th scope="row" className="mono">
                    {bale.bale_ref}
                  </th>
                  <td>{fibreLabel(bale.fibre_type)}</td>
                  <td className="num">
                    <div className="weight-cell">
                      <WeightCell bale={bale} onCommit={(weight) => patch(bale, { weight_kg: weight })} />
                      <span aria-hidden="true">kg</span>
                    </div>
                  </td>
                  <td>{formatDate(bale.received_on)}</td>
                  <td>
                    <div className="status-cell">
                      <StatusPill status={bale.status} />
                      <label className="sr-only" htmlFor={`bale-status-${bale.id}`}>
                        Status for bale {bale.bale_ref}
                      </label>
                      <select
                        id={`bale-status-${bale.id}`}
                        className="inline-select"
                        value={bale.status}
                        onChange={(event) => patch(bale, { status: event.target.value })}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="num">
                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm"
                      onClick={() => setPendingDelete(bale)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete bale ${pendingDelete.bale_ref}?` : "Delete bale?"}
        description="The bale is removed from the ledger and from the per-fibre totals."
        confirmLabel="Delete bale"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
