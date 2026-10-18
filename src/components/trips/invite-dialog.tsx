"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { InviteVia } from "@/domain/invitations";
import { validateNewPerson } from "@/domain/trip-validation";
import type { BillPerson } from "@/domain/types";
import type { AppError } from "@/lib/db/errors";
import { useInvite } from "@/lib/db/invitations";

const SOMEONE_NEW = "new";

const VIA_OPTIONS = [
  { value: "username", label: "Username" },
  { value: "email", label: "Email" },
] as const;

type InviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  /** Everyone on the bill, in bill order. */
  people: BillPerson[];
  /** The person to invite for, when opened from their own **Invite** action. */
  personId?: string;
};

/**
 * Connects a person on the bill to an account: pick who they are (or add **Someone new**), then
 * their username or email. It stays open after sending, to invite someone else.
 */
export function InviteDialog({ open, onOpenChange, tripId, people, personId }: InviteDialogProps) {
  const identifierRef = React.useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite to this bill"
      description="Connect someone on this bill to their account so they can see it. Inviting doesn't change the split."
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        identifierRef.current?.focus();
      }}
    >
      {/* Radix unmounts the content when closed, so every opening starts fresh. */}
      <InviteForm tripId={tripId} people={people} initialPersonId={personId} identifierRef={identifierRef} />
    </Dialog>
  );
}

type FieldErrors = { personId?: string; newPersonName?: string; identifier?: string; form?: string };

type InviteFormProps = {
  tripId: string;
  people: BillPerson[];
  initialPersonId?: string;
  identifierRef: React.RefObject<HTMLInputElement | null>;
};

function InviteForm({ tripId, people, initialPersonId, identifierRef }: InviteFormProps) {
  const { invite, isInviting } = useInvite();
  const invitable = people.filter((person) => isInvitable(person));
  const [target, setTarget] = React.useState(
    () => initialPersonId ?? invitable[0]?.personId ?? SOMEONE_NEW,
  );
  const [newPersonName, setNewPersonName] = React.useState("");
  const [via, setVia] = React.useState<InviteVia>("username");
  const [identifier, setIdentifier] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [sent, setSent] = React.useState<string | null>(null);

  // Whoever was just invited drops out of the list (live); fall back to the next one.
  const selected = invitable.find((person) => person.personId === target);
  const effectiveTarget = target === SOMEONE_NEW || selected ? target : (invitable[0]?.personId ?? SOMEONE_NEW);
  const options = [
    ...invitable.map((person) => ({
      value: person.personId,
      label: person.link?.state === "declined" ? `${person.name} (declined)` : (person.name ?? ""),
    })),
    { value: SOMEONE_NEW, label: "Someone new" },
  ];

  async function submit() {
    const nextErrors: FieldErrors = {};
    if (effectiveTarget === SOMEONE_NEW) {
      const others = people.filter((person) => !person.isOwner).map((person) => ({ name: person.name ?? "" }));
      const name = validateNewPerson(newPersonName, others);
      if (!name.ok) nextErrors.newPersonName = name.error;
    }
    if (identifier.trim().length === 0) nextErrors.identifier = via === "username" ? "Enter a username" : "Enter an email";
    setErrors(nextErrors);
    setSent(null);
    if (Object.keys(nextErrors).length > 0) return;

    const personName = effectiveTarget === SOMEONE_NEW ? newPersonName.trim() : (selected?.name ?? "");
    const result = await invite({
      tripId,
      target: effectiveTarget === SOMEONE_NEW ? { newPersonName } : { personId: effectiveTarget },
      via,
      identifier,
    });
    if (!result.ok) {
      setErrors(inviteErrors(result.error));
      return;
    }
    // Never claims an email or message was sent: the app only records the invitation.
    setSent(`Invitation sent to @${result.username}. Once they accept, they'll see this bill as ${personName}.`);
    setIdentifier("");
    setNewPersonName("");
    identifierRef.current?.focus();
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-16"
    >
      <Select
        label="Who is this?"
        options={options}
        value={effectiveTarget}
        onValueChange={(value) => {
          setTarget(value);
          setErrors({});
        }}
        error={errors.personId}
      />
      {effectiveTarget === SOMEONE_NEW && (
        <TextField
          label="Name on this bill"
          placeholder="e.g. Ben"
          autoComplete="off"
          value={newPersonName}
          error={errors.newPersonName}
          onChange={(event) => {
            setNewPersonName(event.target.value);
            setErrors((current) => ({ ...current, newPersonName: undefined }));
          }}
        />
      )}
      <div className="flex flex-col gap-8">
        <SegmentedControl
          label="Invite by"
          options={VIA_OPTIONS}
          value={via}
          onValueChange={(value) => {
            setVia(value);
            setErrors((current) => ({ ...current, identifier: undefined }));
          }}
        />
        <TextField
          ref={identifierRef}
          // Remount on switch so the browser applies the new input type cleanly.
          key={via}
          label={via === "username" ? "Their username" : "Their email"}
          type={via === "email" ? "email" : "text"}
          inputMode={via === "email" ? "email" : "text"}
          prefix={via === "username" ? "@" : undefined}
          placeholder={via === "username" ? "ben_doe" : "ben@example.com"}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={identifier}
          error={errors.identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            setErrors((current) => ({ ...current, identifier: undefined }));
          }}
        />
      </div>
      {errors.form && <Alert>{errors.form}</Alert>}
      {sent && <Alert variant="success">{sent}</Alert>}
      <Button type="submit" disabled={isInviting}>
        {isInviting ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}

/** People who can be invited for: not linked, and with no pending invitation. */
function isInvitable(person: BillPerson): boolean {
  return !person.isOwner && (person.link?.state === "none" || person.link?.state === "declined");
}

/** Where each failure shows: next to the field it's about, otherwise above the button. */
function inviteErrors(error: AppError): FieldErrors {
  switch (error.code) {
    case "INVITE_NO_MATCH":
    case "INVITE_SELF":
    case "INVITE_ALREADY_PARTICIPANT":
    // The person picker only lists people without a pending invitation, so this is the account's.
    case "INVITE_ALREADY_PENDING":
      return { identifier: error.message };
    case "INVITE_PERSON_LINKED":
      return { personId: error.message };
    case "VALIDATION":
      return error.fieldErrors.newPersonName || error.fieldErrors.personId
        ? { newPersonName: error.fieldErrors.newPersonName, personId: error.fieldErrors.personId }
        : { form: error.message };
    default:
      return { form: error.message };
  }
}
