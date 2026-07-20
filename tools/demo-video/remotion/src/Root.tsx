import type React from "react";
import { Composition } from "remotion";
import { DemoFlow } from "./compositions/DemoFlow";

// Duration/fps here must match the captured clip (check with
// `@remotion/renderer`'s getVideoMetadata, or Root.tsx's fps must match the
// clip's own fps since OffthreadVideo plays back frame-for-frame).
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoFlow"
        component={DemoFlow}
        durationInFrames={Math.round(25 * 6.84)}
        fps={25}
        width={1280}
        height={720}
        defaultProps={{ clip: "login.webm" }}
      />
    </>
  );
};
