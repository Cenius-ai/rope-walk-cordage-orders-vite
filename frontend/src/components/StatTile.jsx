import { Link } from "react-router-dom";

export default function StatTile({ label, value, unit, meta, to }) {
  const body = (
    <>
      <p className="tile__label">{label}</p>
      <p className="tile__value">
        <span className="tile__number">{value}</span>
        {unit ? <span className="tile__unit">{unit}</span> : null}
      </p>
      {meta ? <p className="tile__meta">{meta}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link className="tile tile--link" to={to}>
        {body}
      </Link>
    );
  }
  return <div className="tile">{body}</div>;
}
