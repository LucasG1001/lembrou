import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { BellIcon, CheckIcon, ChevronIcon, HomeIcon, LogoIcon } from "./Sidebar.icons";

interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/inicio", label: "Início", icon: HomeIcon },
  { path: "/lembretes", label: "Lembretes", icon: BellIcon },
  { path: "/habitos", label: "Hábitos", icon: CheckIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <LogoIcon className={styles.logoMark} />
        </div>
        <span className={styles.logoText}>RemindMe</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronIcon className={styles.toggleIcon} />
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              <ItemIcon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={({ isActive }) =>
                `${styles.barItem} ${isActive ? styles.barItemActive : ""}`
              }
            >
              <ItemIcon className={styles.barIcon} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
