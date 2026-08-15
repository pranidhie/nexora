type NexoraLogoProps = {
  size?: number
  showWordmark?: boolean
}

function NexoraLogo({
  size = 56,
  showWordmark = false,
}: NexoraLogoProps) {
  return (
    <div
      className="nexora-logo"
      aria-label="NEXORA"
      role="img"
    >
      <svg
        className="nexora-logo-symbol"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="nexora-gradient"
            x1="10"
            y1="8"
            x2="54"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7BEAFF" />
            <stop offset="1" stopColor="#079FE8" />
          </linearGradient>

          <filter
            id="nexora-glow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur
              stdDeviation="2.5"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="17"
          fill="#071827"
          stroke="#1E5A78"
          strokeWidth="1.5"
        />

        <path
          d="M18 45V19L46 45V19"
          stroke="url(#nexora-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#nexora-glow)"
        />

        <circle cx="18" cy="19" r="3.5" fill="#7BEAFF" />
        <circle cx="46" cy="19" r="3.5" fill="#39CCFA" />
        <circle cx="46" cy="45" r="3.5" fill="#079FE8" />
      </svg>

      {showWordmark && (
        <div className="nexora-wordmark">
          <strong>NEXORA</strong>
          <span>Enterprise Quality Engineering</span>
        </div>
      )}
    </div>
  )
}

export default NexoraLogo