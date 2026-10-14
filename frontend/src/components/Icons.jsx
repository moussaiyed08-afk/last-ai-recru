const PATHS = {
  jobs: (
    <>
      <rect x="2.5" y="6" width="15" height="10.5" rx="2" />
      <path d="M7 6V4.5C7 3.7 7.7 3 8.5 3h3c.8 0 1.5.7 1.5 1.5V6M2.5 10.5h15" />
    </>
  ),
  people: (
    <>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 17c0-3 3-5 6.5-5s6.5 2 6.5 5" />
    </>
  ),
  chart: <path d="M3 17V9M9 17V3M15 17v-5" />,
  bookmark: <path d="M5 3.5h10v13l-5-3.2-5 3.2v-13Z" />,
  file: (
    <>
      <path d="M5.5 2.5h6l3 3v12h-9v-15Z" />
      <path d="M11.5 2.5v3h3M8 10h4M8 13h4" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" />
    </>
  ),
  plus: <path d="M10 4v12M4 10h12" />,
  logout: <path d="M8 3H5.5A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17H8M12.5 6.5 16 10l-3.5 3.5M16 10H8" />,
  menu: <path d="M3 5.5h14M3 10h14M3 14.5h14" />,
  x: <path d="m5 5 10 10M15 5 5 15" />,
  edit: <path d="m12.5 4.5 3 3L7 16H4v-3l8.5-8.5Z" />,
  trash: <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" />,
  pin: (
    <>
      <path d="M10 17.5s5-4.3 5-8.5a5 5 0 0 0-10 0c0 4.2 5 8.5 5 8.5Z" />
      <circle cx="10" cy="9" r="1.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 1.5" />
    </>
  ),
  send: <path d="M3 9.5 17 3l-4.5 14-3-5.5L3 9.5ZM9.5 11.5 17 3" />,
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
  building: <path d="M4 17V4.5A1.5 1.5 0 0 1 5.5 3h6A1.5 1.5 0 0 1 13 4.5V17M13 8h1.5A1.5 1.5 0 0 1 16 9.5V17M2.5 17h15M7 6.5h3M7 9.5h3M7 12.5h3" />,
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.2" />
      <path d="m3.5 3.5 13 13" />
    </>
  ),
  upload: <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 15.5h12" />,
  alert: (
    <>
      <path d="M10 3 18 16.5H2L10 3Z" />
      <path d="M10 8.5v3.5M10 14.2v.1" />
    </>
  ),
  arrowLeft: <path d="M16 10H4M9 5l-5 5 5 5" />,
};

export default function Icon({ name, size = 18, filled = false, ...rest }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
