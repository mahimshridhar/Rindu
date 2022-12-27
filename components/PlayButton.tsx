import React, { HTMLAttributes, ReactElement, useRef } from "react";
import useAuth from "hooks/useAuth";
import useSpotify from "hooks/useSpotify";
import { Pause, Play } from "components/icons";
import { AudioPlayer } from "hooks/useSpotifyPlayer";
import useToast from "hooks/useToast";
import useOnScreen from "hooks/useOnScreen";
import { ITrack } from "types/spotify";
import useIsThisPlaybackPlaying from "hooks/useIsThisPlaybackPlaying";
import { handleNonPremiumPlay, handlePremiumPlay } from "utils/playButton";

interface PlayButtonProps {
  size: number;
  centerSize: number;
  track?: ITrack;
  isSingle?: boolean;
  uri?: string;
  position?: number;
  allTracks: ITrack[];
}

export function PlayButton({
  size,
  centerSize,
  track,
  isSingle,
  uri,
  position,
  allTracks,
  ...props
}: PlayButtonProps & HTMLAttributes<HTMLButtonElement>): ReactElement | null {
  const {
    isPlaying,
    player,
    deviceId,
    pageDetails,
    playlistPlayingId,
    setPlaylistPlayingId,
    setCurrentlyPlaying,
    setIsPlaying,
    setPlayedSource,
    setReconnectionError,
  } = useSpotify();
  const { accessToken, user, setAccessToken } = useAuth();
  const { addToast } = useToast();
  const isPremium = user?.product === "premium";
  const uriId = uri?.split(":")?.[2];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isVisible = useOnScreen(buttonRef);

  const { isThisTrackPlaying, isThisPlaylistPlaying, isThisArtistPlaying } =
    useIsThisPlaybackPlaying({
      trackId: track?.id,
      uri,
      isSingle,
      uriId,
    });

  return (
    <>
      <button
        type="button"
        aria-label="Play/Pause"
        className="play-Button"
        onClick={(e) => {
          e.preventDefault();
          if (!accessToken || (!pageDetails && !track && !uri) || !user) {
            return;
          }
          if (isPremium && deviceId) {
            handlePremiumPlay(
              player as Spotify.Player,
              deviceId,
              accessToken,
              addToast,
              setAccessToken,
              setReconnectionError,
              setPlaylistPlayingId,
              setPlayedSource,
              track,
              isSingle,
              playlistPlayingId,
              uriId,
              pageDetails,
              uri,
              isPlaying,
              position,
              allTracks
            );
            return;
          }
          handleNonPremiumPlay(
            player as AudioPlayer,
            isThisTrackPlaying,
            isThisPlaylistPlaying,
            setIsPlaying,
            setCurrentlyPlaying,
            setPlaylistPlayingId,
            allTracks,
            pageDetails,
            track
          );
        }}
        ref={buttonRef}
        aria-hidden={isVisible ? "false" : "true"}
        tabIndex={isVisible ? 0 : -1}
        {...props}
      >
        {(isThisTrackPlaying && !isThisPlaylistPlaying) ||
        isThisArtistPlaying ||
        (isThisPlaylistPlaying &&
          !isThisArtistPlaying &&
          !isThisTrackPlaying &&
          !track) ? (
          <Pause fill="#000" width={centerSize} height={centerSize} />
        ) : (
          <Play fill="#000" width={centerSize} height={centerSize} />
        )}
      </button>
      <style jsx>{`
        .play-Button {
          background-color: #1ed760;
          display: flex;
          justify-content: center;
          align-items: center;
          width: ${size}px;
          height: ${size}px;
          border: none;
          border-radius: 50%;
          min-width: ${size}px;
          z-index: 1;
          box-shadow: 0 8px 8px rgb(0 0 0 / 30%);
        }
        .play-Button:focus,
        .play-Button:hover {
          transform: scale(1.06);
          background-color: #1fdf64;
        }
        .play-Button:active {
          transform: scale(1);
          background-color: #169c46;
        }
      `}</style>
    </>
  );
}
