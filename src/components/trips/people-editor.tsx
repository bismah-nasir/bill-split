"use client";

import * as React from "react";
import { CircleAlert, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/ui/text-field";
import { validateNewPerson, type PersonInput } from "@/domain/trip-validation";

import { fieldId, personPath, type FormItem, type TripFormAction } from "./trip-form-state";

type PeopleEditorProps = {
  people: PersonInput[];
  items: FormItem[];
  errors: Record<string, string>;
  dispatch: React.Dispatch<TripFormAction>;
  /** Usernames of saved people linked to an account, by person key (edit only). */
  linkedUsernames?: Record<string, string>;
};

const HINT = "Add anyone, with or without an account. You can connect people to their accounts after saving.";

/** The bill's people: "You", then everyone the owner added by name, each renamable and removable. */
export function PeopleEditor({ people, items, errors, dispatch, linkedUsernames = {} }: PeopleEditorProps) {
  const headingId = React.useId();
  const hintId = React.useId();
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const [newName, setNewName] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = React.useState<PersonInput | null>(null);
  const removedRef = React.useRef(false);

  // A dialog left open shouldn't greet the user on their next visit.
  React.useLayoutEffect(() => () => setPendingRemoval(null), []);

  function addPerson() {
    const result = validateNewPerson(newName, people);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    dispatch({ type: "addPerson", name: result.value });
    setNewName("");
    setAddError(null);
  }

  function requestRemove(person: PersonInput) {
    // Ask first when it takes them off items or ends an account's access.
    if (itemCountFor(items, person.key) > 0 || linkedUsernames[person.key]) {
      removedRef.current = false;
      setPendingRemoval(person);
      return;
    }
    dispatch({ type: "removePerson", key: person.key });
    // The row's remove button is gone; continue from the add field.
    addInputRef.current?.focus();
  }

  return (
    <section aria-labelledby={headingId} aria-describedby={hintId} className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <h2 id={headingId} className="type-h3">
          People
        </h2>
        <p id={hintId} className="type-body-sm text-ink-secondary">
          {HINT}
        </p>
      </div>

      <Card className="flex flex-col gap-16 p-16 md:p-24">
        <ul className="flex flex-col gap-8">
          <li className="flex min-h-control-md items-center px-14 type-body-medium">You</li>
          {people.map((person, index) => (
            <li key={person.key} className="flex items-start gap-8">
              <TextField
                label={`Person ${index + 2}`}
                hideLabel
                id={fieldId(personPath(person.key))}
                autoComplete="off"
                className="flex-1"
                value={person.name}
                error={errors[personPath(person.key)]}
                onChange={(event) => dispatch({ type: "renamePerson", key: person.key, name: event.target.value })}
                onBlur={() => dispatch({ type: "blur", path: personPath(person.key) })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${person.name.trim() || `person ${index + 2}`}`}
                onClick={() => requestRemove(person)}
              >
                <Trash2 aria-hidden className="size-icon-lg" />
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-8">
          <TextField
            ref={addInputRef}
            label="Add person"
            hideLabel
            placeholder="Add a name, e.g. Ben"
            autoComplete="off"
            className="flex-1"
            value={newName}
            error={addError ?? undefined}
            onChange={(event) => {
              setNewName(event.target.value);
              setAddError(null);
            }}
            onKeyDown={(event) => {
              // Enter adds the person instead of submitting the bill.
              if (event.key === "Enter") {
                event.preventDefault();
                addPerson();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addPerson}>
            <Plus aria-hidden className="size-icon-md" />
            Add
          </Button>
        </div>

        {errors.people && (
          <p
            id={fieldId("people")}
            tabIndex={-1}
            className="flex items-center gap-6 type-caption text-error"
          >
            <CircleAlert aria-hidden className="size-icon-sm shrink-0" />
            {errors.people}
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title={`Remove ${displayName(pendingRemoval)}?`}
        description={
          pendingRemoval
            ? removalWarning(pendingRemoval, itemCountFor(items, pendingRemoval.key), linkedUsernames[pendingRemoval.key])
            : ""
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (pendingRemoval) dispatch({ type: "removePerson", key: pendingRemoval.key });
          removedRef.current = true;
          setPendingRemoval(null);
        }}
        onCloseAutoFocus={(event) => {
          // After a removal the button that opened the dialog no longer exists; on Cancel,
          // focus goes back to it as usual.
          if (!removedRef.current) return;
          event.preventDefault();
          addInputRef.current?.focus();
        }}
      />
    </section>
  );
}

function itemCountFor(items: FormItem[], key: string): number {
  return items.filter((item) => item.assigneeKeys.includes(key)).length;
}

function displayName(person: PersonInput | null): string {
  return person?.name.trim() || "this person";
}

/**
 * §4.4: "Ben is on 3 items. Removing Ben takes them off shared items, and items only Ben pays
 * for move to you.", plus "@ben_doe will lose access to this bill." for a linked person.
 */
function removalWarning(person: PersonInput, itemCount: number, linkedUsername: string | undefined): string {
  const access = linkedUsername ? `@${linkedUsername} will lose access to this bill.` : "";
  if (itemCount === 0) return access;
  const items = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  const name = person.name.trim();
  const itemsWarning = name
    ? `${name} is on ${items}. Removing ${name} takes them off shared items, and items only ${name} pays for move to you.`
    : `This person is on ${items}. Removing them takes them off shared items, and items only they pay for move to you.`;
  return access ? `${itemsWarning} ${access}` : itemsWarning;
}
