/** Loading placeholders — shown only while a region is genuinely in flight. */

export function Skeleton({ height = 14, width = "100%", className = "" }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 6, columns = 5 }) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="skeleton-rows__row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              height={12}
              width={columnIndex === 0 ? "60%" : `${30 + ((rowIndex + columnIndex) % 3) * 12}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTiles({ count = 4 }) {
  return (
    <div className="tile-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="tile" key={index}>
          <Skeleton height={10} width="45%" />
          <div style={{ height: 10 }} />
          <Skeleton height={26} width="60%" />
          <div style={{ height: 8 }} />
          <Skeleton height={10} width="70%" />
        </div>
      ))}
    </div>
  );
}
