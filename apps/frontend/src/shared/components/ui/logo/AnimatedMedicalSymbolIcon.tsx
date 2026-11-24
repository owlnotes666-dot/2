"use client";

import { motion, MotionConfig } from "framer-motion";


type AnimatedMedicalSymbolIconProps = {

  size?: number | string;
  className?: string;

  ambient?: boolean;
};



const INK = "var(--foreground)"; // original line-work color

type FillPath = { d: string; fill: string; stroke?: string; sw?: number };


const FILLS: FillPath[] = [
  {
    d: "M31.88 32.544h3.075a1.957 1.957 0 1 1 0 3.915H22.093a6.291 6.291 0 1 0 0 12.583h5.82l.152-4.194h-5.692c-1.081 0-2.115-.892-2.115-1.973s1.034-1.942 2.115-1.942h12.443a6.291 6.291 0 1 0 0-12.583H31.88z",
    fill: "var(--color-brand-600)",
    stroke: "var(--color-brand-500)",
    sw: 1.8,
  },
  {
    d: "M25.682 52.957h6.256c1.072 0 2.006-.826 2.038-1.897a1.957 1.957 0 0 0-1.956-2.018v-4.194h.269c3.411 0 6.317 2.653 6.438 6.062a6.29 6.29 0 0 1-6.288 6.52H21.394h0a6.1 6.1 0 0 1 3.063-4.161h0a2.56 2.56 0 0 1 1.224-.312",
    fill: "var(--color-brand-700)",
    stroke: "var(--color-brand-700)",
    sw: 1.8,
  },
  {
    d: "M38.526 49.554q.174.652.2 1.356a6.29 6.29 0 0 1-6.287 6.52H21.394h0a6.1 6.1 0 0 1 3.063-4.161h0a2.56 2.56 0 0 1 1.225-.312h6.256c.626 0 1.205-.282 1.585-.73z",
    fill: "var(--color-brand-600)",
    stroke: "var(--color-brand-500)",
    sw: 2,
  },
  {
    d: "M32.02 49.042h-3.756v-4.194h3.756",
    fill: "var(--color-brand-700)",
    stroke: "var(--color-brand-700)",
    sw: 1.8,
  },
  {
    d: "M22.017 39.95s-7.083 1.372-6.698 5.557c0 0 1.502 2.853 3.324 3.317l5.413 1.227h2.993v-6.2l-5.183-.039l-1.493-.648l1.426-1.743z",
    fill: "var(--color-brand-700)",
  },
  {
    d: "M53.129 19.883c0 4.333-7.5 4.5-7.5 4.5l-9.034.048l-.212.004H19.417c-.975 0-1.878.667-2.035 1.629a1.96 1.96 0 0 0 1.93 2.286H28.1l-.066 4.194h-8.737c-3.444 0-6.448-2.654-6.551-6.097a6.29 6.29 0 0 1 6.288-6.485H35.88a2.07 2.07 0 0 0 1.89-1.609a6.57 6.57 0 0 1 6.397-5.062",
    fill: "var(--color-brand-600)",
    stroke: "var(--color-brand-500)",
    sw: 1.8,
  },
  {
    d: "M44.167 13.291c3.628 0 8.962 2.964 8.962 6.592",
    fill: "var(--color-brand-600)",
  },
  {
    d: "M40.055 35.098s.311-2.145-.55-3.254c-1.12-1.443-2.66-3.905-5.026-4.498h-6.025l.184 6.203h6.604c.813-.273 1.262-.228 1.79-.07c.875.263 1.693.689 2.443 1.213zm-22.737-7.255c.963.79 2.403.548 3.055-.515l6.877.018l-.08 6.19c-1.798-.03-3.685.107-5.022-.125c-7.325-1.267-8.036-5.282-8.036-5.282s.449-4.693 5.382-4.693l-1.556 1.56a2.1 2.1 0 0 0-1.508 1.906z",
    fill: "var(--color-brand-700)",
  },
];

type OutlinePath = { d: string; sw: number };

/** Dark line-work, "hand-drawn" over the body with pathLength */
const OUTLINES: OutlinePath[] = [
  {
    d: "M24.13 44.848h-1.8a1.957 1.957 0 1 1 0-3.915h12.444a6.291 6.291 0 1 0 0-12.583h-2.937",
    sw: 2,
  },
  {
    d: "M31.837 32.544h3.076a1.957 1.957 0 1 1 0 3.915H22.05a6.291 6.291 0 1 0 0 12.583h2.08",
    sw: 2,
  },
  {
    d: "M24.066 32.544h-4.77c-3.444 0-6.448-2.654-6.551-6.097a6.29 6.29 0 0 1 6.288-6.485H35.88a2.07 2.07 0 0 0 1.89-1.609a6.57 6.57 0 0 1 6.397-5.062",
    sw: 2,
  },
  {
    d: "M53.129 19.883c0 4.333-7.5 4.5-7.5 4.5l-9.034.048l-.212.004H19.417c-.975 0-1.878.667-2.035 1.629a1.96 1.96 0 0 0 1.93 2.286h4.754",
    sw: 2,
  },
  {
    d: "M44.167 13.291c3.628 0 8.962 2.964 8.962 6.592",
    sw: 1.8,
  },
  {
    d: "M32.02 44.848h.269c3.411 0 6.317 2.653 6.438 6.062a6.29 6.29 0 0 1-6.288 6.52H21.394h0a6.1 6.1 0 0 1 3.063-4.161h0a2.56 2.56 0 0 1 1.225-.312h6.256c1.072 0 2.006-.826 2.038-1.897a1.957 1.957 0 0 0-1.956-2.018",
    sw: 2,
  },
];

