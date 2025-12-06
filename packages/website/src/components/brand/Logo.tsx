'use client';

// Animated MCQMCP logo - represents data flowing in/out
export function Logo({ size = 32, animate = true }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={animate ? 'group' : ''}
    >
      {/* Outer ring - represents the measurement loop */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="#DA7756"
        strokeWidth="2"
        fill="none"
        className={animate ? 'origin-center group-hover:animate-spin' : ''}
        style={animate ? { animationDuration: '8s' } : {}}
      />

      {/* Data flow arrows - content out (top) */}
      <path
        d="M20 6 L20 2 M17 4 L20 1 L23 4"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-pulse' : ''}
        style={{ animationDelay: '0s' }}
      />

      {/* Data flow arrows - data back (bottom) */}
      <path
        d="M20 34 L20 38 M17 36 L20 39 L23 36"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-pulse' : ''}
        style={{ animationDelay: '0.5s' }}
      />

      {/* Center - MCQ representation (4 options like A B C D) */}
      <g className={animate ? 'group-hover:scale-110 transition-transform origin-center' : ''}>
        {/* Option circles arranged in 2x2 grid */}
        <circle cx="14" cy="14" r="4" fill="#DA7756" />
        <circle cx="26" cy="14" r="4" fill="#E8E7E3" stroke="#D9D8D4" strokeWidth="1" />
        <circle cx="14" cy="26" r="4" fill="#E8E7E3" stroke="#D9D8D4" strokeWidth="1" />
        <circle cx="26" cy="26" r="4" fill="#E8E7E3" stroke="#D9D8D4" strokeWidth="1" />

        {/* Checkmark on selected option */}
        <path
          d="M11.5 14 L13.5 16 L17 12"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Animated data dots flowing around the circle */}
      {animate && (
        <>
          <circle r="2" fill="#7C3AED" className="animate-orbit-1">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M20,2 A18,18 0 0,1 38,20"
            />
          </circle>
          <circle r="2" fill="#059669" className="animate-orbit-2">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M38,20 A18,18 0 0,1 20,38"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

// Simpler static version for small sizes
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Simplified: just the MCQ grid with one selected */}
      <rect width="24" height="24" rx="6" fill="#DA7756" />
      <circle cx="8" cy="8" r="3" fill="white" />
      <circle cx="16" cy="8" r="3" fill="white" fillOpacity="0.4" />
      <circle cx="8" cy="16" r="3" fill="white" fillOpacity="0.4" />
      <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.4" />
      <path
        d="M6 8 L7.5 9.5 L10 6.5"
        stroke="#DA7756"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
