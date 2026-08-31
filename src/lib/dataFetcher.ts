import { AllArticleCardsQuery } from "@graphql/query/articleCards";
import { LayoutQuery } from "@graphql/query/layout";
import { AllMeasuresQuery } from "@graphql/query/measure";
import { AllNewsQuery } from "@graphql/query/news";
import { AllResourcesQuery } from "@graphql/query/resource";
import { AllWebinarQuery } from "@graphql/query/webinar";
import { executeAutoPagingQuery, executeQuery } from "@lib/datocms";
import { getCollection, getEntry } from "astro:content";

const wrap = <T>(items: T[]) => items.map((item) => ({ data: item }));

export const getNews = async (isPreview: boolean) => {
  if (isPreview) {
    const res = await executeAutoPagingQuery(AllNewsQuery, {
      includeDrafts: true,
    });
    return wrap(res?.allNewsItems ?? []);
  }
  return await getCollection("news_item");
};

export const getArticles = async (isPreview: boolean) => {
  const res = await executeQuery(AllArticleCardsQuery, {
    includeDrafts: isPreview,
  });
  return res?.allArticles ?? [];
};

export const getWebinars = async (isPreview: boolean) => {
  if (isPreview) {
    const res = await executeAutoPagingQuery(AllWebinarQuery, {
      includeDrafts: true,
    });
    return wrap(res?.allWebinarItems ?? []);
  }
  return await getCollection("webinar_item");
};

export const getMeasures = async (isPreview: boolean) => {
  if (isPreview) {
    const res = await executeAutoPagingQuery(AllMeasuresQuery, {
      includeDrafts: true,
    });
    return wrap(res?.allMeasures ?? []);
  }
  return await getCollection("measure");
};

export const getResources = async (isPreview: boolean) => {
  if (isPreview) {
    const res = await executeAutoPagingQuery(AllResourcesQuery, {
      includeDrafts: true,
    });
    return wrap(res?.allResources ?? []);
  }
  return await getCollection("resource");
};

export async function getGlobalSettings(lang: string) {
  const globalSettingsCollection = await getCollection("global_settings");
  const globalSettingLocale = globalSettingsCollection.find(
    (setting) => setting.data.locale === lang,
  );
  return globalSettingLocale?.data.value;
}

export const getLayout = async (isPreview: boolean) => {
  if (isPreview) {
    const res = await executeQuery(LayoutQuery, {
      includeDrafts: true,
    });
    return {
      id: "layout",
      data: {
        layout: res?.layout,
        search: res?.search,
        homepageId: res?.homepage?.id,
      },
    };
  }
  const entry = await getEntry("layout", "layout");
  return entry;
};
