"use client";
import type { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export type EaseInDivProps = {
  children: ReactNode;
} & Omit<HTMLMotionProps<"div">, "initial" | "animate">;

export function EaseInDiv(props: EaseInDivProps) {
  return (
    <motion.div
      {...props}
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
    >
      {props.children}
    </motion.div>
  );
}
