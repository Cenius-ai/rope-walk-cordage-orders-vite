/** One inline SVG icon set, 16px, currentColor, no icon font or CDN. */

const PATHS = {
  dashboard: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </>
  ),
  orders: (
    <>
      <path d="M3 4h10M3 8h10M3 12h6" />
      <circle cx="12.5" cy="12" r="1.6" />
    </>
  ),
  schedule: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12M5.5 2v2M10.5 2v2" />
    </>
  ),
  stock: (
    <>
      <path d="M2.5 5.5 8 2.5l5.5 3L8 8.5z" />
      <path d="M2.5 8 8 11l5.5-3" />
      <path d="M2.5 10.5 8 13.5l5.5-3" />
    </>
  ),
  profile: (
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c1.2-2.6 3-3.6 5-3.6s3.8 1 5 3.6" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
  back: <path d="M13 8H3M7 4 3 8l4 4" />,
  check: <path d="M3 8.5 6.5 12 13 4.5" />,
  signout: (
    <>
      <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6" />
      <path d="M10 5l3 3-3 3M13 8H6" />
    </>
  ),
  retry: (
    <>
      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
      <path d="M13 2.5V5h-2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3.5 3.5" />
    </>
  ),
  alert: (
    <>
      <path d="M8 2.5 14.5 13.5h-13z" />
      <path d="M8 6.5v3.5M8 11.8v.2" />
    </>
  ),
  spool: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M4.5 8h7M6 5.5h4M6 10.5h4" />
    </>
  ),
};

export default function Icon({ name, size = 16, className }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
