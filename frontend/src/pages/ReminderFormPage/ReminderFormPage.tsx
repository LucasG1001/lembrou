import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  fetchReminder,
  createReminder,
  updateReminder,
  cancelReminder,
} from "../../services/reminderService";
import type { RecurUnit, ReminderInput } from "../../types/reminder";
import { toFormParts, WEEKDAYS } from "../../utils/format";
import styles from "./ReminderFormPage.module.css";

const UNIT_OPTIONS: { value: RecurUnit; label: string }[] = [
  { value: "day", label: "dia(s)" },
  { value: "week", label: "semana(s)" },
  { value: "month", label: "mês(es)" },
  { value: "year", label: "ano(s)" },
];

export function ReminderFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const action = searchParams.get("action");

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [repeats, setRepeats] = useState(false);
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurUnit, setRecurUnit] = useState<RecurUnit>("month");
  const [recurWeekday, setRecurWeekday] = useState<number | null>(null);
  const [maxNotify, setMaxNotify] = useState(10);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchReminder(id)
      .then((r) => {
        if (!active) return;
        if (action === "cancel") {
          if (window.confirm(`Cancelar "${r.title}"?`)) {
            cancelReminder(r.id).finally(() => navigate("/lembretes"));
          } else {
            navigate("/lembretes");
          }
          return;
        }
        const parts = toFormParts(r.eventAt);
        setTitle(r.title);
        setNotes(r.notes ?? "");
        setDate(parts.date);
        setTime(r.isAllDay ? "" : parts.time);
        setAllDay(r.isAllDay);
        setRepeats(Boolean(r.recurInterval));
        setRecurInterval(r.recurInterval ?? 1);
        setRecurUnit(r.recurUnit ?? "month");
        setRecurWeekday(r.recurWeekday);
        setMaxNotify(r.maxNotify);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível carregar o lembrete.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, action, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe um título.");
      return;
    }
    if (!date) {
      setError("Escolha uma data.");
      return;
    }
    if (!allDay && !time) {
      setError("Escolha um horário ou marque como dia inteiro.");
      return;
    }

    const payload: ReminderInput = {
      title: title.trim(),
      notes: notes.trim() || null,
      date,
      time: allDay ? null : time,
      recurInterval: repeats ? recurInterval : null,
      recurUnit: repeats ? recurUnit : null,
      recurWeekday: repeats ? recurWeekday : null,
      maxNotify,
    };

    setSaving(true);
    setError(null);
    try {
      if (id) {
        await updateReminder(id, payload);
      } else {
        await createReminder(payload);
      }
      navigate("/lembretes");
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.muted}>Carregando…</p>;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.heading}>{isEdit ? "Editar lembrete" : "Novo lembrete"}</h1>

      {action === "reschedule" && (
        <p className={styles.hint}>Ajuste a data/hora abaixo para remarcar este lembrete.</p>
      )}

      <label className={styles.field}>
        <span className={styles.label}>Título</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dentista" maxLength={200} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Notas (opcional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className={`${styles.field} ${allDay ? styles.disabled : ""}`}>
          <span className={styles.label}>Hora</span>
          <input type="time" value={time} disabled={allDay} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <label className={styles.checkbox}>
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <span>Dia inteiro (aviso na véspera às 18:00 e no dia às 08:00)</span>
      </label>

      <label className={styles.checkbox}>
        <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
        <span>Repetir</span>
      </label>

      {repeats && (
        <div className={styles.recurBox}>
          <div className={styles.recurRow}>
            <span className={styles.label}>A cada</span>
            <input
              type="number"
              min={1}
              className={styles.intervalInput}
              value={recurInterval}
              onChange={(e) => setRecurInterval(Math.max(1, Number(e.target.value)))}
            />
            <select value={recurUnit} onChange={(e) => setRecurUnit(e.target.value as RecurUnit)}>
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>No dia da semana</span>
            <select
              value={recurWeekday ?? ""}
              onChange={(e) => setRecurWeekday(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Qualquer dia</option>
              {WEEKDAYS.map((w, i) => (
                <option key={i} value={i}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!allDay && (
        <label className={styles.field}>
          <span className={styles.label}>Máximo de avisos antes de cancelar</span>
          <input
            type="number"
            min={1}
            max={50}
            className={styles.intervalInput}
            value={maxNotify}
            onChange={(e) => setMaxNotify(Math.min(50, Math.max(1, Number(e.target.value))))}
          />
        </label>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={() => navigate("/lembretes")}>
          Voltar
        </button>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
