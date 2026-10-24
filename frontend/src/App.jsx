import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import AppShell from "./components/AppShell.jsx";
import Icon from "./components/Icon.jsx";
import { Skeleton } from "./components/Skeleton.jsx";
import { useAuth } from "./auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import OrderNew from "./pages/OrderNew.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import Schedule from "./pages/Schedule.jsx";
import Stock from "./pages/Stock.jsx";

function BootScreen() {
  return (
    <div className="boot">
      <div className="boot__panel">
        <p className="boot__brand">Rope Walk Cordage Orders</p>
        <Skeleton height={14} width="70%" />
        <div style={{ height: 8 }} />
        <Skeleton height={14} width="45%" />
        <p className="boot__hint">Restoring your session…</p>
      </div>
    </div>
  );
}

function Protected() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BootScreen />;
  if (status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <Outlet />;
}

function NotFound() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">404</p>
          <h1>That page isn’t on the walk</h1>
        </div>
      </div>
      <div className="panel panel--pad">
        <p className="muted">
          The link you followed doesn’t match a screen. Head back to the dashboard or the
          order book.
        </p>
        <div className="row-actions">
          <Link className="btn btn--primary" to="/">
            <Icon name="dashboard" />
            Dashboard
          </Link>
          <Link className="btn btn--ghost" to="/orders">
            <Icon name="orders" />
            Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/new" element={<OrderNew />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="stock" element={<Stock />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
