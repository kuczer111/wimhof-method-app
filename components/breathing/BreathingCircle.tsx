"use client";

import { motion } from "framer-motion";

type Pace = "slow" | "medium" | "fast";

interface BreathingCircleProps {
  pace: Pace;
  isActive?: boolean;
}

const paceDurations: Record<Pace, number> = {
  slow: 2.5,
  medium: 2,
  fast: 1.5,
};

export default function BreathingCircle({
  pace,
  isActive = true,
}: BreathingCircleProps) {
  const duration = paceDurations[pace];

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="rounded-full bg-sky-500/30 flex items-center justify-center"
        style={{ width: 200, height: 200 }}
        animate={
          isActive
            ? { scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }
            : { scale: 1, opacity: 0.4 }
        }
        transition={
          isActive
            ? {
                duration,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.4 }
        }
      >
        <div className="w-16 h-16 rounded-full bg-sky-400" />
      </motion.div>
    </div>
  );
}
