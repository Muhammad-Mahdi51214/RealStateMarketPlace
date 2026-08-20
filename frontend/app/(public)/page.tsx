"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;

export default function LandingPage() {
  return (
    <div className="bg-bg-base">
      <section className="relative min-h-[100svh] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease }}
        >
          <Image
            src="/images/landing-hero-neighborhood.png"
            alt=""
            fill
            priority
            className="object-cover object-[center_35%]"
            sizes="100vw"
          />
        </motion.div>

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 60% at 50% 42%, rgba(6,14,32,0.72) 0%, rgba(6,14,32,0.42) 55%, rgba(6,14,32,0.78) 100%), linear-gradient(180deg, rgba(6,14,32,0.55) 0%, rgba(6,14,32,0.28) 40%, rgba(6,14,32,0.75) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center px-4 pb-24 pt-28 text-center sm:px-6">
          <h1
            className="font-[family-name:var(--font-display)] text-[clamp(3.25rem,11vw,7rem)] font-semibold leading-[0.95] tracking-[-0.02em]"
            style={{
              textShadow:
                "0 1px 2px rgba(0,0,0,0.55), 0 8px 28px rgba(0,0,0,0.4)",
            }}
          >
            <span className="sr-only">Real State Market Place</span>
            <span aria-hidden className="block">
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease }}
                className="block text-white"
              >
                Real State
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.45, ease }}
                className="mt-1 block text-[#E8C56A] sm:mt-2"
              >
                MarketPlace
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.85, ease }}
            className="mt-7 h-px w-24 origin-center bg-white/55 sm:w-32"
          />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0, ease }}
            className="mt-6 max-w-md text-[15px] font-medium leading-relaxed tracking-[0.02em] text-white/92 sm:text-lg"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
          >
            Verified plots. Clear process. Built on trust.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-md border-0 bg-white px-8 text-[15px] font-semibold text-[#0B1F3A] shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition-colors duration-300 hover:bg-[#F3F1EC]"
            >
              <Link href="/inventory">Browse inventory</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-md border-2 border-white/80 bg-[#0B1F3A]/45 px-8 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)] backdrop-blur-[2px] transition-colors duration-300 hover:border-white hover:bg-[#0B1F3A]/65 hover:text-white"
            >
              <Link href="/buy-property">Buy property</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease }}
          className="max-w-2xl"
        >
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-primary-navy sm:text-4xl">
            A marketplace you can rely on
          </h2>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Find verified inventory, follow a clear purchase path, and work with
            trusted partners — without the guesswork.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {[
            {
              icon: MapPinned,
              title: "Verified inventory",
              body: "Browse live plots with clear status and transparent pricing.",
            },
            {
              icon: ShieldCheck,
              title: "Secure process",
              body: "Reservation, payment, and document checks stay in one flow.",
            },
            {
              icon: BadgeCheck,
              title: "Trusted partners",
              body: "Hire approved vendors and track materials for your build.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease }}
            >
              <item.icon className="h-6 w-6 text-primary-teal" strokeWidth={1.75} />
              <h3 className="mt-4 text-lg font-semibold text-primary-navy">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-[#F7FAF8]">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6">
          <div className="max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-primary-navy sm:text-3xl">
              Ready when you are
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Start with the map, pick a plot, and move forward with confidence.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-md bg-primary-navy px-6">
            <Link href="/inventory">Explore the map</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
