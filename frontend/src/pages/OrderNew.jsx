import { Link, useNavigate } from "react-router-dom";

import { api } from "../api.js";
import OrderForm from "../components/OrderForm.jsx";
import Icon from "../components/Icon.jsx";
import usePageTitle from "../lib/usePageTitle.js";

export default function OrderNew() {
  usePageTitle("New order");
  const navigate = useNavigate();

  const create = async (payload) => {
    const order = await api.createOrder(payload);
    navigate(`/orders/${order.id}`, { replace: true });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            <Link to="/orders">Orders</Link> / New
          </p>
          <h1>New cordage order</h1>
          <p className="page-head__meta">
            Capture the lay and fibre spec now — the run list is generated from confirmed
            orders.
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--ghost" to="/orders">
            <Icon name="back" />
            All orders
          </Link>
        </div>
      </div>

      <div className="panel panel--pad">
        <OrderForm
          submitLabel="Create order"
          onSubmit={create}
          onCancel={() => navigate("/orders")}
        />
      </div>
    </div>
  );
}
