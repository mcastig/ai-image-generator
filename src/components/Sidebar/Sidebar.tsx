"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import type { TabId } from "@/types";
import "./Sidebar.css";

/* ── Inline SVG icons (fill/stroke="currentColor") ──────────────── */

function IconMagic() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.90713 1.41278C5.11078 0.862408 5.88922 0.862408 6.09287 1.41278L6.93579 3.69072C6.99982 3.86376 7.13624 4.00018 7.30928 4.06421L9.58722 4.90713C10.1376 5.11078 10.1376 5.88922 9.58722 6.09287L7.30928 6.93579C7.13624 6.99982 6.99982 7.13624 6.93579 7.30928L6.09287 9.58722C5.88922 10.1376 5.11078 10.1376 4.90713 9.58722L4.06421 7.30928C4.00018 7.13624 3.86376 6.99982 3.69072 6.93579L1.41278 6.09287C0.862408 5.88922 0.862408 5.11078 1.41278 4.90713L3.69072 4.06421C3.86376 4.00018 4.00018 3.86376 4.06421 3.69072L4.90713 1.41278Z"
        fill="currentColor"
      />
      <path
        d="M13.4887 7.72523C13.879 6.75826 15.371 6.75826 15.7613 7.72523L17.3769 11.7275C17.4996 12.0315 17.7611 12.2712 18.0928 12.3837L22.4588 13.8646C23.5137 14.2224 23.5137 15.5901 22.4588 15.9479L18.0928 17.4288C17.7611 17.5413 17.4996 17.781 17.3769 18.085L15.7613 22.0873C15.371 23.0542 13.879 23.0542 13.4887 22.0873L11.8731 18.085C11.7504 17.781 11.4889 17.5413 11.1572 17.4288L6.79116 15.9479C5.73628 15.5901 5.73628 14.2224 6.79116 13.8646L11.1572 12.3837C11.4889 12.2712 11.7504 12.0315 11.8731 11.7275L13.4887 7.72523Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconApps() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" />
      <rect
        x="13"
        y="2"
        width="9"
        height="9"
        rx="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <rect
        x="2"
        y="13"
        width="9"
        height="9"
        rx="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <rect
        x="13"
        y="13"
        width="9"
        height="9"
        rx="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.25" />
      <path
        d="M12 5.3C12 5.15741 12 5.08611 12.0462 5.04182C12.0925 4.99753 12.1616 5.0005 12.2999 5.00643C13.4246 5.05465 14.5226 5.37351 15.5 5.93782C16.5641 6.5522 17.4478 7.43587 18.0622 8.5C18.6766 9.56413 19 10.7712 19 12C19 13.2288 18.6766 14.4359 18.0622 15.5C17.4478 16.5641 16.5641 17.4478 15.5 18.0622C14.4359 18.6766 13.2288 19 12 19C10.7712 19 9.56413 18.6766 8.5 18.0622C7.52259 17.4979 6.69743 16.7064 6.09335 15.7565C6.01906 15.6397 5.98191 15.5813 5.99716 15.5191C6.0124 15.4569 6.07414 15.4213 6.19763 15.35L11.85 12.0866C11.9232 12.0443 11.9598 12.0232 11.9799 11.9884C12 11.9536 12 11.9113 12 11.8268V5.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8C3 7.06812 3 6.60218 3.15224 6.23463C3.35523 5.74458 3.74458 5.35523 4.23463 5.15224C4.60218 5 5.06812 5 6 5H8.34315C9.16065 5 9.5694 5 9.93694 5.15224C10.3045 5.30448 10.5935 5.59351 11.1716 6.17157L13 8V11H3V8Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M3 11.2C3 10.0799 3 9.51984 3.21799 9.09202C3.40973 8.71569 3.71569 8.40973 4.09202 8.21799C4.51984 8 5.0799 8 6.2 8H17.8C18.9201 8 19.4802 8 19.908 8.21799C20.2843 8.40973 20.5903 8.71569 20.782 9.09202C21 9.51984 21 10.0799 21 11.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V11.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── Nav config ──────────────────────────────────────────────────── */

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "generate", label: "Generate Image", icon: <IconMagic /> },
  { id: "feed", label: "Feed", icon: <IconApps /> },
  { id: "history", label: "Generation History", icon: <IconHistory /> },
  { id: "collection", label: "My Collection", icon: <IconFolder /> },
];

/* ── Component ───────────────────────────────────────────────────── */

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { activeTab, theme, setActiveTab, toggleTheme, setShowSignInModal } =
    useStore();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleTabClick(id: TabId) {
    if ((id === "history" || id === "collection") && !session) {
      setShowSignInModal(true);
      return;
    }
    setActiveTab(id);
    onMobileClose();
  }

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__top">
          <div className="sidebar__logo">
            <Image
              src="/resources/Logo.svg"
              alt="Logo"
              width={28}
              height={28}
            />
          </div>

          <button
            className="sidebar__mobile-close"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <nav className="sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`sidebar__nav-item ${activeTab === item.id ? "sidebar__nav-item--active" : ""}`}
                onClick={() => handleTabClick(item.id)}
                title={item.label}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                <span className="sidebar__nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            className="sidebar__nav-item sidebar__theme-toggle"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            <span className="sidebar__theme-icon">
              {theme === "dark" ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            <span className="sidebar__nav-label">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>

        <div className="sidebar__bottom">
          {session?.user ? (
            <div className="sidebar__user" ref={menuRef}>
              <button
                className={`sidebar__avatar-btn ${menuOpen ? "sidebar__avatar-btn--open" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
                title={session.user.name ?? "Account"}
              >
                {(session.user as Record<string, unknown>).avatarUrl ? (
                  <Image
                    src={
                      (session.user as Record<string, unknown>)
                        .avatarUrl as string
                    }
                    alt={session.user.name ?? "User"}
                    width={36}
                    height={36}
                    className="sidebar__avatar-img"
                  />
                ) : (
                  <div className="sidebar__avatar-placeholder">
                    {session.user.name?.[0] ?? "U"}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="sidebar__user-popover">
                  <p className="sidebar__user-name">{session.user.name}</p>
                  <button
                    className="sidebar__signout"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    <Image
                      src="/resources/signout.svg"
                      alt=""
                      width={15}
                      height={15}
                    />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="sidebar__signin"
              onClick={() => signIn("github")}
            >
              <Image
                src="/resources/signin.svg"
                alt="Sign in"
                width={16}
                height={16}
              />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
