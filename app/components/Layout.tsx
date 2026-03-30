"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  BookOpen,
  BarChart3,
  Search,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vendors", icon: Users, label: "Vendors" },
  { to: "/purchases", icon: ShoppingCart, label: "Purchases" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/ledger", icon: BookOpen, label: "Vendor Ledger" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const currentPage =
    navItems.find((n) => n.to === pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(222, 47%, 11%)" }}
      >
        <div
          className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ borderColor: "hsl(222, 47%, 18%)" }}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
            style={{ background: "hsl(221, 83%, 53%)", color: "white" }}
          >
          OS
          </div>
          <span className="text-base font-semibold text-white tracking-tight">
            PharmaPay
          </span>
          <button
            className="ml-auto lg:hidden text-white/60"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? "text-white" : "text-white/50 hover:text-white/80"}`}
                style={isActive ? { background: "rgba(255,255,255,0.08)" } : {}}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className="px-6 py-4 text-xs"
          style={{ color: "hsl(215, 20%, 55%)" }}
        >
          © 2026 PharmaPay
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="card-pharmacy flex items-center gap-4 px-4 sm:px-6 py-3 sticky top-0 z-30"
          style={{ borderRadius: 0, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
        >
          <button
            className="lg:hidden text-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              PharmaPay
            </span>
            <ChevronRight
              size={14}
              className="text-muted-foreground hidden sm:inline"
            />
            <span className="font-semibold text-foreground">{currentPage}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search..."
                className="input-field pl-9 w-56 text-sm pr-3"
              />
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: "hsl(221, 83%, 53%)" }}
            >
              PO
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
