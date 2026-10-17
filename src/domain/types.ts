/** Outcome of parsing or validating one value. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The signed-in user's own account, as shown to that user only. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** `null` until onboarding is finished. */
  username: string | null;
};
