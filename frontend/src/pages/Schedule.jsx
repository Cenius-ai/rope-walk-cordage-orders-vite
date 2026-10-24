import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import Icon from "../components/Icon.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { fibreLabel, formatDate, formatMetres } from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

const RUN_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function Schedule() {
  usePageTitle("Ropewalk schedule");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const flashTimer = useRef(null);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .schedule()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message || "Could not load the run list."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    setRowError("");
    try {
      const data = await api.generateSchedule();
      setRows(data);
    } catch (err) {
      setError(err.message || "Could not generate the run list.");
    } finally {
      setGenerating(false);
    }
  };

  const patch = async (row, changes) => {
    setRowError("");
    const previous = row;
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, ...changes } : item))
    );
    try {
      const updated = await api.updateScheduleEntry(row.id, changes);
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      setFlashId(row.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashId(null), 320);
    } catch (err) {
      setRows((current) => current.map((item) => (item.id === row.id ? previous : item)));
      setRowError(err.message || "That run didn’t save. Try again.");
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Production</p>
          <h1>Ropewalk schedule</h1>
          <p className="page-head__meta">
            Sequenced longest finished length first. Regenerating keeps runs already marked done,
            with their dates.
          </p>
        </div>
        <div className="page-head__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={generate}
            disabled={generating}
            aria-busy={generating ? "true" : undefined}
          >
            <Icon name="retry" />
            {generating ? "Generating…" : rows.length ? "Regenerate schedule" : "Generate schedule"}
          </button>
        </div>
      </div>

      {error ? <ErrorCard title="The run list didn’t load" message={error} onRetry={load} /> : null}
      {rowError ? <ErrorCard title="Run not saved" message={rowError} /> : null}

      {loading ? (
        <SkeletonRows rows={6} columns={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="schedule"
          title="No runs on the walk yet"
          action={
            <button type="button" className="btn btn--primary" onClick={generate} disabled={generating}>
              <Icon name="retry" />
              {generating ? "Generating…" : "Generate schedule"}
            </button>
          }
        >
          Generation takes every confirmed order and places the longest finished length first, so
          the long lays go up the walk before the short ones. Run dates and statuses are editable
          afterwards.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table data-table--schedule">
            <thead>
              <tr>
                <th scope="col" className="num">
                  Seq
                </th>
                <th scope="col">Customer</th>
                <th scope="col">Fibre</th>
                <th scope="col" className="num">
                  Length
                </th>
                <th scope="col" className="num">
                  Planned
                </th>
                <th scope="col">Run date</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Open order</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={flashId === row.id ? "row--flash" : undefined}>
                  <td className="num seq">{String(row.sequence).padStart(2, "0")}</td>
                  <th scope="row">
                    <Link className="row-link" to={`/orders/${row.order_id}`}>
                      {row.customer}
                    </Link>
                  </th>
                  <td>{fibreLabel(row.fibre_type)}</td>
                  <td className="num">{formatMetres(row.length_m)}</td>
                  <td className="num">{formatMetres(row.planned_length_m)}</td>
                  <td>
                    <label className="sr-only" htmlFor={`run-date-${row.id}`}>
                      Run date for {row.customer}
                    </label>
                    <input
                      id={`run-date-${row.id}`}
                      className="inline-date"
                      type="date"
                      value={row.run_date}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, run_date: event.target.value } : item
                          )
                        )
                      }
                      onBlur={(event) => patch(row, { run_date: event.target.value })}
                    />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`run-status-${row.id}`}>
                      Status for {row.customer}
                    </label>
                    <select
                      id={`run-status-${row.id}`}
                      className="inline-select"
                      value={row.status}
                      onChange={(event) => patch(row, { status: event.target.value })}
                    >
                      {RUN_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num">
                    <Link
                      to={`/orders/${row.order_id}`}
                      className="row-open"
                      aria-label={`Open the order for ${row.customer}`}
                    >
                      <Icon name="arrow" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length ? (
        <p className="page-foot">
          {rows.length} run{rows.length === 1 ? "" : "s"} on the walk · first run{" "}
          {formatDate(rows[0].run_date)} · status{" "}
          <StatusPill status={rows[0].status} />
        </p>
      ) : null}
    </div>
  );
}
