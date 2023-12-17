import { ReactElement, useEffect, useRef } from "react";

import Link from "next/link";

import {
  ArtistList,
  ContentContainer,
  FullScreenControl,
  Heading,
  Logo,
  Player,
  ProgressBar,
  ScrollableText,
  VolumeControl,
} from "components";
import { FullScreenExit, Heart, Lyrics, Queue } from "components/icons";
import {
  useAuth,
  useClickPreventionOnDoubleClick,
  useContextMenu,
  useFullScreenControl,
  useHeader,
  useSpotify,
  useToast,
  useTranslations,
} from "hooks";
import { DisplayInFullScreen } from "types/spotify";
import {
  chooseImage,
  ContentType,
  exitFullScreen,
  getMainColorFromImage,
  isFullScreen,
  requestFullScreen,
  templateReplace,
  ToastMessage,
} from "utils";
import {
  removeEpisodesFromLibrary,
  removeTracksFromLibrary,
  saveEpisodesToLibrary,
  saveTracksToLibrary,
} from "utils/spotifyCalls";

export default function FullScreenPlayer(): ReactElement | null {
  const { accessToken } = useAuth();
  const {
    currentlyPlaying,
    displayInFullScreen,
    nextTracks,
    player,
    setDisplayInFullScreen: setDisplayInFullScreenSpotify,
  } = useSpotify();
  const { addToast } = useToast();
  const { addContextMenu } = useContextMenu();
  const { translations } = useTranslations();
  const { setHeaderColor } = useHeader();
  const { setDisplayInFullScreen } = useFullScreenControl(
    DisplayInFullScreen.Player
  );
  const playerRef = useRef<HTMLDivElement>(null);
  function onClick() {
    player?.togglePlay();
  }

  function onDoubleClick() {
    if (playerRef.current) {
      if (isFullScreen()) {
        exitFullScreen();
      } else {
        requestFullScreen(playerRef.current);
      }
      setDisplayInFullScreen(!isFullScreen());
    }
  }

  const [handleClick, handleDoubleClick] = useClickPreventionOnDoubleClick(
    onClick,
    onDoubleClick
  );

  useEffect(() => {
    if (!currentlyPlaying?.id) return;
    getMainColorFromImage("cover-image", setHeaderColor);
  }, [currentlyPlaying?.id, setHeaderColor]);

  const isFullScreenPlayer = displayInFullScreen === DisplayInFullScreen.Player;

  if (!isFullScreenPlayer) return null;

  return (
    <div ref={playerRef} className="fullScreenPlayer">
      <ContentContainer hasPageHeader>
        <div
          className="player"
          tabIndex={-1}
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleDoubleClick();
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              handleClick();
            }
          }}
        >
          <div className="player_header">
            <div className="player_header__left">
              <Logo color="#fff" />
            </div>
            <div className="player_header__center">
              <Heading number={2}>{translations.currentlyPlaying}</Heading>
            </div>
            <div className="player_header__right">
              {nextTracks.length > 0 && nextTracks?.[0] && (
                <div className="next-track-container">
                  <div className="next-track-container__image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chooseImage(nextTracks?.[0].album?.images, 50).url}
                      alt={nextTracks?.[0].name}
                      width={50}
                      height={50}
                    />
                  </div>
                  <div className="next-track-container__info">
                    <span className="title">Up Next</span>
                    <ScrollableText>
                      <p>
                        <span className="track-name">
                          {nextTracks?.[0].name} -{" "}
                          {nextTracks?.[0].artists?.[0]?.name}
                        </span>
                      </p>
                    </ScrollableText>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="player__track">
            {currentlyPlaying && (
              <div className="player__track__image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chooseImage(currentlyPlaying.album?.images, 500).url}
                  alt={currentlyPlaying.name}
                  id={"cover-image"}
                />
              </div>
            )}
            <div className="player-container">
              <div className="player__track__info">
                <div className="player__track__info-text">
                  <Heading number={2}>
                    {currentlyPlaying?.id ? (
                      <Link
                        href={`/${currentlyPlaying.type ?? "track"}/${
                          currentlyPlaying.id
                        }`}
                        className="trackName"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const x = e.pageX;
                          const y = e.pageY;
                          addContextMenu({
                            type: "cardTrack",
                            data: currentlyPlaying,
                            position: { x, y },
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <ScrollableText>{currentlyPlaying.name}</ScrollableText>
                      </Link>
                    ) : (
                      <ScrollableText>{currentlyPlaying?.name}</ScrollableText>
                    )}
                  </Heading>
                  <ScrollableText>
                    <span className="trackArtists">
                      <ArtistList
                        artists={currentlyPlaying?.artists}
                        onClick={() => {
                          if (playerRef.current) {
                            if (isFullScreen()) {
                              exitFullScreen();
                            } else {
                              requestFullScreen(playerRef.current);
                            }
                          }
                        }}
                      />
                    </span>
                  </ScrollableText>
                </div>
                <div className="player__track__info-options"></div>
              </div>
              <ProgressBar />
              <div className="player-container__controls">
                <div className="player-container__controls__left">
                  {currentlyPlaying && !currentlyPlaying?.is_local && (
                    <Heart
                      active={false}
                      className="navBar-Button"
                      handleDislike={async () => {
                        const removeFromLibrary =
                          currentlyPlaying.type === "episode"
                            ? removeEpisodesFromLibrary
                            : removeTracksFromLibrary;
                        const res = await removeFromLibrary(
                          [currentlyPlaying.id ?? ""],
                          accessToken
                        );

                        if (res) {
                          addToast({
                            variant: "success",
                            message: templateReplace(
                              translations[ToastMessage.TypeRemovedFrom],
                              [
                                `${
                                  currentlyPlaying.type === "episode"
                                    ? translations[ContentType.Episode]
                                    : translations[ContentType.Track]
                                }`,
                                translations[ContentType.Library],
                              ]
                            ),
                          });
                          return true;
                        }
                        return null;
                      }}
                      handleLike={async () => {
                        const saveToLibrary =
                          currentlyPlaying.type === "episode"
                            ? saveEpisodesToLibrary
                            : saveTracksToLibrary;
                        const saveRes = await saveToLibrary(
                          [currentlyPlaying.id ?? ""],
                          accessToken
                        );
                        if (saveRes) {
                          addToast({
                            variant: "success",
                            message: templateReplace(
                              translations[ToastMessage.TypeAddedTo],
                              [
                                `${
                                  currentlyPlaying.type === "episode"
                                    ? translations[ContentType.Episode]
                                    : translations[ContentType.Track]
                                }`,
                                translations[ContentType.Library],
                              ]
                            ),
                          });
                          return true;
                        }
                        return null;
                      }}
                    />
                  )}
                  {currentlyPlaying?.type === "track" && (
                    <FullScreenControl
                      icon={Lyrics}
                      displayInFullScreen={DisplayInFullScreen.Lyrics}
                    />
                  )}
                  <FullScreenControl
                    icon={Queue}
                    displayInFullScreen={DisplayInFullScreen.Queue}
                  />
                </div>
                <Player />
                <div className="player-container__controls__right">
                  <VolumeControl />
                  <button
                    className="navBar-Button fullScreenButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayInFullScreenSpotify(DisplayInFullScreen.App);
                      exitFullScreen();
                    }}
                  >
                    <FullScreenExit />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentContainer>
      <style jsx>{`
        :global(.app > div) {
          display: none;
        }
        :global(.back-to-player) {
          display: none;
        }
        .fullScreenPlayer :global(main) {
          margin: 0;
        }
        .player__track__info-text {
          position: relative;
          width: 100%;
        }
        .player__track__info {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0 1.5rem;
          width: 100%;
        }
        .player__track__info-text :global(a) {
          color: var(--text-color);
          text-decoration: none;
          max-width: 100%;
        }
        .player {
          display: flex;
          flex-direction: column;
          position: relative;
          background-color: var(--header-color);
          -webkit-backdrop-filter: blur(100px);
          box-shadow: rgb(100 100 111 / 20%) 0px 7px 29px 0px;
          height: 100vh;
          width: 100vw;
          padding: 0;
          padding: 0;
          transition-property: background-color;
          transition-duration: 0.5s;
          transition-timing-function: ease-in-out;
        }
        .player__track {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          position: relative;
          background-color: var(--header-color);
          -webkit-backdrop-filter: blur(100px);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition-property: background-color;
          transition-duration: 0.5s;
          transition-timing-function: ease-in-out;
          user-select: none;
        }
        .player-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2rem;
        }
        .player-container :global(.player *) {
          display: flex;
        }
        .player-container :global(.player) {
          display: flex;
          transform: scale(1.5);
          justify-self: center;
          grid-area: player;
        }
        .player-container :global(.progressBar) {
          max-width: calc(100% - 2rem);
        }
        .player-container__controls {
          display: grid;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 100%;
          padding: 0 2rem;
          gap: 2rem;
          grid-template-columns: 1fr 3fr 1fr;
          grid-template-rows: 1fr;
          grid-template-areas:
            "left player right"
            "left player right"
            "left player right";
        }
        .player-container__controls__left {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: start;
          grid-area: left;
        }
        .player-container__controls__right {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: end;
          grid-area: right;
        }
        .player-container__controls__right :global(.volume-slider) {
          min-width: 100px;
        }
        .navBar-Button {
          background: transparent;
          border: none;
          outline: none;
          margin: 0 10px;
          color: #ffffffb3;
        }
        .navBar-Button.fullScreenButton {
          color: #1db954;
        }
        .navBar-Button.fullScreenButton:hover {
          color: #27da65;
        }
        .player__track__image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
        }
        #cover-image {
          inset: 0px;
          box-sizing: border-box;
          padding: 0px;
          border: none;
          margin: auto auto 250px 24px;
          display: block;
          border-radius: 0.375rem;
          object-fit: cover;
          box-shadow:
            0 0 #0000,
            0 0 #0000,
            0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          align-self: center;
          justify-content: center;
        }
        .next-track-container {
          background: #1b1b1f;
          border: 1px solid hsla(0, 0%, 100%, 0.3);
          display: flex;
          color: #fff;
          z-index: 32;
          max-width: 100%;
        }
        .next-track-container__image {
          margin: 0.5em;
          vertical-align: baseline;
          box-sizing: border-box;
        }
        .next-track-container__info {
          display: flex;
          flex: 1;
          margin: 6px 8px;
          flex-direction: column;
          justify-content: center;
        }
        .next-track-container__info .title {
          font-size: 0.8rem;
          letter-spacing: 0.1111111111em;
          line-height: 1.7777777778em;
          text-transform: uppercase;
        }
        .next-track-container__info p {
          font-weight: 700;
          margin: 0;
        }
        .next-track-container__info .track-name {
          transform: translate3d(0px, 0px, 0px);
          transition: none 0s ease 0s;
          display: inline-block;
          overflow: hidden;
          text-indent: 0;
          white-space: nowrap;
          font-size: 12px;
        }
        .player_header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr;
          max-width: 100%;
          width: 100%;
          padding: 24px 2rem;
          gap: 2rem;
          margin: 0 auto;
          background-color: var(--header-color);
          transition-property: background-color;
          transition-duration: 0.5s;
          transition-timing-function: ease-in-out;
          user-select: none;
        }
        .player_header__left {
          display: flex;
          align-items: center;
          justify-content: start;
          grid-area: 1 / 1 / 2 / 2;
        }
        .player_header__center {
          display: flex;
          align-items: center;
          justify-content: center;
          grid-area: 1 / 2 / 2 / 3;
          justify-self: center;
        }
        .player_header__center :global(h2) {
          letter-spacing: -0.4px;
        }
        .player_header__right {
          display: flex;
          align-items: center;
          justify-content: end;
          grid-area: 1 / 3 / 2 / 4;
          position: relative;
          width: 100%;
        }
        @media screen and (max-width: 768px) {
          .player-container__controls {
            grid-template-columns: 1fr 3fr 1fr;
            grid-template-rows: 1fr 1fr;
            grid-template-areas:
              "player player player"
              "left c right"
              "left c right";
          }
          .player-container__controls__right :global(.volume-slider) {
            display: none;
          }
          .player_header__center :global(h2) {
            font-size: 1.5rem;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .player-container :global(.player) {
            transform: scale(1.3);
          }
          .player_header {
            display: flex;
            justify-content: center;
          }
          .player_header__left,
          .player_header__right {
            display: none;
          }
          #cover-image {
            margin: 32px auto;
          }
        }
      `}</style>
    </div>
  );
}
