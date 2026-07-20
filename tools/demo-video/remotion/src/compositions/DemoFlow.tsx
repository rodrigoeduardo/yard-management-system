import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

export type Clip = {
  file: string;
  caption: string;
  durationInSeconds: number;
};

type Props = {
  clips: Clip[];
  fps: number;
  playbackRate: number;
};

function Caption({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: 48,
        right: 48,
        opacity,
        color: "white",
        fontSize: 30,
        fontFamily: "system-ui, sans-serif",
        background: "rgba(0,0,0,0.6)",
        padding: "12px 20px",
        borderRadius: 8,
      }}
    >
      {text}
    </div>
  );
}

export function DemoFlow({ clips, fps, playbackRate }: Props) {
  let frameCursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {clips.map((clip) => {
        const durationInFrames = Math.round(
          (clip.durationInSeconds * fps) / playbackRate,
        );
        const from = frameCursor;
        frameCursor += durationInFrames;

        return (
          <Sequence key={clip.file} from={from} durationInFrames={durationInFrames}>
            <OffthreadVideo src={staticFile(`clips/${clip.file}`)} playbackRate={playbackRate} />
            <Caption text={clip.caption} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
