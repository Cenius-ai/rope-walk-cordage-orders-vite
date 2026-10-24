import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import Icon from "../components/Icon.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { fibreLabel, formatMetres, formatMm, relativeTime } from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

const FIBRE_FACETS = [
  { value: "hemp", label: "Hemp" },
  { value: "sisal", label: "Sisal" },
];

const STATUS_FACETS = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "complete", label: "Complete" },
];

const SORTS = [
  { value: "created_desc", label: "Newest first" },
  { value: "length_desc", label: "Longest first" },
  { value: "customer_asc", label: "Customer A–Z" },
  { value: "status_asc", label: "Status" },
];

const SORT_FUNCTIONS = {
  created_desc: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
  length_desc: (a, b) => b.length_m - a.length_m,
  customer_asc: (a, b) => a.customer.localeCompare(b.customer),
  status_asc: (a, b) => a.status.localeCompare(b.status) || a.customer.localeCompare(b.customer),
};

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function Orders() {
  usePageTitle("Orders");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [fibreFilters, setFibreFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [sort, setSort] = useState("created_desc");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .orders()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message || "Could not load the order book."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = items.filter((order) => {
      if (needle) {
        const haystack = `${order.customer} ${order.notes || ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (fibreFilters.length && !fibreFilters.includes(order.fibre_type)) return false;
      if (statusFilters.length && !statusFilters.includes(order.status)) return false;
      return true;
    });
    return rows.slice().sort(SORT_FUNCTIONS[sort] || SORT_FUNCTIONS.created_desc);
  }, [items, query, fibreFilters, statusFilters, sort]);

  const filtersActive = Boolean(query.trim() || fibreFilters.length || statusFilters.length);

  const clearFilters = () => {
    setQuery("");
    setFibreFilters([]);
    setStatusFilters([]);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Order book</p>
          <h1>Orders</h1>
          <p className="page-head__meta">
            Every job carries its fibre, strand count, lay direction and metric spec.
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--primary" to="/orders/new">
            <Icon name="plus" />
            New order
          </Link>
        </div>
      </div>

      <div className="workbench">
        <aside className="facets" aria-label="Filter orders">
          <div className="facets__group">
            <label className="facets__label" htmlFor="order-search">
              Search
            </label>
            <div className="search">
              <Icon name="search" className="search__icon" />
              <input
                id="order-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Customer or note"
              />
            </div>
          </div>

          <fieldset className="facets__group">
            <legend>Fibre</legend>
            {FIBRE_FACETS.map((facet) => (
              <label className="check" key={facet.value}>
                <input
                  type="checkbox"
                  checked={fibreFilters.includes(facet.value)}
                  onChange={() => setFibreFilters((previous) => toggleValue(previous, facet.value))}
                />
                <span>{facet.label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="facets__group">
            <legend>Status</legend>
            {STATUS_FACETS.map((facet) => (
              <label className="check" key={facet.value}>
                <input
                  type="checkbox"
                  checked={statusFilters.includes(facet.value)}
                  onChange={() => setStatusFilters((previous) => toggleValue(previous, facet.value))}
                />
                <span>{facet.label}</span>
              </label>
            ))}
          </fieldset>

          {filtersActive ? (
            <div className="chips">
              <button type="button" className="chip" onClick={clearFilters}>
                Clear all filters
                <span aria-hidden="true"> ×</span>
              </button>
            </div>
          ) : (
            <p className="facets__hint">Filters narrow the order book without a reload.</p>
          )}
        </aside>

        <section className="results" aria-live="polite">
          <header className="results__head">
            <p className="results__count">
              <strong>{filtered.length}</strong> of {items.length} orders
            </p>
            <label className="sort">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </header>

          {error ? (
            <ErrorCard title="The order book didn’t load" message={error} onRetry={load} />
          ) : loading ? (
            <SkeletonRows rows={8} columns={6} />
          ) : items.length === 0 ? (
            <EmptyState
              icon="orders"
              title="No orders in the book yet"
              action={
                <Link className="btn btn--primary" to="/orders/new">
                  <Icon name="plus" />
                  Create the first order
                </Link>
              }
            >
              An order records the customer, fibre (hemp or sisal), strand count, lay direction
              (Z or S), lay length in millimetres, rope diameter in millimetres and finished
              length in metres.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No orders match those filters"
              action={
                <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                  Clear all filters
                </button>
              }
            >
              Nothing in the book matches “{query || "your filters"}”. Widen the fibre or status
              selection.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Fibre</th>
                    <th scope="col">Lay</th>
                    <th scope="col" className="num">
                      Lay length
                    </th>
                    <th scope="col" className="num">
                      Diameter
                    </th>
                    <th scope="col" className="num">
                      Length
                    </th>
                    <th scope="col" className="num">
                      Qty
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                    <th scope="col">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id}>
                      <th scope="row" className="table-customer">
                        <Link className="row-link" to={`/orders/${order.id}`}>
                          {order.customer}
                        </Link>
                      </th>
                      <td>{fibreLabel(order.fibre_type)}</td>
                      <td className="mono">{order.lay_direction}</td>
                      <td className="num">{formatMm(order.lay_length_mm)}</td>
                      <td className="num">{formatMm(order.diameter_mm)}</td>
                      <td className="num">{formatMetres(order.length_m)}</td>
                      <td className="num">{order.quantity}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td className="muted">{relativeTime(order.updated_at)}</td>
                      <td className="num">
                        <Link
                          to={`/orders/${order.id}`}
                          className="row-open"
                          aria-label={`Open the order for ${order.customer}`}
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
        </section>
      </div>
    </div>
  );
}
