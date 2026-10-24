import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth.jsx";
import { TextField } from "../components/Field.jsx";
import Icon from "../components/Icon.jsx";
import usePageTitle from "../lib/usePageTitle.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_EMAIL = "cenius@cenius.ai";
const DEMO_PASSWORD = "cenius";

export default function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  usePageTitle("Sign in");

  if (status === "authenticated") {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = "That email address is missing an @ or a domain.";
    if (!password) next.password = "Enter your password.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      const firstInvalid = nextErrors.email ? "login-email" : "login-password";
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (error) {
      setFormError(error.message || "Sign-in failed. Try again.");
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError("");
  };

  return (
    <div className="auth">
      <main className="auth__card">
        <div className="auth__brand">
          <svg width="34" height="34" viewBox="0 0 32 32" role="img" aria-label="Rope Walk Cordage">
            <rect width="32" height="32" rx="7" fill="#132129" />
            <path d="M7 22c3-10 5-12 9-12s6 2 9 12" fill="none" stroke="#009494" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M11 22c2-6 3-7 5-7s3 1 5 7" fill="none" stroke="#fdffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <p className="auth__product">Rope Walk</p>
            <p className="auth__product-sub">Cordage Orders</p>
          </div>
        </div>

        <h1 className="auth__title">Sign in to the ropewalk</h1>
        <p className="auth__lede">
          Order specs, the run list and the fibre ledger for Ellery Ropewalk.
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="you@ropewalk.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            required
          />

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrap">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={errors.password ? "true" : undefined}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password ? (
              <p className="field__error" id="login-password-error" role="alert">
                {errors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="form-error" role="alert">
              <Icon name="alert" />
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={busy}
            aria-busy={busy ? "true" : undefined}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demo-hint">
          <p className="demo-hint__line">
            Demo: <code>cenius@cenius.ai</code> / <code>cenius</code>
          </p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={fillDemo}>
            Use demo credentials
          </button>
        </div>

        <ul className="feature-list">
          <li>
            <Icon name="spool" className="hang" />
            Full lay and fibre spec on every order
          </li>
          <li>
            <Icon name="schedule" className="hang" />
            Run list sequenced longest length first
          </li>
          <li>
            <Icon name="stock" className="hang" />
            Hemp and sisal bale ledger in kilograms
          </li>
        </ul>
      </main>
    </div>
  );
}
