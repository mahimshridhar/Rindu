import { ACCESS_TOKEN_COOKIE } from "utils/constants";
import { takeCookie } from "utils/cookies";

export async function getPlaylistsFromUser(
  userId: string,
  accessToken?: string
): Promise<SpotifyApi.ListOfUsersPlaylistsResponse | null> {
  if (!accessToken || !userId) {
    return null;
  }
  const res = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          accessToken ? accessToken : takeCookie(ACCESS_TOKEN_COOKIE)
        }`,
      },
    }
  );
  if (res.ok) {
    const data: SpotifyApi.ListOfUsersPlaylistsResponse = await res.json();
    return data;
  }
  return null;
}