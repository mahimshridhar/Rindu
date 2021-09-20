import Slider from "components/Slider";
import useAuth from "hooks/useAuth";
import useSpotify from "hooks/useSpotify";
import { AudioPlayer } from "hooks/useSpotifyPlayer";
import { ReactElement, useEffect, useState } from "react";
import { formatTime } from "utils/formatTime";

export function ProgressBar(): ReactElement {
  const {
    currentlyPlayingDuration,
    currentlyPlayingPosition,
    isPlaying,
    player,
  } = useSpotify();
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [progressFromSpotify, setProgressFromSpotify] = useState(0);
  const { user } = useAuth();
  const isPremium = user?.product === "premium";
  const durationInSeconds = currentlyPlayingDuration
    ? isPremium
      ? currentlyPlayingDuration / 1000
      : currentlyPlayingDuration
    : 0;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    if (currentlyPlayingPosition) {
      setProgressFromSpotify(
        !!currentlyPlayingPosition && currentlyPlayingDuration
          ? 100 * (currentlyPlayingPosition / currentlyPlayingDuration)
          : 0
      );
      setProgressSeconds(
        isPremium ? currentlyPlayingPosition / 1000 : currentlyPlayingPosition
      );
    }
  }, [
    currentlyPlayingPosition,
    currentlyPlayingDuration,
    isPlaying,
    isPremium,
  ]);

  return (
    <div className="progressBar">
      <div className="timeTag">
        {formatTime(
          progressSeconds > durationInSeconds
            ? durationInSeconds
            : progressSeconds
        )}
      </div>
      <Slider
        updateProgress={progressFromSpotify}
        intervalUpdateAction={{
          steps: 100 / durationInSeconds,
          labelUpdateValue: 1,
          ms: 1000,
          shouldUpdate: isPlaying,
        }}
        onDragging={(isDragging) => {
          if (!isPremium && player) {
            (player as AudioPlayer).sliderBusy = isDragging;
          }
        }}
        setLabelValue={setProgressSeconds}
        onProgressChange={(currentPositionPercent) => {
          setProgressSeconds(
            (currentPositionPercent * (currentlyPlayingDuration ?? 0)) /
              100 /
              (isPremium ? 1000 : 1)
          );
        }}
        valueText={`${formatTime(progressSeconds)}:${formatTime(
          durationInSeconds
        )}`}
        initialValuePercent={0}
        value={progressSeconds}
        maxValue={durationInSeconds}
        action={(progressPercent) => {
          player?.seek(
            (progressPercent * (currentlyPlayingDuration ?? 0)) / 100
          );
        }}
      />
      <div className="timeTag">{formatTime(durationInSeconds)}</div>
      <style jsx>{`
        .progressBar {
          display: flex;
          align-items: center;
          flex-direction: row;
          justify-content: space-between;
          width: 100%;
          max-width: 540px;
          margin-top: 11px;
        }
        .timeTag {
          min-width: 40px;
          text-align: center;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: normal;
          line-height: 16px;
          user-select: none;
        }
      `}</style>
    </div>
  );
}