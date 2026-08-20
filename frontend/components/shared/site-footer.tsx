import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/images/csc-logo.png"
            alt="Real State Market Place"
            width={72}
            height={56}
            className="mb-3 h-14 w-auto object-contain brightness-0 invert"
          />
          <p className="text-lg font-bold tracking-wide">REAL STATE</p>
          <p className="mt-1 text-sm font-semibold tracking-[0.18em] text-accent-green">
            MARKET PLACE
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            A trusted property marketplace for verified plots, clear purchase
            flows, and partners you can rely on.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white/60">
            Quick Links
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            <li>
              <Link href="/buy-property" className="hover:text-white">
                View Properties
              </Link>
            </li>
            <li>
              <Link href="/seek-vendor" className="hover:text-white">
                Seek a vendor
              </Link>
            </li>
            <li>
              <Link href="/materials" className="hover:text-white">
                Materials marketplace
              </Link>
            </li>
            <li>
              <Link href="/town-plan" className="hover:text-white">
                Town Plan
              </Link>
            </li>
            <li>
              <Link href="/register/vendor" className="hover:text-white">
                Register as vendor
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Register Now
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white/60">
            Contact
          </p>
          <p className="mt-3 text-sm text-white/85">
            Real State Market Place
            <br />
            Islamabad, Pakistan
            <br />
            info@realstatemarketplace.com
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} Real State Market Place. All rights
        reserved. · Privacy · Terms · Cookies
      </div>
    </footer>
  );
}
