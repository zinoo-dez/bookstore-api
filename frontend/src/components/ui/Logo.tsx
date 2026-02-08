export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Roof */}
        <path
          d="M6 14 L16 6 L26 14"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* House body */}
        <rect
          x="9"
          y="14"
          width="14"
          height="13"
          rx="2.5"
          fill="currentColor"
          opacity="0.85"
        />

        {/* Treasure line (gold accent) */}
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

      {/* Text */}
      <span className="text-lg font-semibold tracking-wide">
        <span className="font-semibold">Treasure</span>{' '}
        <span className="font-normal opacity-90">House</span>
      </span>
    </div>
  )
}
