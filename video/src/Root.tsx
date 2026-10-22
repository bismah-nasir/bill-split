import { Composition } from "remotion";

import { FPS } from "./theme";
import { BillSplitWalkthrough, TOTAL_DURATION } from "./Video";

export function RemotionRoot() {
  return (
    <Composition
      id="BillSplitWalkthrough"
      component={BillSplitWalkthrough}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
}
