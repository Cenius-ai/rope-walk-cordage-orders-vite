import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth.jsx";
import { initials } from "../lib/format.js";
import Icon from "./Icon.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/orders", label: "Orders", icon: "orders" },
  { to: "/schedule", label: "Ropewalk schedule", icon: "schedule" },
  { to: "/stock", label: "Bale stock", icon: "stock" },
  { to: "/profile", label: "Ropemaker profile", icon: "profile" },
];

function BrandMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 32 32"
      role="img"
      aria-label="Rope Walk Cordage"
      className="rail__mark"
    >
      <rect width="32" height="32" rx="7" fill="#132129" />
      <path
        d="M7 22c3-10 5-12 9-12s6 2 9 12"
        fill="none"
        stroke="#009494"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M11 22c2-6 3-7 5-7s3 1 5 7"
        fill="none"
        stroke="#fdffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside className="rail">
        <div className="rail__brand">
          <BrandMark />
          <div>
            <p className="rail__name">Rope Walk</p>
            <p className="rail__sub">Cordage Orders</p>
          </div>
        </div>

        <nav className="rail__nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
            >
              <Icon name={item.icon} className="nav-link__icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail__foot">
          <div className="identity">
            <span className="identity__avatar" aria-hidden="true">
              {initials(user?.display_name)}
            </span>
            <div className="identity__text">
              <p className="identity__name">{user?.display_name || "Ropemaker"}</p>
              <p className="identity__ropewalk">{user?.ropewalk_name || ""}</p>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>
            <Icon name="signout" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main" id="main">
        <Outlet />
      </main>
    </div>
  );
}
