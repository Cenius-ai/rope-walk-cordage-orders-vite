import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import Icon from "../components/Icon.jsx";
import { SkeletonRows, SkeletonTiles } from "../components/Skeleton.jsx";
import StatTile from "../components/StatTile.jsx";
import StatusPill from "../components/StatusPill.jsx";
import {
  fibreLabel,
  formatDate,
  formatKg,
  formatMetres,
  formatNumber,
  relativeTime,
} from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .overview()
      .then((overview) => setData(overview))
      .catch((err) => setError(err.message || "Could not reach the ropewalk service."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Ropewalk overview</p>
          <h1>The walk as it stands</h1>
          <p className="page-head__meta">
            {user ? `${user.display_name} · ${user.ropewalk_name}` : "Signed in"}
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--primary" to="/orders/new">
            <Icon name="plus" />
            New order
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorCard title="The overview didn’t load" message={error} onRetry={load} />
      ) : null}

      {loading ? (
        <SkeletonTiles count={4} />
      ) : data ? (
        <div className="tile-grid">
          <StatTile
            label="Active orders"
            value={formatNumber(data.active_orders)}
            unit="orders"
            meta={`${data.draft_orders} draft · ${data.confirmed_orders} confirmed`}
            to="/orders"
          />
          <StatTile
            label="Scheduled metres"
            value={formatNumber(data.total_scheduled_m)}
            unit="m"
            meta="planned on the walk, longest first"
            to="/schedule"
          />
          <StatTile
            label="Hemp in stock"
            value={formatNumber(data.bale_totals.hemp.weight_kg)}
            unit="kg"
            meta={`${data.bale_totals.hemp.count} bales on the rack`}
            to="/stock"
          />
          <StatTile
            label="Sisal in stock"
            value={formatNumber(data.bale_totals.sisal.weight_kg)}
            unit="kg"
            meta={`${data.bale_totals.sisal.count} bales on the rack`}
            to="/stock"
          />
        </div>
      ) : null}

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="next-runs-heading">
          <header className="panel__head">
            <h2 id="next-runs-heading">Next runs</h2>
            <Link className="panel__link" to="/schedule">
              Whole run list
              <Icon name="arrow" />
            </Link>
          </header>

          {loading ? (
            <div className="panel__body">
              <SkeletonRows rows={3} columns={2} />
            </div>
          ) : data && data.next_runs.length ? (
            <ol className="run-list">
              {data.next_runs.map((run) => (
                <li className="run-list__item" key={run.id}>
                  <span className="run-list__seq">{String(run.sequence).padStart(2, "0")}</span>
                  <div className="run-list__body">
                    <Link className="run-list__customer" to={`/orders/${run.order_id}`}>
                      {run.customer}
                    </Link>
                    <p className="run-list__meta">
                      <Icon name="spool" className="hang" />
                      {fibreLabel(run.fibre_type)} · {run.lay_direction} lay ·{" "}
                      {formatMetres(run.length_m)} · run {formatDate(run.run_date)}
                    </p>
                  </div>
                  <StatusPill status={run.status} />
                </li>
              ))}
            </ol>
          ) : (
            <div className="panel__body">
              <EmptyState
                icon="schedule"
                title="No runs on the walk yet"
                action={
                  <Link className="btn btn--ghost" to="/schedule">
                    Generate the run list
                  </Link>
                }
              >
                The run list is built from confirmed orders, sequenced longest finished length
                first so the long lays are walked early.
              </EmptyState>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="recent-orders-heading">
          <header className="panel__head">
            <h2 id="recent-orders-heading">Recent orders</h2>
            <Link className="panel__link" to="/orders">
              Order book
              <Icon name="arrow" />
            </Link>
          </header>

          {loading ? (
            <div className="panel__body">
              <SkeletonRows rows={5} columns={4} />
            </div>
          ) : data && data.recent_orders.length ? (
            <div className="table-wrap table-wrap--flush">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Fibre</th>
                    <th scope="col" className="num">
                      Length
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((order) => (
                    <tr key={order.id}>
                      <th scope="row">
                        <Link className="row-link" to={`/orders/${order.id}`}>
                          {order.customer}
                        </Link>
                      </th>
                      <td>{fibreLabel(order.fibre_type)}</td>
                      <td className="num">{formatMetres(order.length_m)}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td className="muted">{relativeTime(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel__body">
              <EmptyState
                icon="orders"
                title="No orders yet"
                action={
                  <Link className="btn btn--primary" to="/orders/new">
                    <Icon name="plus" />
                    Create the first order
                  </Link>
                }
              >
                Once an order exists it appears here with its fibre and finished length.
              </EmptyState>
            </div>
          )}
        </section>
      </div>

      {!loading && data ? (
        <p className="page-foot">
          Bale stock: hemp {formatKg(data.bale_totals.hemp.weight_kg)} across {data.hemp_bales}{" "}
          bales, sisal {formatKg(data.bale_totals.sisal.weight_kg)} across {data.sisal_bales} bales.
          Totals count bales still in stock or opened.
        </p>
      ) : null}
    </div>
  );
}
