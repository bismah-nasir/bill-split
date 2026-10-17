"use client";

import { UsernameField } from "@/components/account/username-field";
import { useUsernameForm } from "@/components/account/use-username-form";
import { useAccount } from "@/components/layout/account-gate";
import { normalizeUsername } from "@/domain/normalization";

import { EditableSetting } from "./editable-setting";
import { InlineEditForm } from "./inline-edit-form";

export function UsernameSetting() {
  const { user } = useAccount();
  return (
    <EditableSetting
      title="Username"
      value={`@${user.username}`}
      renderEditor={(close) => <UsernameEditor currentUsername={user.username} onDone={close} />}
    />
  );
}

function UsernameEditor({ currentUsername, onDone }: { currentUsername: string; onDone: () => void }) {
  const form = useUsernameForm(currentUsername);
  // The caller's own username counts as available; saying so about it would be noise.
  const isOwnUsername = normalizeUsername(form.username) === normalizeUsername(currentUsername);

  async function handleSubmit() {
    // A change of letter case only is still saved, since the username is shown as typed.
    if (form.username.trim() === currentUsername) return onDone();
    if (await form.submit()) onDone();
  }

  return (
    <InlineEditForm
      onSubmit={() => void handleSubmit()}
      onCancel={onDone}
      isPending={form.isPending}
      formMessage={form.formMessage}
    >
      <UsernameField
        value={form.username}
        availability={isOwnUsername ? "idle" : form.availability}
        error={form.fieldError}
        autoFocus
        onChange={(event) => form.changeUsername(event.target.value)}
      />
    </InlineEditForm>
  );
}
