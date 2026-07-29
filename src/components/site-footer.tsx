import { Link } from '@tanstack/react-router';
import logo from '@/assets/logo/1.svg';

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/5 mt-24">
      <div className="mx-auto max-w-350 px-5 lg:px-10 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="logo" className="h-12 aspect-square" />
            <span className="font-display text-xl tracking-tight">Atelier</span>
          </Link>
          <p className="mt-4 text-sm text-foreground/60 max-w-sm">
            The home of architecture, interiors, events, civil works and craft. Show the work. Find
            the work.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Discover</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/explore" className="hover:underline">
                Explore
              </Link>
            </li>
            <li>
              <Link to="/jobs" className="hover:underline">
                Jobs
              </Link>
            </li>
            <li>
              <Link
                search={{ reference: undefined, trxref: undefined }}
                to="/pricing"
                className="hover:underline"
              >
                Go Pro
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Account</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/auth" className="hover:underline">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact & Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-foreground/5">
        <div className="mx-auto max-w-350 px-5 lg:px-10 py-6 flex flex-col md:flex-row gap-2 justify-between text-xs text-foreground/50">
          <span>© {new Date().getFullYear()} Atelier — A platform for spatial creatives.</span>
          <span>Made for architects, designers, engineers & makers.</span>
        </div>
      </div>
    </footer>
  );
}
