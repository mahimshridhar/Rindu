import React from "react";

import { Meta, StoryFn } from "@storybook/react";

import { playlists, track } from "../mocks";
import { PageDetails } from "components";

export default {
  title: "Components/PageDetails",
  component: PageDetails,
  parameters: {
    layout: "fullscreen",
    container: {
      disablePadding: true,
    },
    spotifyValue: {
      playlistPlayingId: false,
      playlists: playlists,
    },
  },
} as Meta<typeof PageDetails>;

const Template: StoryFn<typeof PageDetails & { playlistPlayingId: string }> = (
  args
) => {
  return <PageDetails {...args} />;
};

export const Default = {
  render: Template,
};

export const WithBanner = {
  render: Template,

  args: {
    banner:
      "https://www.theaudiodb.com/images/media/artist/fanart/qqwxxp1542730121.jpg",
  },
};

export const WithData = {
  render: Template,

  args: {
    data: track,
  },
};
