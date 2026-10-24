import Icon from "./Icon.jsx";

export default function EmptyState({ icon = "orders", title, children, action }) {
  return (
    <div className="empty">
      <Icon name={icon} size={20} className="empty__icon" />
      <h3 className="empty__title">{title}</h3>
      {children ? <p className="empty__body">{children}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
