import { createPortal } from "react-dom";
import {
  ReactPortal,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import useContextMenu from "hooks/useContextMenu";
import useToast from "hooks/useToast";
import { addToQueue } from "utils/spotifyCalls/addToQueue";
import useSpotify from "hooks/useSpotify";
import useAuth from "hooks/useAuth";
import { saveEpisodesToLibrary } from "utils/spotifyCalls/saveEpisodesToLibrary";
import { saveTracksToLibrary } from "utils/spotifyCalls/saveTracksToLibrary";
import { addItemsToPlaylist } from "utils/spotifyCalls/addItemsToPlaylist";

export default function ContextMenu(): ReactPortal | null {
  const [targetNode, setTargetNode] = useState<Element | null>();
  const { addToast } = useToast();
  const { deviceId, playlists } = useSpotify();
  const { accessToken } = useAuth();
  const { contextMenuData, removeContextMenu } = useContextMenu();
  const [isDifferentPosX, setIsDifferentPosX] = useState<boolean>(false);
  const [isDifferentPosY, setIsDifferentPosY] = useState<boolean>(false);
  const [contextMenuPos, setContextMenuPos] = useState({
    x: (contextMenuData?.position.x ?? 0) - 30,
    y: (contextMenuData?.position.y ?? 0) - 40,
  });
  const contextMenuRef = useRef<HTMLElement>(null);
  const playlistsRef = useRef<HTMLDivElement>(null);
  const [showAddPlaylistPopup, setShowAddPlaylistPopup] =
    useState<boolean>(false);
  const { user } = useAuth();
  const userPlaylists = playlists.filter(
    (playlist) => playlist.owner.id === user?.id
  );

  useLayoutEffect(() => {
    if (!showAddPlaylistPopup) return;
    const playlistsCount = userPlaylists.length ?? 0;
    const playlistsContainerHeight = playlistsCount * 44;
    const playlistsContainer = playlistsRef.current;
    const screenHeight = window.innerHeight;

    if (playlistsContainer) {
      const playlistsRefPosition = playlistsContainer.getBoundingClientRect();
      if (playlistsContainerHeight > screenHeight) {
        playlistsContainer.style.height = `${screenHeight - 100}px`;
        playlistsContainer.style.top = `${-playlistsRefPosition.top + 50}px`;
      }
    }
  }, [userPlaylists, showAddPlaylistPopup, contextMenuData]);

  useEffect(() => {
    setTargetNode(document.querySelector("#contextMenu"));
  }, []);

  useEffect(() => {
    if (!contextMenuData) return;

    document.querySelector("#__next")?.addEventListener(
      "click",
      () => {
        removeContextMenu();
      },
      { once: true }
    );
    return () => {
      document.querySelector("#__next")?.removeEventListener("click", () => {
        removeContextMenu();
      });
    };
  }, [contextMenuData, removeContextMenu]);

  useLayoutEffect(() => {
    setIsDifferentPosX(false);
    setIsDifferentPosY(false);
    if (
      (!contextMenuData?.position.x && !contextMenuData?.position.y) ||
      !contextMenuRef.current
    ) {
      return;
    }
    const contextMenuRectWitdh =
      contextMenuRef.current?.getClientRects()[0]?.width || 0;
    const contextMenuRectHeight =
      contextMenuRef.current?.getClientRects()[0]?.height || 0;
    const isContextMenuWitdhOffScreen =
      contextMenuData.position.x &&
      innerWidth - contextMenuData.position.x < contextMenuRectWitdh;
    const isContextMenuHeightOffScreen =
      contextMenuData.position.y &&
      innerHeight - contextMenuData.position.y < contextMenuRectHeight;
    if (isContextMenuWitdhOffScreen) {
      setContextMenuPos((prevState) => ({
        ...prevState,
        x: innerWidth - contextMenuRectWitdh - 30,
      }));
      setIsDifferentPosX(true);
    }
    if (isContextMenuHeightOffScreen) {
      setContextMenuPos((prevState) => ({
        ...prevState,
        y: innerHeight - contextMenuRectHeight - 10,
      }));
      setIsDifferentPosY(true);
    }
    if (!isContextMenuWitdhOffScreen && !isContextMenuHeightOffScreen) {
      setIsDifferentPosX(false);
      setIsDifferentPosY(false);
    }
  }, [contextMenuData?.position?.x, contextMenuData?.position?.y]);

  if (targetNode === null) {
    throw new Error("ContextMenu needs a target element with id: contextMenu");
  }

  if (targetNode === undefined || !contextMenuData) {
    return null;
  }

  const top = isDifferentPosY
    ? contextMenuPos.y
    : !contextMenuData.position.y || contextMenuData.position.y < 45
    ? 50
    : contextMenuData.position.y;
  const left = isDifferentPosX
    ? contextMenuPos.x
    : !contextMenuData.position.x || contextMenuData.position.x < 45
    ? 50
    : contextMenuData.position.x;

  return createPortal(
    <section
      ref={contextMenuRef}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <ul>
        {contextMenuData.data?.uri && deviceId && (
          <li>
            <button
              type="button"
              onClick={() => {
                if (contextMenuData.data?.uri && deviceId) {
                  addToQueue(
                    contextMenuData.data.uri,
                    deviceId,
                    accessToken
                  ).then((res) => {
                    if (res) {
                      addToast({
                        variant: "success",
                        message: "Added to queue",
                      });
                    } else {
                      addToast({
                        variant: "error",
                        message: "Could not add to queue",
                      });
                    }
                    removeContextMenu();
                  });
                }
              }}
            >
              Add to queue
            </button>
          </li>
        )}
        <li>
          <div
            onMouseEnter={() => {
              setShowAddPlaylistPopup(true);
            }}
            onMouseLeave={() => {
              setShowAddPlaylistPopup(false);
            }}
            role="button"
            tabIndex={0}
          >
            Add to playlist
          </div>
          {showAddPlaylistPopup && (
            <div
              ref={playlistsRef}
              className="playlists-container"
              onMouseEnter={() => {
                setShowAddPlaylistPopup(true);
              }}
              onMouseLeave={() => {
                setShowAddPlaylistPopup(false);
              }}
            >
              <ul>
                {userPlaylists?.map((playlist) => {
                  return (
                    <li key={playlist.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (contextMenuData.data?.uri && deviceId) {
                            addItemsToPlaylist(playlist.id, [
                              contextMenuData.data.uri,
                            ]).then((res) => {
                              if (res) {
                                addToast({
                                  variant: "success",
                                  message: "Added to playlist",
                                });
                              } else {
                                addToast({
                                  variant: "error",
                                  message: "Could not add to playlist",
                                });
                              }
                              setShowAddPlaylistPopup(false);
                              removeContextMenu();
                            });
                          }
                        }}
                      >
                        {playlist.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              // TODO: create path station/${type}/${id} where type can be (playlist, show, track, album,episde)
              // It should use the recommendations API
              // This will be used to push to that page
              addToast({
                variant: "error",
                message: "This feature is not implemented yet",
              });
              removeContextMenu();
            }}
          >
            Go to song Radio
          </button>
        </li>
        {contextMenuData.data?.artists &&
          contextMenuData.data.artists?.length > 0 && (
            <li>
              <Link href={`/artist/${contextMenuData.data.artists?.[0].id}`}>
                <a
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      removeContextMenu();
                    }
                  }}
                  role="link"
                  onClick={() => {
                    removeContextMenu();
                  }}
                >
                  Go to artist
                </a>
              </Link>
            </li>
          )}
        {contextMenuData?.data?.album?.id && (
          <li>
            <Link href={`/album/${contextMenuData.data.album.id}`}>
              <a
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    removeContextMenu();
                  }
                }}
                role="link"
                onClick={() => {
                  removeContextMenu();
                }}
              >
                Go to {contextMenuData.data?.album?.type ?? "album"}
              </a>
            </Link>
          </li>
        )}
        {contextMenuData.data && deviceId && (
          <li>
            <button
              type="button"
              onClick={() => {
                const saveToLibrary =
                  contextMenuData.data.type === "episode"
                    ? saveEpisodesToLibrary
                    : saveTracksToLibrary;
                saveToLibrary(
                  [contextMenuData.data.id ?? ""],
                  accessToken
                ).then((res) => {
                  if (res) {
                    addToast({
                      variant: "success",
                      message: `${
                        contextMenuData.data.type === "episode"
                          ? "Episode"
                          : "Song"
                      } added to library`,
                    });
                  } else {
                    addToast({
                      variant: "error",
                      message: "Could not add to library",
                    });
                  }
                  removeContextMenu();
                });
              }}
            >
              Save to Your{" "}
              {contextMenuData.data.type === "episode"
                ? "Episodes"
                : "Liked songs"}
            </button>
          </li>
        )}
        {contextMenuData.data?.uri && (
          <li>
            <a
              href={contextMenuData.data.uri}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Spotify App
            </a>
          </li>
        )}
      </ul>
      <style jsx>{`
        section {
          max-width: 400px;
          width: fit-content;
          position: absolute;
          margin: 0 auto;
          border-radius: 5px;
          background-color: #282828;
          box-shadow: 0px 2px 9px 0px rgb(0 0 0 / 5%);
          padding: 3px;
          max-height: 95vh;
          z-index: 999999999999;
        }
        .playlists-container {
          position: absolute;
          top: 0;
          left: 98%;
          padding: 6px 2px;
          border-radius: 5px;
          background-color: #282828;
          max-width: 200px;
          overflow: auto;
        }
        li :global(svg) {
          margin-left: 16px;
        }
        li :global(a) {
          text-decoration: none;
          color: #fff;
          cursor: default;
        }
        li {
          background-color: transparent;
          width: max-content;
          min-width: 100%;
          height: 40px;
          border: none;
          display: flex;
          align-content: center;
          justify-content: space-between;
          font-weight: 400;
          font-size: 14px;
          line-height: 16px;
          color: #ffffffe6;
          cursor: pointer;
          text-align: start;
          text-decoration: none;
          cursor: default;
          border-radius: 3px;
          align-items: center;
          width: 100%;
        }
        li > :first-child {
          background: none;
          border: none;
          padding: 8px 10px;
          width: 100%;
          text-align: start;
          display: flex;
          -webkit-line-clamp: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: -webkit-box;
          width: 100%;
          -webkit-box-orient: vertical;
          height: fit-content;
        }
        li:hover,
        li:focus {
          outline: none;
          background-color: #ffffff1a;
        }
      `}</style>
    </section>,
    targetNode
  );
}