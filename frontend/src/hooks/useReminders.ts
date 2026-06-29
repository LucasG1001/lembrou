import { useCallback, useEffect, useState } from "react";
import {
  fetchReminders,
  deleteReminder,
  acknowledgeReminder,
  rescheduleReminder,
  cancelReminder,
} from "../services/reminderService";
import type { Reminder, RescheduleInput } from "../types/reminder";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Busca dispara só por refresh; setState só dentro de callbacks.
  useEffect(() => {
    let active = true;
    fetchReminders("active")
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
  }, [refreshKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const applyUpdate = useCallback((updated: Reminder) => {
    setReminders((prev) =>
      updated.status === "active"
        ? prev.map((r) => (r.id === updated.id ? updated : r))
        : prev.filter((r) => r.id !== updated.id)
    );
  }, []);

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
    loading,
    error,
    reload,
    remove,
    acknowledge,
    reschedule,
    cancel,
  };
}
