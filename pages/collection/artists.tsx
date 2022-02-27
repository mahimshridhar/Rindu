import Head from "next/head";
import useHeader from "hooks/useHeader";
import { useEffect, ReactElement, useState } from "react";
import Link from "next/link";
import PresentationCard from "components/forDashboardPage/PlaylistCard";
import useAuth from "hooks/useAuth";

async function getAllArtists(accessToken: string) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/following?type=artist&limit=50",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await res.json();
  return data.artists;
}

export default function CollectionPlaylists(): ReactElement {
  const { setElement } = useHeader({ showOnFixed: true });
  const { accessToken } = useAuth();
  const [artists, setArtists] = useState<SpotifyApi.ArtistObjectFull[]>([]);

  useEffect(() => {
    setElement(() => {
      return (
        <div>
          <Link href="/collection/playlists">
            <a>Playlists</a>
          </Link>
          <Link href="/collection/podcasts">
            <a>Podcasts</a>
          </Link>
          <Link href="/collection/artists">
            <a>Artists</a>
          </Link>
          <Link href="/collection/albums">
            <a>Albums</a>
          </Link>
          <style jsx>{`
            div {
              display: flex;
              column-gap: 8px;
              margin-left: 24px;
            }
            a {
              padding: 12px 18px;
              color: white;
              text-decoration: none;
              font-weight: 800;
              font-size: 13px;
              border-radius: 4px;
            }
            a:nth-of-type(3) {
              background-color: #343434;
            }
          `}</style>
        </div>
      );
    });

    return () => {
      setElement(null);
    };
  }, [setElement]);

  useEffect(() => {
    if (!accessToken) return;

    async function getArtists() {
      const allArtists: SpotifyApi.UsersFollowedArtistsResponse["artists"] =
        await getAllArtists(accessToken as string);
      setArtists(allArtists.items);
    }
    getArtists();
  }, [accessToken, setArtists]);

  return (
    <main>
      <Head>
        <title>Rindu - Library</title>
      </Head>
      <h2>Artists</h2>
      <section>
        {artists?.length > 0
          ? artists.map(({ id, images, name }) => {
              return (
                <PresentationCard
                  type="artist"
                  key={id}
                  images={images}
                  title={name}
                  subTitle={"Artist"}
                  id={id}
                />
              );
            })
          : null}
      </section>
      <style jsx>{`
        main {
          display: block;
          min-height: calc(100vh - 90px);
          width: calc(100vw - 245px);
          max-width: 1400px;
          margin: 0 auto;
          padding: 0px 30px;
        }
        h2 {
          color: #fff;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 28px;
          text-transform: none;
          margin: 0;
        }
        section {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          grid-gap: 24px;
          margin: 20px 0 50px 0;
          justify-content: space-between;
        }
      `}</style>
    </main>
  );
}