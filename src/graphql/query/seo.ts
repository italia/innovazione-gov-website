import { TagFragment } from "@graphql/fragment/commonFragments";
import { SeoFieldFragment } from "@graphql/fragment/seoFragments";
import { graphql } from "@graphql/graphql";

export const HomepageSeoQuery = graphql(
  `
    query HomepageSeo($locale: SiteLocale!) {
      homepage(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const SearchSeoQuery = graphql(
  `
    query SearchSeo($locale: SiteLocale!) {
      search(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const ArticlesSeoQuery = graphql(
  `
    query ArticlesSeo($locale: SiteLocale!) {
      allArticles(locale: $locale, first: 2500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const InsightsSeoQuery = graphql(
  `
    query InsightsSeo($locale: SiteLocale!) {
      allInsights(locale: $locale, first: 2500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const CataloguesSeoQuery = graphql(
  `
    query CataloguesSeo($locale: SiteLocale!) {
      allCatalogues: allIndexPages(locale: $locale, first: 2500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const PagesSeoQuery = graphql(
  `
    query PagesSeo($locale: SiteLocale!) {
      allPages(locale: $locale, first: 2500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const WebinarsSeoQuery = graphql(
  `
    query WebinarsSeo($locale: SiteLocale!) {
      allWebinarItems(locale: $locale, first: 2500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);

export const GlobalSeoQuery = graphql(
  `
    query GlobalSeoQuery($locale: SiteLocale!) {
      allArticles(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
      allInsights(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
      allCatalogues: allIndexPages(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
      homepage(locale: $locale) {
        id
        metaTags: _seoMetaTags(locale: $locale) {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
      allPages(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
      allWebinarItems(locale: $locale) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);
