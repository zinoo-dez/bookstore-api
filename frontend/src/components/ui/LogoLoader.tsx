const LogoLoader = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width="42"
        height="42"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-900"
      >
        <path
          d="M6 14 L16 6 L26 14"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-roof-bob"
        />
        <rect
          x="9"
          y="14"
          width="14"
          height="13"
          rx="2.5"
          fill="currentColor"
          opacity="0.85"
        />
        <line
          x1="16"
          y1="17"
          x2="16"
          y2="25"
          stroke="#F5C453"
          strokeWidth={2}
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
        Loading
      </span>
    </div>
  )
}

export default LogoLoader
