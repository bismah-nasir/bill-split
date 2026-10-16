# Rules for AI agents

## 1. Don't hard-code styling values

Every colour, size, spacing step, radius, shadow, font and motion value comes from `design/tokens.css`. Never hard-code one: no arbitrary Tailwind values (`p-[13px]`), no hex/rgb literals, no inline `style`. If a token is missing, add it to `design/tokens.css`. ESLint enforces this.

- Text styles: `type-h1`, `type-body`, `type-caption`, …
- Spacing uses mobile point keys: `p-16` = 1rem. Component sizes: `h-control-lg`, `size-tap`, `size-icon-md`.
- Colours: `bg-primary`, `text-ink`, `text-ink-secondary`, `border-line`, …
- Fonts are loaded in `design/fonts.ts`.

## 2. Build reusable components

- If a piece of UI appears more than once, or clearly will (buttons, inputs, cards, list rows, headers), make it a component and reuse it. Don't copy-paste markup.
- Before creating a component, check whether one already exists and use or extend it.
- Shared components live in `components/`. Components used by a single route can sit next to that route in a private folder (`app/<route>/_components/`).
- Expose variations through props (`variant`, `size`, …) instead of creating near-duplicate components.

## 3. Keep external services in one place

All code that talks to a database or any other external service (APIs, auth, storage, payments, email, …) lives in one folder per service, so the provider can be swapped later by changing only that folder.

```
lib/
  db/          # the only place that imports the database client
    client.ts  # connection setup
    users.ts   # getUser(), createUser(), …
    orders.ts
  <service>/   # same pattern for each other external service
```

- Pages, components and Server Actions call functions like `getUser(id)`. They never import the database client, ORM or SDK directly, and never contain queries.
- These functions return plain app types (e.g. `User`), not provider-specific objects, so callers don't depend on the provider.
- Connection strings and keys are read only inside these folders, from environment variables.

## 4. Others

The coding agent must follow these principles:

- Use animation intentionally.
- Do not add unnecessary UI elements.
- Keep business logic separate from UI.
