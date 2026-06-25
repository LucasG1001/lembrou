import type { ComponentType, ReactNode } from "react";
import type { TimelineGroup, TimelineItem } from "../../utils/agenda";
import { itemTime } from "../../utils/agenda";
import styles from "./Timeline.module.css";

interface TimelineProps {
  weekGroups: TimelineGroup[];
  laterGroups: TimelineGroup[];
  iconFor: (item: TimelineItem) => ComponentType<{ className?: string }>;
  onItemClick?: (item: TimelineItem) => void;
  renderAction?: (item: TimelineItem) => ReactNode;
  emptyMessage?: string;
  weekTitle?: string | null;
  laterTitle?: string | null;
}

export function Timeline({
  weekGroups,
  laterGroups,
  iconFor,
  onItemClick,
  renderAction,
  emptyMessage = "Nada agendado nos próximos dias.",
  weekTitle = "Esta semana",
  laterTitle = "Mais adiante",
}: TimelineProps) {
  if (weekGroups.length === 0 && laterGroups.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  const renderGroups = (groups: TimelineGroup[], withDate: boolean) =>
    groups.map((group) => (
      <div key={group.key} className={styles.group}>
        <div className={styles.groupHeader}>{group.label}</div>
        <div className={styles.groupItems}>
          {group.items.map((item) => {
            const Icon = iconFor(item);
            const action = renderAction?.(item);
            return (
              <div
                key={item.id}
                className={`${styles.item} ${action ? styles.itemWithAction : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => onItemClick?.(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onItemClick?.(item);
                  }
                }}
              >
                <Icon className={styles.itemIcon} />
                <span className={styles.itemTime}>{itemTime(item, withDate)}</span>
                <span className={styles.itemTitleWrap}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.subtitle && (
                    <span
                      className={`${styles.itemSubtitle} ${
                        item.subtitleTone === "danger" ? styles.itemSubtitleDanger : ""
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </span>
                <span className={styles.itemDetail}>{item.detail}</span>
                {action && (
                  <span className={styles.itemAction} onClick={(e) => e.stopPropagation()}>
                    {action}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className={styles.timeline}>
      {weekGroups.length > 0 && (
        <div className={styles.block}>
          {weekTitle && <div className={styles.blockTitle}>{weekTitle}</div>}
          {renderGroups(weekGroups, false)}
        </div>
      )}
      {laterGroups.length > 0 && (
        <div className={styles.block}>
          {laterTitle && <div className={styles.blockTitle}>{laterTitle}</div>}
          {renderGroups(laterGroups, true)}
        </div>
      )}
    </div>
  );
}
