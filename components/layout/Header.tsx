import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-lg">Macro</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/news">News</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 hover:bg-secondary rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground text-muted-foreground"
    >
      {children}
    </Link>
  );
}
