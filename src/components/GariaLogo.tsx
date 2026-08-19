import React from "react";

interface GariaLogoProps {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  variant?: "icon" | "full" | "horizontal" | "badge" | "minimal";
  showTagline?: boolean;
  withGlow?: boolean;
  animate?: boolean;
  onClick?: () => void;
  id?: string;
}

export const GariaLogo: React.FC<GariaLogoProps> = ({
  size = "md",
  className = "",
  variant = "icon",
  showTagline = false,
  withGlow = false,
  animate = false,
  onClick,
  id = "garia-os-official-logo",
}) => {
  // Resolve pixel size
  let pxSize = 40;
  if (typeof size === "number") {
    pxSize = size;
  } else {
    switch (size) {
      case "xs":
        pxSize = 20;
        break;
      case "sm":
        pxSize = 28;
        break;
      case "md":
        pxSize = 38;
        break;
      case "lg":
        pxSize = 48;
        break;
      case "xl":
        pxSize = 64;
        break;
      case "2xl":
        pxSize = 96;
        break;
      case "3xl":
        pxSize = 128;
        break;
    }
  }

  // Unique ID suffix to prevent SVG gradient collisions when multiple logos are rendered
  const uid = React.useId().replace(/:/g, "_");

  const iconSvg = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        withGlow ? "filter drop-shadow-[0_0_16px_rgba(168,85,247,0.45)]" : ""
      } ${animate ? "hover:scale-105 transition-transform duration-300" : ""}`}
      style={{ width: pxSize, height: pxSize }}
    >
      <svg
        viewBox="0 0 512 512"
        width={pxSize}
        height={pxSize}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Radial Gradient */}
          <radialGradient id={`bgGrad_${uid}`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1e0b36" />
            <stop offset="60%" stopColor="#120424" />
            <stop offset="100%" stopColor="#080114" />
          </radialGradient>

          {/* Main "R" Gradient (Deep Violet -> Lilac) */}
          <linearGradient id={`rGradMain_${uid}`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="30%" stopColor="#a855f7" />
            <stop offset="70%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>

          {/* Secondary Ribbon Loop Gradient (3D Fold) */}
          <linearGradient id={`rGradLoop_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="35%" stopColor="#c084fc" />
            <stop offset="75%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>

          {/* Orbital Ring Arc Gradient */}
          <linearGradient id={`ringGrad_${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f3e8ff" />
          </linearGradient>

          {/* Star Glow Filter */}
          <filter id={`starGlow_${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* 3D Drop Shadow */}
          <filter id={`rShadow_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer Rounded Container with subtle border */}
        <rect
          width="512"
          height="512"
          rx="128"
          fill={`url(#bgGrad_${uid})`}
        />
        <rect
          width="508"
          height="508"
          x="2"
          y="2"
          rx="126"
          fill="none"
          stroke="rgba(192, 132, 252, 0.25)"
          strokeWidth="4"
        />

        {/* Ambient Glow */}
        <circle cx="256" cy="240" r="170" fill="#7c3aed" opacity="0.18" filter="blur(28px)" />

        {/* Orbital Ring Arc */}
        <path
          d="M 125 330 A 185 185 0 1 1 405 165"
          fill="none"
          stroke={`url(#ringGrad_${uid})`}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* 4-Pointed Sparkle Star at Top-Right of Orbital Arch */}
        <g transform="translate(415, 160)" filter={`url(#starGlow_${uid})`}>
          <path
            d="M 0 -22 Q 0 0 -22 0 Q 0 0 0 22 Q 0 0 22 0 Q 0 0 0 -22 Z"
            fill="#f3e8ff"
          />
          <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
        </g>

        {/* Stylized 3D "R" Symbol */}
        <g filter={`url(#rShadow_${uid})`}>
          {/* Vertical Stem */}
          <path
            d="M 172 150
               C 172 142, 180 136, 190 136
               L 226 136
               C 236 136, 242 142, 242 152
               L 242 350
               C 242 360, 234 366, 222 366
               L 190 366
               C 180 366, 172 358, 172 348
               Z"
            fill={`url(#rGradMain_${uid})`}
          />

          {/* Upper Loop Ribbon */}
          <path
            d="M 226 136
               C 290 136, 348 155, 348 215
               C 348 268, 298 285, 238 285
               L 220 285
               L 220 236
               L 238 236
               C 270 236, 295 228, 295 210
               C 295 192, 270 184, 226 184
               Z"
            fill={`url(#rGradLoop_${uid})`}
          />

          {/* Diagonal Leg */}
          <path
            d="M 236 260
               L 310 355
               C 316 363, 326 366, 338 366
               L 358 366
               C 368 366, 372 356, 365 348
               L 285 248
               Z"
            fill={`url(#rGradMain_${uid})`}
          />
        </g>
      </svg>
    </div>
  );

  if (variant === "icon") {
    return (
      <div id={id} className={`inline-flex items-center ${className}`} onClick={onClick}>
        {iconSvg}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        id={id}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 backdrop-blur-md ${className}`}
        onClick={onClick}
      >
        {iconSvg}
        <div className="flex flex-col text-left">
          <span className="font-heading font-black text-xs tracking-tight text-white flex items-center gap-1">
            GARIA <span className="text-purple-400">OS</span>
          </span>
          <span className="text-[9px] font-mono text-purple-300/80">v3.0.0</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`inline-flex items-center gap-3 text-left ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {iconSvg}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-base sm:text-lg tracking-tight text-white">
            GARIA
          </span>
          <span className="font-heading font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            OS
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-purple-300/80 uppercase">
            Plan • Grow • Achieve
          </span>
        )}
      </div>
    </div>
  );
};
