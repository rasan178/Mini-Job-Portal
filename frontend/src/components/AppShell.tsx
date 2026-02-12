"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link className={active ? "pill" : ""} href={href}>
      {label}
    </Link>
  );
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.replace("/");
  };

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link className="logo" href="/">
            Mini Job Portal
          </Link>
          <nav className="nav-links">
            <NavLink href="/jobs" label="Jobs" />
            {!loading && !user && (
              <>
                <NavLink href="/login" label="Login" />
                <NavLink href="/register" label="Register" />
              </>
            )}
            {!loading && user?.role === "candidate" && (
              <>
                <NavLink href="/candidate" label="Candidate Dashboard" />
                <NavLink href="/applications" label="My Applications" />
              </>
            )}
            {!loading && user?.role === "employer" && (
              <NavLink href="/employer" label="Employer Dashboard" />
            )}
            {!loading && user?.role === "admin" && (
              <NavLink href="/admin" label="Admin" />
            )}
            {!loading && user && (
              <button className="button ghost small" onClick={handleLogout} type="button">
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main>
        <div className="container">{children}</div>
      </main>
    </>
  );
};
