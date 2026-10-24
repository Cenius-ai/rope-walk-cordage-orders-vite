import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { TextField } from "../components/Field.jsx";
import Icon from "../components/Icon.jsx";
import { formatDate, initials } from "../lib/format.js";
import usePageTitle from "../lib/usePageTitle.js";

export default function Profile() {
  usePageTitle("Ropemaker profile");
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    display_name: user?.display_name ?? "",
    ropewalk_name: user?.ropewalk_name ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef(null);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    []
  );

  useEffect(() => {
    setValues({
      display_name: user?.display_name ?? "",
      ropewalk_name: user?.ropewalk_name ?? "",
    });
  }, [user]);

  const update = (name) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: undefined } : previous));
    setSaved(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors = {};
    if (!values.display_name.trim()) nextErrors.display_name = "Display name can’t be blank.";
    if (!values.ropewalk_name.trim()) nextErrors.ropewalk_name = "Ropewalk name can’t be blank.";
    setErrors(nextErrors);
    setFormError("");
    setSaved(false);
    if (Object.keys(nextErrors).length) {
      const first = nextErrors.display_name ? "profile-display_name" : "profile-ropewalk_name";
      document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        display_name: values.display_name.trim(),
        ropewalk_name: values.ropewalk_name.trim(),
      });
      setUser(updated);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setErrors(err.fields);
      setFormError(err.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Ropemaker profile</h1>
          <p className="page-head__meta">
            The name and ropewalk that appear on every order and run sheet.
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            <Icon name="signout" />
            Sign out
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <section className="panel panel--pad" aria-labelledby="profile-heading">
          <h2 className="panel__title" id="profile-heading">
            Your details
          </h2>

          <form className="form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" type="email" value={user?.email ?? ""} readOnly />
              <p className="field__hint">The sign-in address for this account.</p>
            </div>

            <TextField
              id="profile-display_name"
              label="Display name"
              value={values.display_name}
              onChange={update("display_name")}
              error={errors.display_name}
              maxLength={120}
              autoComplete="name"
              required
            />

            <TextField
              id="profile-ropewalk_name"
              label="Ropewalk name"
              value={values.ropewalk_name}
              onChange={update("ropewalk_name")}
              error={errors.ropewalk_name}
              hint="Shown in the sidebar and on printed run sheets."
              maxLength={160}
              autoComplete="organization"
              required
            />

            {formError ? (
              <p className="form-error" role="alert">
                <Icon name="alert" />
                {formError}
              </p>
            ) : null}

            <div className="row-actions">
              <button type="submit" className="btn btn--primary" disabled={saving} aria-busy={saving ? "true" : undefined}>
                {saving ? "Saving…" : "Save profile"}
              </button>
              {saved ? (
                <p className="saved-note" role="status">
                  <Icon name="check" />
                  Profile saved
                </p>
              ) : null}
            </div>
          </form>
        </section>

        <aside className="side-stack">
          <section className="panel panel--pad" aria-labelledby="identity-heading">
            <div className="identity identity--stacked">
              <span className="identity__avatar identity__avatar--lg" aria-hidden="true">
                {initials(user?.display_name)}
              </span>
              <div>
                <h2 className="panel__title" id="identity-heading">
                  {user?.display_name ?? "Ropemaker"}
                </h2>
                <p className="muted">{user?.ropewalk_name ?? ""}</p>
              </div>
            </div>
            <dl className="spec spec--tight">
              <div>
                <dt>Signed in as</dt>
                <dd>{user?.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Account opened</dt>
                <dd>{user?.created_at ? formatDate(user.created_at) : "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="panel panel--pad">
            <h2 className="panel__title">Session</h2>
            <p className="muted">
              Signing out clears the stored token on this device and returns you to the sign-in
              page.
            </p>
            <button type="button" className="btn btn--ghost" onClick={signOut}>
              <Icon name="signout" />
              Sign out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
