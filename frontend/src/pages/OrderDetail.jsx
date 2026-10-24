import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import Icon from "../components/Icon.jsx";
import OrderForm from "../components/OrderForm.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import {
  fibreLabel,
  formatDate,
  formatDateTime,
  formatMetres,
  formatMm,
  relativeTime,
  statusLabel,
} from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

function SpecSkeleton() {
  return (
    <div className="panel panel--pad" aria-hidden="true">
      <Skeleton height={12} width="30%" />
      <div style={{ height: 14 }} />
      <Skeleton height={12} width="80%" />
      <div style={{ height: 10 }} />
      <Skeleton height={12} width="65%" />
      <div style={{ height: 10 }} />
      <Skeleton height={12} width="72%" />
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  usePageTitle(order ? `${order.customer}` : "Order");

  const load = useCallback(() => {
    setPhase("loading");
    setError("");
    api
      .order(orderId)
      .then((data) => {
        setOrder(data);
        setPhase("ready");
      })
      .catch((err) => {
        setError(
          err.status === 404
            ? "That order isn’t in the book any more."
            : err.message || "Could not load the order."
        );
        setPhase("error");
      });
  }, [orderId]);

  useEffect(load, [load]);

  const save = async (payload) => {
    const updated = await api.updateOrder(orderId, payload);
    setOrder(updated);
    setEditing(false);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteOrder(orderId);
      navigate("/orders", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Could not delete the order.");
      setDeleting(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <p className="eyebrow">Orders / …</p>
            <Skeleton height={30} width="320px" />
          </div>
        </div>
        <SpecSkeleton />
      </div>
    );
  }

  if (phase === "error" || !order) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <Link to="/orders">Orders</Link> / Detail
            </p>
            <h1>Order unavailable</h1>
          </div>
        </div>
        <ErrorCard
          title="We couldn’t open that order"
          message={error}
          onRetry={load}
        />
        <p className="muted">
          <Link to="/orders">Back to all orders</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            <Link to="/orders">Orders</Link> / #{order.id}
          </p>
          <h1>{order.customer}</h1>
          <p className="page-head__meta">
            <StatusPill status={order.status} />
            <span className="dot-sep" aria-hidden="true">
              ·
            </span>
            {fibreLabel(order.fibre_type)}, {order.strand_count}-strand, {order.lay_direction} lay
            <span className="dot-sep" aria-hidden="true">
              ·
            </span>
            {formatMetres(order.length_m)} × {order.quantity}
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--ghost" to="/orders">
            <Icon name="back" />
            All orders
          </Link>
          {editing ? null : (
            <>
              <button type="button" className="btn btn--primary" onClick={() => setEditing(true)}>
                Edit spec
              </button>
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {deleteError ? <ErrorCard title="Delete failed" message={deleteError} /> : null}

      <div className="detail-grid">
        <section className="panel" aria-labelledby="spec-heading">
          <header className="panel__head">
            <h2 id="spec-heading">Rope lay &amp; fibre spec</h2>
            {editing ? <span className="panel__note">Editing</span> : null}
          </header>

          {editing ? (
            <div className="panel--pad">
              <OrderForm
                initial={order}
                submitLabel="Save changes"
                onSubmit={save}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <dl className="spec">
              <div>
                <dt>Fibre</dt>
                <dd>{fibreLabel(order.fibre_type)}</dd>
              </div>
              <div>
                <dt>Strand count</dt>
                <dd className="num">{order.strand_count}</dd>
              </div>
              <div>
                <dt>Lay direction</dt>
                <dd>
                  {order.lay_direction}{" "}
                  <span className="muted">
                    ({order.lay_direction === "Z" ? "right-hand" : "left-hand"})
                  </span>
                </dd>
              </div>
              <div>
                <dt>Lay length</dt>
                <dd className="num">{formatMm(order.lay_length_mm)}</dd>
              </div>
              <div>
                <dt>Rope diameter</dt>
                <dd className="num">{formatMm(order.diameter_mm)}</dd>
              </div>
              <div>
                <dt>Finished length</dt>
                <dd className="num">{formatMetres(order.length_m)}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd className="num">{order.quantity}</dd>
              </div>
              <div>
                <dt>Total metres</dt>
                <dd className="num">{formatMetres(order.total_length_m)}</dd>
              </div>
              <div>
                <dt>Raised</dt>
                <dd>{formatDateTime(order.created_at)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{relativeTime(order.updated_at)}</dd>
              </div>
            </dl>
          )}

          {!editing && order.notes ? (
            <div className="notes">
              <h3>Notes</h3>
              <p>{order.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="side-stack">
          <section className="panel" aria-labelledby="run-heading">
            <header className="panel__head">
              <h2 id="run-heading">Ropewalk run</h2>
            </header>
            <div className="panel__body">
              {order.schedule ? (
                <dl className="spec spec--tight">
                  <div>
                    <dt>Sequence</dt>
                    <dd className="num">{order.schedule.sequence}</dd>
                  </div>
                  <div>
                    <dt>Run date</dt>
                    <dd>{formatDate(order.schedule.run_date)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusPill status={order.schedule.status} />
                    </dd>
                  </div>
                  <div>
                    <dt>Planned</dt>
                    <dd className="num">{formatMetres(order.schedule.planned_length_m)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="muted">
                  {order.status === "confirmed"
                    ? "Not on the run list yet — generate the schedule to place this order."
                    : `Only confirmed orders are scheduled. This order is ${statusLabel(
                        order.status
                      ).toLowerCase()}.`}
                </p>
              )}
              <Link className="btn btn--ghost btn--sm" to="/schedule">
                <Icon name="schedule" />
                Ropewalk schedule
              </Link>
            </div>
          </section>

          <section className="panel" aria-labelledby="totals-heading">
            <header className="panel__head">
              <h2 id="totals-heading">At a glance</h2>
            </header>
            <div className="panel__body">
              <dl className="spec spec--tight">
                <div>
                  <dt>Metres per rope</dt>
                  <dd className="num">{formatMetres(order.length_m)}</dd>
                </div>
                <div>
                  <dt>Metres in total</dt>
                  <dd className="num">{formatMetres(order.total_length_m)}</dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd className="num">{order.quantity}</dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete the order for ${order.customer}?`}
        description="The order and its run-list entry are removed for good. This cannot be undone."
        confirmLabel="Delete order"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
