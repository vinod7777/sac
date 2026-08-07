import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  width?: "fit-content" | "100%";
}

export function Reveal({ children, delay = 0, className = "", width = "100%" }: RevealProps) {
  return (
    <div style={{ width }} className={className}>
      <motion.div
        className={className.includes("h-full") ? "h-full" : undefined}
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, delay, type: "spring", bounce: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
