import * as React from "react";

type SettingRowProps = {
  title: string;
  /** Shown next to the title, e.g. a "Read-only" badge. */
  badge?: React.ReactNode;
  value: React.ReactNode;
  /** E.g. a "Change" button, aligned to the right of the value. */
  action?: React.ReactNode;
  /** Notes shown under the value. */
  children?: React.ReactNode;
};

/** One labelled account detail on the Settings page. */
export function SettingRow({ title, badge, value, action, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-8">
            <h2 className="type-body-sm font-medium text-ink-secondary">{title}</h2>
            {badge}
          </div>
          <p className="truncate type-body-medium text-ink">{value}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
