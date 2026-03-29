import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { AvailabilitySlot } from "../types";
import { dayLabel } from "../utils/format";

const weekDays = [0, 1, 2, 3, 4, 5, 6];

export const AvailabilityPage = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiRequest<{ availability: AvailabilitySlot[] }>("/availability")
      .then((data) => {
        if (active) {
          setSlots(data.availability);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load availability.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const groupedSlots = useMemo(
    () => weekDays.map((day) => ({ day, slots: slots.filter((slot) => slot.dayOfWeek === day) })),
    [slots]
  );

  const addSlot = (dayOfWeek: number) => {
    setSlots((current) => [...current, { dayOfWeek, startTime: "09:00", endTime: "10:00" }]);
  };

  const updateSlot = (dayOfWeek: number, index: number, field: keyof AvailabilitySlot, value: string) => {
    setSlots((current) => {
      const daySlots = current.filter((slot) => slot.dayOfWeek === dayOfWeek);
      const target = daySlots[index];
      return current.map((slot) => (slot === target ? { ...slot, [field]: value } : slot));
    });
  };

  const removeSlot = (dayOfWeek: number, index: number) => {
    setSlots((current) => {
      const daySlots = current.filter((slot) => slot.dayOfWeek === dayOfWeek);
      const target = daySlots[index];
      return current.filter((slot) => slot !== target);
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiRequest("/availability", {
        method: "PUT",
        body: JSON.stringify({ slots })
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save availability.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading weekly availability..." />;
  }

  return (
    <form className="page-enter space-y-6" onSubmit={save}>
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="panel-title font-display text-3xl font-semibold text-frost">Weekly Availability</h1>
            <p className="mt-2 text-sm text-muted">
              Add as many time windows as you want per day. SyncUp uses these slots to compute shared meeting overlap.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="glow-button rounded-[24px] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>
        {error ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {groupedSlots.map(({ day, slots: daySlots }) => (
          <div key={day} className="glass-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="panel-title font-display text-2xl font-semibold text-frost">{dayLabel(day)}</h2>
              <button
                type="button"
                onClick={() => addSlot(day)}
                className="ghost-button rounded-full px-4 py-2 text-sm font-semibold text-frost"
              >
                Add slot
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {daySlots.map((slot, index) => (
                <div key={`${day}-${index}`} className="glass-subpanel grid gap-3 rounded-[22px] p-4 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(event) => updateSlot(day, index, "startTime", event.target.value)}
                    className="soft-input rounded-2xl px-4 py-3"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(event) => updateSlot(day, index, "endTime", event.target.value)}
                    className="soft-input rounded-2xl px-4 py-3"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(day, index)}
                    className="ghost-button rounded-2xl px-4 py-3 text-sm font-semibold text-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {daySlots.length === 0 ? <p className="text-sm text-muted">No slots added for {dayLabel(day)}.</p> : null}
            </div>
          </div>
        ))}
      </section>
    </form>
  );
};
