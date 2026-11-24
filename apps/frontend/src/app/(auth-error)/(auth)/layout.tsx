"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

import GridShape from "@/shared/components/ui/common/GridShape";
import ThemeTogglerTwo from "@/shared/components/ui/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import TypingText from "@/components/ui/animata/text/typing-text";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
          {children}
          <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
            <div className="relative flex items-center justify-center z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.6,
                    rotateX: 40,
                    filter: "blur(8px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateX: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    delay: 0.25,
                    type: "spring",
                    stiffness: 140,
                    damping: 12,
                    mass: 0.8,
                  }}
                  whileHover={{
                    scale: 1.06,
                    filter: "drop-shadow(0 0 12px rgba(82, 106, 142, 0.3))",
                    transition: { type: "spring", stiffness: 300, damping: 15 },
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="mb-4 block"
                  style={{ perspective: 800, transformStyle: "preserve-3d" }}
                >
                  <Link href="/">
                    <motion.div
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1.2,
                      }}
                    >
                      <Image
                        width={231}
                        height={48}
                        src="./images/logo/auth-logo.svg"
                        alt="Logo"
                        priority
                      />
                    </motion.div>
                  </Link>
                </motion.div>

                <TypingText
                  text="ShZ Coding"
                  delay={90}
                  repeat={false}
                  className="text-xl font-bold tracking-tight text-white mr-9"
                />
              </div>
            </div>
          </div>
          <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
