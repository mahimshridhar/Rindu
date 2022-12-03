import useSpotify from "hooks/useSpotify";
import { ReactElement } from "react";
import { callPictureInPicture } from "utils/callPictureInPicture";
import { PictureInPicture } from "./icons/PictureInPicture";

export default function PictureInPictureButton(): ReactElement {
  const {
    pictureInPictureCanvas,
    videoRef,
    setIsPip,
    isPip,
    isPictureInPictureLyircsCanvas,
    setIsPictureInPictureLyircsCanvas,
  } = useSpotify();
  return (
    <button
      type="button"
      aria-label="Picture in Picture"
      className="navBar-Button pictureInPicture"
      onClick={async () => {
        if (pictureInPictureCanvas.current && videoRef.current) {
          if (
            isPip &&
            document.pictureInPictureElement &&
            !isPictureInPictureLyircsCanvas
          ) {
            setIsPip(false);
            setIsPictureInPictureLyircsCanvas.off();
            await document.exitPictureInPicture();
          } else {
            setIsPictureInPictureLyircsCanvas.off();
            setIsPip(true);
            callPictureInPicture(
              pictureInPictureCanvas.current,
              videoRef.current
            );
          }
        }
      }}
    >
      <PictureInPicture />
      <style jsx>{`
        .navBar-Button {
          background: transparent;
          border: none;
          outline: none;
          margin: 0 10px;
          color: #ffffffb3;
        }
        .navBar-Button.pictureInPicture {
          color: ${isPip && !isPictureInPictureLyircsCanvas
            ? "#1db954"
            : "#ffffffb3"};
        }
        .navBar-Button.pictureInPicture:hover {
          color: ${isPip && !isPictureInPictureLyircsCanvas
            ? "#1db954"
            : "#fff"};
        }
      `}</style>
    </button>
  );
}