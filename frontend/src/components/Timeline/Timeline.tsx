import { memo, type ComponentType } from "react";
import type { TimelineGroup, TimelineItem } from "../../utils/agenda";
import { itemTime } from "../../utils/agenda";
import { useLongPress } from "../../hooks/useLongPress";
import styles from "./Timeline.module.css";

interface TimelineProps {
  weekGroups: TimelineGroup[];
  laterGroups: TimelineGroup[];
  iconFor: (item: TimelineItem) => ComponentType<{ className?: string }>;
  onItemClick?: (item: TimelineItem) => void;
  onItemLongPress?: (item: TimelineItem) => void;
  emptyMessage?: string;
  hideGroupHeaders?: boolean;
}

export const Timeline = memo(function Timeline({
  weekGroups,
  laterGroups,
  iconFor,
  onItemClick,
  onItemLongPress,
  emptyMessage = "Nada agendado nos próximos dias.",
  hideGroupHeaders = false,
}: TimelineProps) {
  const bindPress = useLongPress<TimelineItem>({
    onTap: (item) => onItemClick?.(item),
    onLongPress: (item) => onItemLongPress?.(item),
  });
  if (weekGroups.length === 0 && laterGroups.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  const renderGroups = (groups: TimelineGroup[], withDate: boolean) =>
    groups.map((group) => (
      <div key={group.key} className={styles.group}>
        {!hideGroupHeaders && <div className={styles.groupHeader}>{group.label}</div>}
        <div className={styles.groupItems}>
          {group.items.map((item) => {
            const Icon = iconFor(item);
            const pressProps = onItemLongPress
              ? bindPress(item)
              : { onClick: () => onItemClick?.(item) };
            return (
              <div
                key={item.id}
                className={styles.item}
                role="button"
                tabIndex={0}
                {...pressProps}
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
                  <span className={`${styles.itemTitle} ${item.done ? styles.itemTitleDone : ""}`}>
                    {item.title}
                  </span>
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
              </div>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className={styles.timeline}>
      {weekGroups.length > 0 && (
        <div className={styles.block}>{renderGroups(weekGroups, false)}</div>
      )}
      {laterGroups.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Mais adiante</div>
          {renderGroups(laterGroups, true)}
        </div>
      )}
    </div>
  );
});
