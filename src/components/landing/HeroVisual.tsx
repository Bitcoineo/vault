"use client";

export function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center md:justify-end md:pr-[8%]">
      {/* Ambient radial glow */}
      <div
        className="absolute h-[600px] w-[600px] md:h-[800px] md:w-[800px]"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 500 500"
        className="relative h-[280px] w-[280px] md:h-[500px] md:w-[500px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Globe gradient */}
          <radialGradient id="globe-fill" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0.6" />
          </radialGradient>

          {/* Arc gradients */}
          <linearGradient id="arc1-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arc2-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arc3-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>

          {/* Dot glow filter */}
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arc paths for animateMotion */}
          <path
            id="arc-path-1"
            d="M 180 190 Q 250 120 350 200"
            fill="none"
          />
          <path
            id="arc-path-2"
            d="M 320 160 Q 250 80 150 170"
            fill="none"
          />
          <path
            id="arc-path-3"
            d="M 200 340 Q 250 250 330 310"
            fill="none"
          />
        </defs>

        {/* Globe circle */}
        <circle
          cx="250"
          cy="250"
          r="160"
          fill="url(#globe-fill)"
          stroke="#1e3a5f"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* Latitude lines */}
        <ellipse
          cx="250"
          cy="200"
          rx="155"
          ry="30"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.6"
          opacity="0.4"
        />
        <ellipse
          cx="250"
          cy="250"
          rx="160"
          ry="40"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.8"
          opacity="0.5"
        />
        <ellipse
          cx="250"
          cy="300"
          rx="155"
          ry="30"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.6"
          opacity="0.4"
        />

        {/* Meridian lines */}
        <ellipse
          cx="250"
          cy="250"
          rx="40"
          ry="160"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.6"
          opacity="0.4"
        />
        <ellipse
          cx="250"
          cy="250"
          rx="100"
          ry="160"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.6"
          opacity="0.35"
        />

        {/* Scatter dots — ambient */}
        {[
          [140, 210], [170, 280], [200, 160], [230, 320], [270, 180],
          [300, 290], [320, 220], [350, 270], [190, 240], [310, 340],
          [160, 320], [340, 190], [280, 140], [220, 350], [380, 250],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="1"
            fill="#3B82F6"
            opacity="0.25"
          >
            <animate
              attributeName="opacity"
              values="0.15;0.4;0.15"
              dur={`${3 + (i % 4)}s`}
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Location dots with pulsing glow */}
        {[
          { cx: 180, cy: 190, delay: "0s" },
          { cx: 350, cy: 200, delay: "1s" },
          { cx: 320, cy: 160, delay: "0.5s" },
          { cx: 150, cy: 170, delay: "1.5s" },
          { cx: 200, cy: 340, delay: "0.8s" },
          { cx: 330, cy: 310, delay: "2s" },
        ].map((dot, i) => (
          <g key={`loc-${i}`} filter="url(#dot-glow)">
            {/* Pulse ring */}
            <circle cx={dot.cx} cy={dot.cy} r="3" fill="none" stroke="#60A5FA" strokeWidth="1">
              <animate
                attributeName="r"
                values="3;10;3"
                dur="3s"
                begin={dot.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="3s"
                begin={dot.delay}
                repeatCount="indefinite"
              />
            </circle>
            {/* Core dot */}
            <circle cx={dot.cx} cy={dot.cy} r="3" fill="#60A5FA" opacity="0.9" />
          </g>
        ))}

        {/* Arc 1 — drawn line */}
        <path
          d="M 180 190 Q 250 120 350 200"
          fill="none"
          stroke="url(#arc1-grad)"
          strokeWidth="1.5"
          strokeDasharray="200"
          strokeDashoffset="200"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="200;0;0;200"
            dur="6s"
            keyTimes="0;0.3;0.7;1"
            repeatCount="indefinite"
          />
        </path>
        {/* Traveling dot on arc 1 */}
        <circle r="3" fill="#60A5FA" opacity="0">
          <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;0.3;0.7;1" calcMode="linear">
            <mpath href="#arc-path-1" />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            dur="6s"
            keyTimes="0;0.05;0.65;0.7"
            repeatCount="indefinite"
          />
        </circle>

        {/* Arc 2 — drawn line */}
        <path
          d="M 320 160 Q 250 80 150 170"
          fill="none"
          stroke="url(#arc2-grad)"
          strokeWidth="1.5"
          strokeDasharray="220"
          strokeDashoffset="220"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="220;0;0;220"
            dur="7s"
            begin="2s"
            keyTimes="0;0.3;0.7;1"
            repeatCount="indefinite"
          />
        </path>
        {/* Traveling dot on arc 2 */}
        <circle r="3" fill="#60A5FA" opacity="0">
          <animateMotion dur="7s" begin="2s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;0.3;0.7;1" calcMode="linear">
            <mpath href="#arc-path-2" />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            dur="7s"
            begin="2s"
            keyTimes="0;0.05;0.65;0.7"
            repeatCount="indefinite"
          />
        </circle>

        {/* Arc 3 — drawn line */}
        <path
          d="M 200 340 Q 250 250 330 310"
          fill="none"
          stroke="url(#arc3-grad)"
          strokeWidth="1.5"
          strokeDasharray="160"
          strokeDashoffset="160"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="160;0;0;160"
            dur="5s"
            begin="1s"
            keyTimes="0;0.3;0.7;1"
            repeatCount="indefinite"
          />
        </path>
        {/* Traveling dot on arc 3 */}
        <circle r="2.5" fill="#60A5FA" opacity="0">
          <animateMotion dur="5s" begin="1s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;0.3;0.7;1" calcMode="linear">
            <mpath href="#arc-path-3" />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            dur="5s"
            begin="1s"
            keyTimes="0;0.05;0.65;0.7"
            repeatCount="indefinite"
          />
        </circle>

        {/* Outer ring — subtle orbit */}
        <circle
          cx="250"
          cy="250"
          r="200"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.3"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 250 250"
            to="360 250 250"
            dur="60s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Connecting lines from globe dots to card positions */}
        <line x1="150" y1="170" x2="60" y2="100" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.2" />
        <line x1="350" y1="200" x2="440" y2="360" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.2" />
        <line x1="200" y1="340" x2="160" y2="420" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.2" />
      </svg>

      {/* Floating file cards — positioned near globe edges */}
      <div
        className="absolute hidden md:block"
        style={{
          right: "calc(8% + 230px)",
          top: "22%",
          animation: "hero-float-1 6s ease-in-out infinite",
        }}
      >
        <div className="flex items-center gap-2.5 rounded-lg border border-[#1e3a5f]/40 bg-[#0D0D14]/80 px-3.5 py-2.5 backdrop-blur-sm">
          <div className="h-8 w-6 rounded-sm bg-[#3B82F6]/30" />
          <div className="space-y-1.5">
            <div className="h-1.5 w-14 rounded-full bg-[#8B95A5]/30" />
            <div className="h-1 w-10 rounded-full bg-[#8B95A5]/20" />
          </div>
        </div>
      </div>

      <div
        className="absolute hidden md:block"
        style={{
          right: "calc(8% - 30px)",
          bottom: "22%",
          animation: "hero-float-2 7s ease-in-out infinite",
        }}
      >
        <div className="flex items-center gap-2.5 rounded-lg border border-[#1e3a5f]/40 bg-[#0D0D14]/80 px-3.5 py-2.5 backdrop-blur-sm">
          <div className="h-8 w-6 rounded-sm bg-[#10B981]/30" />
          <div className="space-y-1.5">
            <div className="h-1.5 w-12 rounded-full bg-[#8B95A5]/30" />
            <div className="h-1 w-8 rounded-full bg-[#8B95A5]/20" />
          </div>
        </div>
      </div>

      <div
        className="absolute hidden md:block"
        style={{
          right: "calc(8% + 140px)",
          bottom: "14%",
          animation: "hero-float-3 8s ease-in-out infinite",
        }}
      >
        <div className="flex items-center gap-2.5 rounded-lg border border-[#1e3a5f]/40 bg-[#0D0D14]/80 px-3.5 py-2.5 backdrop-blur-sm">
          <div className="h-8 w-6 rounded-sm bg-[#F59E0B]/30" />
          <div className="space-y-1.5">
            <div className="h-1.5 w-16 rounded-full bg-[#8B95A5]/30" />
            <div className="h-1 w-10 rounded-full bg-[#8B95A5]/20" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes hero-float-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes hero-float-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        @keyframes hero-float-3 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
