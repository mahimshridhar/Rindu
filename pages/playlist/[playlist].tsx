import { NextApiRequest, NextApiResponse, NextPage } from "next";
import { AllTracksFromAPlaylistResponse, ISpotifyContext } from "types/spotify";
import PlaylistLayout from "layouts/playlist";
import { getAuth } from "utils/getAuth";
import { serverRedirect } from "utils/serverRedirect";
import { getPlaylistDetails } from "utils/spotifyCalls/getPlaylistDetails";
import { getTracksFromPlayList } from "utils/spotifyCalls/getTracksFromPlayList";
import { checkTracksInLibrary } from "utils/spotifyCalls/checkTracksInLibrary";

export interface PlaylistProps {
  playlistDetails: ISpotifyContext["playlistDetails"] | null;
  tracksInLibrary: boolean[] | null;
  playListTracks: AllTracksFromAPlaylistResponse | null;
  accessToken: string | null;
  user: SpotifyApi.UserObjectPrivate | null;
}

const Playlist: NextPage<PlaylistProps> = (props) => {
  return (
    <PlaylistLayout
      isLibrary={false}
      playlistDetails={props.playlistDetails}
      playListTracks={props.playListTracks}
      tracksInLibrary={props.tracksInLibrary}
      user={props.user}
      accessToken={props.accessToken}
    />
  );
};

export default Playlist;

export async function getServerSideProps({
  params: { playlist },
  req,
  res,
}: {
  params: { playlist: string };
  req: NextApiRequest;
  res: NextApiResponse;
}): Promise<{
  props: PlaylistProps | null;
}> {
  const cookies = req?.headers?.cookie;
  if (!cookies) {
    serverRedirect(res, "/");
    return { props: null };
  }
  const { accessToken, user } = (await getAuth(res, cookies)) || {};

  const playlistDetails = await getPlaylistDetails(
    playlist,
    accessToken,
    cookies
  );
  const playListTracks = await getTracksFromPlayList(
    playlist,
    user?.country ?? "US",
    accessToken,
    cookies
  );

  const trackIds = playListTracks?.tracks.map(({ id }) => id);
  const tracksInLibrary = await checkTracksInLibrary(
    trackIds as string[],
    accessToken || ""
  );
  return {
    props: {
      playlistDetails,
      tracksInLibrary,
      playListTracks,
      accessToken: accessToken ?? null,
      user: user ?? null,
    },
  };
}