/** The vertical staff — drawn first, anchors the whole icon */
const STAFF_D =
  "M28.065 58.237v4.725m0-21.104v10.019m0-26.479v10.178m0-20.538v3.843";

/** Energy strokes at the top-right */
const SPARKLE_D =
  "M50.98 23.838s3.794 4.054 7.586 4.577m-.497 0l4.838-2.223m-3.792 6.8l-1.046-4.577";

const GLOW = "drop-shadow(0 4px 10px rgba(82, 106, 142, 0.3))";

/** Heartbeat rhythm: lub-dub…rest */
const HEARTBEAT = [1, 1.03, 1, 1.06, 1];
const HEARTBEAT_TIMES = [0, 0.12, 0.24, 0.38, 1];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnimatedMedicalSymbolIcon = ({
  size = 72,
  className,
  ambient = true,
}: AnimatedMedicalSymbolIconProps) => {
  return (
    // Respects the user's OS-level "reduce motion" preference
    <MotionConfig reducedMotion="user">
      <div
        className={className}
        style={{
          display: "inline-block",
          position: "relative",
          perspective: 800,
        }}
      >
        {/* Entrance / hover / tap — real 3D tilt thanks to the perspective above */}
        <motion.div
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, scale: 0.4, rotateY: -120 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 170, damping: 15 }}
          whileHover={{ scale: 1.12, rotateY: 18, rotateX: -12 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Heartbeat glow ring behind the icon */}
          {ambient && (
            <motion.span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "6%",
                borderRadius: "9999px",
                background:
                  "radial-gradient(circle, rgba(82,106,142,0.28) 0%, rgba(82,106,142,0) 70%)",
                pointerEvents: "none",
              }}
              initial={{ opacity: 0 }}
              animate={{ scale: [0.85, 1.35], opacity: [0.45, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 1.1,
                repeatDelay: 0.7,
              }}
            />
          )}

          {/* Floating + heartbeat (transform-only → compositor friendly) */}
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 72 72"
            role="img"
            aria-label="Medical symbol"
            style={{ display: "block", filter: GLOW }}
            animate={ambient ? { y: [0, -4, 0], scale: HEARTBEAT } : undefined}
            transition={{
              y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
              scale: {
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                times: HEARTBEAT_TIMES,
              },
            }}
          >
            {/* 1 — the staff draws itself (bottom → top) */}
            <motion.path
              d={STAFF_D}
              fill="none"
              stroke={INK}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.05, duration: 0.55, ease: "easeInOut" }}
            />

            {/* 2 — the ball pops on top, then keeps a soft pulse */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 320,
                damping: 14,
              }}
              style={{ transformOrigin: "28.065px 12.038px" }}
            >
              <motion.circle
                cx={28.065}
                cy={12.038}
                r={3}
                fill={INK}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                animate={ambient ? { scale: [1, 1.35, 1] } : undefined}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.4,
                }}
              />
            </motion.g>

            {/* 3 — colored body springs in, piece by piece */}
            {FILLS.map((p, i) => (
              <motion.path
                key={p.d}
                d={p.d}
                fill={p.fill}
                stroke={p.stroke ?? "none"}
                strokeWidth={p.sw ?? 0}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={10}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.5 + i * 0.07,
                  type: "spring",
                  stiffness: 240,
                  damping: 16,
                }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            ))}

            {/* 4 — line-work is "hand-drawn" over the body */}
            {OUTLINES.map((p, i) => (
              <motion.path
                key={p.d}
                d={p.d}
                fill="none"
                stroke={INK}
                strokeWidth={p.sw}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeMiterlimit={10}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 1 + i * 0.1,
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* 5 — energy strokes twinkle forever */}
            <motion.path
              d={SPARKLE_D}
              fill="none"
              stroke={INK}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit={10}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={
                ambient
                  ? {
                      opacity: [0, 1, 0.35, 1, 0],
                      scale: [0.7, 1, 0.85, 1, 0.7],
                    }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                ambient
                  ? {
                      delay: 1.7,
                      duration: 2.4,
                      repeat: Infinity,
                      times: [0, 0.2, 0.45, 0.7, 1],
                      ease: "easeInOut",
                    }
                  : { delay: 1.7, duration: 0.6 }
              }
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          </motion.svg>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default AnimatedMedicalSymbolIcon;