import type React from "react";
import { Composition } from "remotion";
import { DemoFlow, type Clip } from "./compositions/DemoFlow";

const FPS = 25;
const PLAYBACK_RATE = 2;

// durationInSeconds comes from probing each real capture with
// @remotion/renderer's getVideoMetadata (see tools/demo-video/README.md) —
// update these if a clip is re-captured.
const CLIPS: Clip[] = [
  { file: "login.webm", caption: "Login", durationInSeconds: 6.12 },
  {
    file: "load-intake.webm",
    caption: "Cadastro de carga por Nota Fiscal",
    durationInSeconds: 11.56,
  },
  {
    file: "removal.webm",
    caption: "Remoção de itens via leitura de QR Code",
    durationInSeconds: 11.12,
  },
  { file: "inventory.webm", caption: "Estoque e histórico", durationInSeconds: 7.96 },
];

const totalDurationInFrames = CLIPS.reduce(
  (sum, clip) => sum + Math.round((clip.durationInSeconds * FPS) / PLAYBACK_RATE),
  0,
);

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoFlow"
        component={DemoFlow}
        durationInFrames={totalDurationInFrames}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{ clips: CLIPS, fps: FPS, playbackRate: PLAYBACK_RATE }}
      />
    </>
  );
};
