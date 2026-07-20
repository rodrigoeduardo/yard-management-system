import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

type Props = {
  clip: string;
};

function Caption({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], {
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
        fontSize: 32,
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

export function DemoFlow({ clip }: Props) {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile(`clips/${clip}`)} />
      <Sequence from={0} durationInFrames={90}>
        <Caption text="Entrando no sistema" />
      </Sequence>
    </AbsoluteFill>
  );
}
