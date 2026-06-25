import { getLevelIcon } from "../../utils/levelUtils";
import styles from "./LevelBadge.module.css";

interface LevelBadgeProps {
  level: number;
  size?: "small" | "large";
}

export function LevelBadge({ level, size = "small" }: LevelBadgeProps) {
  const icon = getLevelIcon(level);
  const sizeClass = size === "large" ? styles.large : styles.small;

  return (
    <span className={`${styles.badge} ${sizeClass}`} role="img" aria-label={`Nível ${level}`}>
      {icon}
    </span>
  );
}
