"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { SettingRow } from "./setting-row";

type EditableSettingProps = {
  title: string;
  value: React.ReactNode;
  /** The inline editor; call `close` after saving or cancelling. */
  renderEditor: (close: () => void) => React.ReactNode;
};

/**
 * A setting that shows its value with **Change**, and swaps in an inline editor on demand.
 * Focus returns to **Change** when the editor closes, so keyboard users keep their place.
 */
export function EditableSetting({ title, value, renderEditor }: EditableSettingProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const changeButtonRef = React.useRef<HTMLButtonElement>(null);
  const wasEditing = React.useRef(false);

  React.useEffect(() => {
    if (wasEditing.current && !isEditing) changeButtonRef.current?.focus();
    wasEditing.current = isEditing;
  }, [isEditing]);

  const close = React.useCallback(() => setIsEditing(false), []);

  if (isEditing) return renderEditor(close);

  return (
    <SettingRow
      title={title}
      value={value}
      action={
        <Button
          ref={changeButtonRef}
          variant="secondary"
          size="sm"
          aria-label={`Change ${title.toLowerCase()}`}
          onClick={() => setIsEditing(true)}
        >
          Change
        </Button>
      }
    />
  );
}
