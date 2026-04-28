"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import type { Currency, UserPreferences } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsPreferencesProps = {
  accountEmail: string;
  initialPreferences: UserPreferences;
};

type SaveState = "idle" | "saved";

const storageKey = "foliocore.preferences";

export function SettingsPreferences({
  accountEmail,
  initialPreferences
}: SettingsPreferencesProps) {
  const [preferences, setPreferences] = useState(() => readStoredPreferences(initialPreferences));
  const [backupEmailDraft, setBackupEmailDraft] = useState(
    () => readStoredPreferences(initialPreferences).backupEmail ?? accountEmail
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function savePreferences(patch: Partial<UserPreferences>) {
    const nextPreferences = { ...preferences, ...patch };
    setPreferences(nextPreferences);
    setBackupEmailDraft(nextPreferences.backupEmail ?? accountEmail);
    window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
    setSaveState("saved");
  }

  function updateCurrency(defaultCurrency: Currency) {
    savePreferences({ defaultCurrency });
  }

  function toggleBackupEmail(nextEnabled: boolean) {
    const backupEmail = backupEmailDraft.trim() || accountEmail;
    savePreferences({
      backupEmailEnabled: nextEnabled,
      backupEmail: nextEnabled ? backupEmail : preferences.backupEmail
    });
  }

  function saveBackupEmail() {
    if (!preferences.backupEmailEnabled) return;
    savePreferences({ backupEmail: backupEmailDraft.trim() || accountEmail });
  }

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Preferences</h2>
        <p className={cn("text-sm text-zinc-500", saveState === "saved" && "text-[#00c2a8]")}>
          {saveState === "saved" ? "Saved" : "Stored in this browser"}
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[#202024] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-100">Default currency</p>
              <p className="mt-1 text-sm text-zinc-500">Used when portfolio screens open.</p>
            </div>
            <div className="flex rounded-[8px] bg-[#202024] p-1">
              {(["USD", "EUR"] as Currency[]).map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => updateCurrency(currency)}
                  className={cn(
                    "rounded-[6px] px-4 py-2 text-sm font-semibold text-zinc-400",
                    preferences.defaultCurrency === currency && "bg-white text-black"
                  )}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PreferenceSwitch
          title="Daily snapshots"
          detail="Applied to manual price refresh requests. Automated refresh is admin-configured separately."
          enabled={preferences.dailySnapshotsEnabled}
          onChange={(enabled) => savePreferences({ dailySnapshotsEnabled: enabled })}
        />

        <div className="rounded-[8px] border border-[#202024] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-100">Backup email</p>
              <p className="mt-1 text-sm text-zinc-500">
                Stored in this browser only. Scheduled exports are not user-controlled yet.
              </p>
              <Input
                value={backupEmailDraft}
                onChange={(event) => setBackupEmailDraft(event.target.value)}
                onBlur={saveBackupEmail}
                disabled={!preferences.backupEmailEnabled}
                className="mt-4"
                placeholder={accountEmail}
              />
            </div>
            <ToggleButton
              enabled={preferences.backupEmailEnabled}
              onClick={() => toggleBackupEmail(!preferences.backupEmailEnabled)}
            />
          </div>
        </div>

        <PreferenceSwitch
          title="Daily export"
          detail="Preference placeholder only; use dashboard CSV/backup downloads for active exports."
          enabled={preferences.dailyExportEnabled}
          onChange={(enabled) => savePreferences({ dailyExportEnabled: enabled })}
        />
      </div>
    </section>
  );
}

function PreferenceSwitch({
  title,
  detail,
  enabled,
  onChange
}: {
  title: string;
  detail: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="rounded-[8px] border border-[#202024] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-zinc-100">{title}</p>
          <p className="mt-1 text-sm text-zinc-500">{detail}</p>
        </div>
        <ToggleButton enabled={enabled} onClick={() => onChange(!enabled)} />
      </div>
    </div>
  );
}

function ToggleButton({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onClick}
      className={cn(
        "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors",
        enabled ? "bg-[#00c2a8]" : "bg-[#4a4a4d]"
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

function readStoredPreferences(fallback: UserPreferences): UserPreferences {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      defaultCurrency: parsed.defaultCurrency === "EUR" ? "EUR" : "USD",
      dailySnapshotsEnabled: parsed.dailySnapshotsEnabled !== false,
      backupEmailEnabled: Boolean(parsed.backupEmailEnabled),
      backupEmail: typeof parsed.backupEmail === "string" ? parsed.backupEmail : undefined,
      dailyExportEnabled: Boolean(parsed.dailyExportEnabled)
    };
  } catch {
    return fallback;
  }
}
