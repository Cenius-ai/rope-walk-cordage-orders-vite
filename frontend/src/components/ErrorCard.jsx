import Icon from "./Icon.jsx";

export default function ErrorCard({ title = "That didn’t load", message, onRetry }) {
  return (
    <div className="error-card" role="alert">
      <Icon name="alert" size={18} className="error-card__icon" />
      <div className="error-card__text">
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <Icon name="retry" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
