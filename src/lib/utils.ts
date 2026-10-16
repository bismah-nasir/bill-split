import { createCn } from "cn/config";

/**
 * Class-name join + Tailwind conflict resolution. The `type-*` text styles
 * from design/tokens.css are registered as one group so a later `type-*`
 * class replaces an earlier one.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "type-style": [
        {
          type: [
            "display",
            "display-sm",
            "h1",
            "h2",
            "h3",
            "body",
            "body-medium",
            "body-sm",
            "caption",
            "overline",
            "button",
            "button-sm",
            "numeric",
            "numeric-lg",
          ],
        },
      ],
    },
  },
});
