import { AbsoluteFill, Audio, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { BillHistory, Dashboard, DASHBOARD_DURATION, HISTORY_DURATION, PriceHistory, PRICES_DURATION } from "./scenes/desktop";
import {
  BILL_DURATION,
  BillDetail,
  Invitations,
  INVITATIONS_DURATION,
  Invite,
  INVITE_DURATION,
  Items,
  ITEMS_DURATION,
  NEW_BILL_DURATION,
  NewBill,
  Review,
  REVIEW_DURATION,
} from "./scenes/mobile";
import { ChooseUsername, Intro, Landing, LANDING_DURATION, Outro, SIGN_UP_DURATION, SignUp, USERNAME_DURATION } from "./scenes/onboarding";

const TRANSITION = 16;

const SCENES: { id: string; Component: () => React.ReactElement; duration: number; enter?: "fade" | "slide" }[] = [
  { id: "intro", Component: Intro, duration: 95 },
  { id: "landing", Component: Landing, duration: LANDING_DURATION },
  { id: "sign-up", Component: SignUp, duration: SIGN_UP_DURATION, enter: "slide" },
  { id: "username", Component: ChooseUsername, duration: USERNAME_DURATION, enter: "slide" },
  { id: "dashboard", Component: Dashboard, duration: DASHBOARD_DURATION },
  { id: "new-bill", Component: NewBill, duration: NEW_BILL_DURATION },
  { id: "items", Component: Items, duration: ITEMS_DURATION, enter: "slide" },
  { id: "review", Component: Review, duration: REVIEW_DURATION, enter: "slide" },
  { id: "bill", Component: BillDetail, duration: BILL_DURATION, enter: "slide" },
  { id: "invite", Component: Invite, duration: INVITE_DURATION },
  { id: "invitations", Component: Invitations, duration: INVITATIONS_DURATION },
  { id: "history", Component: BillHistory, duration: HISTORY_DURATION },
  { id: "prices", Component: PriceHistory, duration: PRICES_DURATION, enter: "slide" },
  { id: "outro", Component: Outro, duration: 120 },
];

export const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0) - TRANSITION * (SCENES.length - 1);

export function BillSplitWalkthrough() {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("music.wav")} volume={0.45} />
      <TransitionSeries>
        {SCENES.flatMap(({ id, Component, duration, enter }, i) => {
          const parts = [];
          if (i > 0) {
            parts.push(
              <TransitionSeries.Transition
                key={`${id}-in`}
                presentation={enter === "slide" ? slide({ direction: "from-right" }) : fade()}
                timing={linearTiming({ durationInFrames: TRANSITION })}
              />,
            );
          }
          parts.push(
            <TransitionSeries.Sequence key={id} durationInFrames={duration}>
              <Component />
            </TransitionSeries.Sequence>,
          );
          return parts;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
