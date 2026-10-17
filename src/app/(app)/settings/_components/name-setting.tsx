"use client";

import * as React from "react";

import { useValidatedForm } from "@/components/forms/use-validated-form";
import { useAccount } from "@/components/layout/account-gate";
import { TextField } from "@/components/ui/text-field";
import { validateName } from "@/domain/auth-validation";
import { useUpdateName } from "@/lib/db/users";

import { EditableSetting } from "./editable-setting";
import { InlineEditForm } from "./inline-edit-form";

type NameValues = { name: string };

function validateNameForm(values: NameValues) {
  const name = validateName(values.name);
  return name.ok
    ? { ok: true as const, value: name.value }
    : { ok: false as const, fieldErrors: { name: name.error } };
}

export function NameSetting() {
  const { user } = useAccount();
  return (
    <EditableSetting
      title="Name"
      value={user.name}
      renderEditor={(close) => <NameEditor currentName={user.name} onDone={close} />}
    />
  );
}

function NameEditor({ currentName, onDone }: { currentName: string; onDone: () => void }) {
  const form = useValidatedForm({ name: currentName }, validateNameForm);
  const { updateName, isPending } = useUpdateName();
  const [formMessage, setFormMessage] = React.useState<string | null>(null);

  async function handleSubmit() {
    setFormMessage(null);
    const name = form.validateAll();
    if (name === null) return;
    if (name === currentName) return onDone();

    const failure = await updateName(name);
    if (!failure) return onDone();
    if (failure.fieldErrors.name) form.showErrors(failure.fieldErrors);
    else setFormMessage(failure.message);
  }

  return (
    <InlineEditForm
      onSubmit={() => void handleSubmit()}
      onCancel={onDone}
      isPending={isPending}
      formMessage={formMessage}
    >
      <TextField label="Name" autoComplete="name" autoFocus {...form.field("name")} />
    </InlineEditForm>
  );
}
