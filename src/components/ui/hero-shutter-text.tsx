"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export interface HeroTextProps {
  text?: string;
  className?: string;
}

export function HeroText({
  text = "HYDRO COMMAND",
  className = "",
}: HeroTextProps) {
  const [count, setCount] = useState(0);
  const characters = text.split("");

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-full w-full bg-transparent transition-colors duration-700 py-6",
        className
      )}
    >
      {/* Immersive Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #12544F 1px, transparent 1px), linear-gradient(to bottom, #12544F 1px, transparent 1px)`,
          backgroundSize: "clamp(20px, 5vw, 60px) clamp(20px, 5vw, 60px)",
        }}
      />

      {/* Main Text Container */}
      <div className="relative z-10 w-full px-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            className="flex flex-wrap justify-center items-center w-full"
          >
            {characters.map((char, i) => (
              <div
                key={i}
                className="relative px-[0.15vw] overflow-hidden group"
              >
                {/* Main Character - Responsive sizing using vw */}
                <motion.span
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.03 + 0.2, duration: 0.7 }}
                  className="text-[8vw] sm:text-[6vw] md:text-[5vw] leading-none font-black text-brand-ink tracking-tighter"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>

                {/* Top Slice Layer */}
                <motion.span
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "100%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.03,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 text-[8vw] sm:text-[6vw] md:text-[5vw] leading-none font-black text-brand-teal z-10 pointer-events-none"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)" }}
                >
                  {char}
                </motion.span>

                {/* Middle Slice Layer */}
                <motion.span
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: "-100%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.03 + 0.1,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 text-[8vw] sm:text-[6vw] md:text-[5vw] leading-none font-black text-brand-emerald z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                  }}
                >
                  {char}
                </motion.span>

                {/* Bottom Slice Layer */}
                <motion.span
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "100%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.03 + 0.2,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 text-[8vw] sm:text-[6vw] md:text-[5vw] leading-none font-black text-brand-teal z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                  }}
                >
                  {char}
                </motion.span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating UI Trigger */}
      <div className="mt-4 flex flex-col items-center gap-2 z-20">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCount((c) => c + 1)}
          className="p-2.5 bg-brand-ink text-white rounded-full shadow-lg hover:bg-brand-teal transition-colors duration-300"
          title="Click to re-shutter animation"
          data-magnetic
        >
          <RefreshCw size={16} />
        </motion.button>
        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-brand-ink/40">
          Click to re-shutter
        </p>
      </div>
    </div>
  );
}

export default HeroText;
