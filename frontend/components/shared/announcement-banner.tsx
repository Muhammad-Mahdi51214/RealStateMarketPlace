"use client";

import { motion } from "framer-motion";

export function AnnouncementBanner() {
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-primary-navy px-4 py-2 text-center text-sm font-medium text-white"
    >
      Real State Market Place · Verified plots. Clear process. Built on trust.
    </motion.div>
  );
}
