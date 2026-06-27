import { useCallback, useEffect, useState } from "react";
import {
  fetchReminders,
  deleteReminder,
  acknowledgeReminder,
  rescheduleReminder,
  cancelReminder,
} from "../services/reminderService";
import type { Reminder, ReminderStatus, RescheduleInput } from "../types/reminder";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [status, setStatusState] = useState<ReminderStatus>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Busca dispara só por mudança de status/refresh; setState só dentro de callbacks.
  useEffect(() => {
    let active = true;
    fetchReminders(status)
      .then((data) => {
        if (active) setReminders(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os lembretes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, refreshKey]);

  const setStatus = useCallback((next: ReminderStatus) => {
    setLoading(true);
    setError(null);
    setStatusState(next);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const applyUpdate = useCallback(
    (updated: Reminder) => {
      setReminders((prev) =>
        updated.status === status
          ? prev.map((r) => (r.id === updated.id ? updated : r))
          : prev.filter((r) => r.id !== updated.id)
      );
    },
    [status]
  );

  const remove = useCallback(async (id: string) => {
    await deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const acknowledge = useCallback(
    async (id: string) => applyUpdate(await acknowledgeReminder(id)),
    [applyUpdate]
  );

  const reschedule = useCallback(
    async (id: string, input: RescheduleInput) => applyUpdate(await rescheduleReminder(id, input)),
    [applyUpdate]
  );

  const cancel = useCallback(
    async (id: string) => applyUpdate(await cancelReminder(id)),
    [applyUpdate]
  );

  return {
    reminders,
    status,
    setStatus,
    loading,
    error,
    reload,
    remove,
    acknowledge,
    reschedule,
    cancel,
  };
}
