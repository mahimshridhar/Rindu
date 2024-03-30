import { ChangeEvent, ReactElement, useEffect, useState } from "react";

import DOMPurify from "dompurify";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import {
  ContentContainer,
  Heading,
  Searchable,
  SearchInput,
  SelectControl,
} from "components";
import { useAnalytics, useSpotify, useTranslations } from "hooks";
import { AsType } from "types/heading";
import { ITranslations } from "types/translations";
import {
  getAuth,
  getLocale,
  getTranslations,
  Locale,
  LOCALE_COOKIE,
  makeCookie,
  serverRedirect,
} from "utils";

interface PreferencesProps {
  user: SpotifyApi.UserObjectPrivate | null;
  translations: ITranslations;
  locale: string;
}

export default function PreferencesPage(): ReactElement {
  const { translations, locale: defaultLocale, locales } = useTranslations();
  const [locale, setLocale] = useState(defaultLocale);
  const [isReload, setIsReload] = useState(false);
  const { trackWithGoogleAnalytics } = useAnalytics();
  const router = useRouter();
  const { setIgnoreShortcuts } = useSpotify();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    trackWithGoogleAnalytics();
  }, [router, trackWithGoogleAnalytics]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = DOMPurify.sanitize(event.target.value);
    setSearchTerm(value);
  };

  const handleDeleteSearch = () => {
    setSearchTerm("");
  };

  return (
    <ContentContainer>
      <div className="preferences-container">
        <div className="inputs-container">
          <Heading number={3} as={AsType.H1}>
            {translations.pages.preferences.preferences}
          </Heading>
          <SearchInput
            hide={!searchTerm}
            handleDeleteSearch={handleDeleteSearch}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => {
              setIgnoreShortcuts.on();
            }}
            onBlur={() => {
              setIgnoreShortcuts.off();
            }}
            onKeyDown={(e) => {
              if (e.key === " ") {
                e.stopPropagation();
              }
            }}
            autoComplete="false"
            autoCorrect="false"
            spellCheck="false"
          />
        </div>
        <Searchable searchTerm={searchTerm}>
          <>
            <Heading number={4} as={AsType.H2}>
              {translations.pages.preferences.language}
            </Heading>
            <div className="inputs-container">
              <div className="label-container">
                <label htmlFor="language">
                  {translations.pages.preferences.languageLabel}
                </label>
              </div>
              <div className="select-container">
                <SelectControl
                  value={locale}
                  defaultValue={locale}
                  options={locales.map((value) => {
                    return {
                      label: translations.pages.preferences.localLabel[value],
                      value: value,
                    };
                  })}
                  id="language"
                  onChange={(e) => {
                    setLocale(getLocale(e.target.value));

                    setIsReload(true);
                  }}
                />
              </div>
            </div>
          </>
        </Searchable>
        {isReload && (
          <div>
            <button
              className="reload button"
              onClick={() => {
                makeCookie({
                  name: LOCALE_COOKIE,
                  value: locale ?? Locale.EN,
                });

                setIsReload(false);
                window.location.reload();
              }}
            >
              {translations.pages.preferences.reload}
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .preferences-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin: 0 auto;
          max-width: 900px;
          padding: 16px 32px;
        }
        .inputs-container {
          display: grid;
          gap: 8px 24px;
          grid-template-columns: 1fr 250px;
        }
        .label-container {
          align-items: center;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
        }
        label {
          box-sizing: border-box;
          margin-block: 0px;
          font-size: 0.875rem;
          font-weight: 400;
          color: #6a6a6a;
        }
        .select-container {
          align-items: center;
          display: flex;
          justify-content: flex-end;
          position: relative;
          width: 100%;
        }
        button.reload {
          box-sizing: border-box;
          font-size: 1rem;
          font-weight: 700;
          background-color: transparent;
          border-radius: 500px;
          cursor: pointer;
          position: relative;
          text-align: center;
          text-decoration: none;
          text-transform: none;
          touch-action: manipulation;
          transition-duration: 33ms;
          transition-property: background-color, border-color, color, box-shadow,
            filter, transform;
          user-select: none;
          vertical-align: middle;
          transform: translate3d(0px, 0px, 0px);
          padding-block: 7px;
          padding-inline: 31px;
          border: 1px solid #727272;
          color: #fff;
          min-block-size: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        button.reload:focus {
          outline: none;
        }
        button.reload:hover {
          transform: scale(1.04);
          border-color: #fff;
        }
        button.reload:active {
          opacity: 0.7;
          outline: none;
          transform: scale(1);
          border-color: #727272;
        }
      `}</style>
    </ContentContainer>
  );
}

export const getServerSideProps = (async (context) => {
  const cookies = context.req?.headers?.cookie ?? "";
  const translations = getTranslations(context);
  if (!cookies) {
    serverRedirect(context.res, "/");
    return { props: {} };
  }

  const { user } = (await getAuth(context)) ?? {};

  return {
    props: {
      user: user ?? null,
      translations,
    },
  };
}) satisfies GetServerSideProps<Partial<PreferencesProps>>;
