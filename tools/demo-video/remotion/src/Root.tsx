import type React from "react";
import { Composition } from "remotion";
import { DemoFlow } from "./compositions/DemoFlow";

// Placeholder duration/dims for the login clip; swap for the real values
// (ffprobe the .webm, or read them off page.video() metadata) once a clip
// has actually been captured.
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoFlow"
        component={DemoFlow}
        durationInFrames={30 * 15}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ clip: "login.webm" }}
      />
    </>
  );
};
