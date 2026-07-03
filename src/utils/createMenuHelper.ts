import type {
  HeaderNavbarProps,
  MenuItemProps,
} from "@components/organisms/Header/types";
import type {
  AnchorLinkFragmentType,
  ExternalLinkFragmentType,
  MegaMenuItemFragmentType,
  MenuItemFragmentType,
} from "@graphql/fragment/commonFragments";
import type { SiteLocale } from "@graphql/types";
import { linkResolver } from "@utils/linkResolver";

function menuItemAdapter(
  item: MenuItemFragmentType | MegaMenuItemFragmentType,
  currentPath: string,
  locale: SiteLocale,
): MenuItemProps {
  const pageId = item.pointsTo.id;
  const finalHref = linkResolver(pageId, locale);

  const normalizedCurrent = currentPath.replace(/\/$/, "") || "/";
  const normalizedMenu = finalHref.replace(/\/$/, "") || "/";

  const isActive =
    normalizedMenu === "/"
      ? normalizedCurrent === "/"
      : normalizedCurrent.startsWith(normalizedMenu);

  const result: MenuItemProps = {
    id: item.id,
    title: item.title,
    url: finalHref,
    active: isActive,
  };

  if ("subMenu" in item) {
    result.image = item.image;
    result.caption = item.caption;
    result.subtitle = item.subtitle;
    result.subMenuItems = item.subMenu?.map((menu) =>
      menuItemAdapter(menu, currentPath, locale),
    );
  }

  return result;
}

function metaMenuItemAdapter(
  item: ExternalLinkFragmentType,
  currentPath: string,
): MenuItemProps {
  const finalHref = item.url;

  const normalizedCurrent = currentPath.replace(/\/$/, "") || "/";
  const normalizedMenu = finalHref.replace(/\/$/, "") || "/";

  const isActive =
    normalizedMenu === "/"
      ? normalizedCurrent === "/"
      : normalizedCurrent.startsWith(normalizedMenu);

  return {
    id: item.id,
    title: item.label,
    url: finalHref,
    active: isActive,
  };
}

type SecondaryItem =
  | MegaMenuItemFragmentType
  | MenuItemFragmentType
  | ExternalLinkFragmentType;

// I record interni (Menu/MegaMenu) hanno `pointsTo`; gli ExternalLinkRecord no.
function isExternalLink(item: SecondaryItem): item is ExternalLinkFragmentType {
  return !("pointsTo" in item);
}

function secondaryItemAdapter(
  item: SecondaryItem,
  currentPath: string,
  locale: SiteLocale,
): MenuItemProps {
  if (isExternalLink(item)) {
    return { ...metaMenuItemAdapter(item, currentPath), isExternal: true };
  }
  return menuItemAdapter(item, currentPath, locale);
}

type MainItem =
  | MegaMenuItemFragmentType
  | MenuItemFragmentType
  | AnchorLinkFragmentType;

// Gli AnchorLinkRecord hanno `anchor`; Menu/MegaMenu hanno `pointsTo`.
function isAnchorLink(item: MainItem): item is AnchorLinkFragmentType {
  return "anchor" in item;
}

// Ancora verso una sezione della homepage: es. `/it#misure`.
function anchorLinkAdapter(
  item: AnchorLinkFragmentType,
  homePath: string,
): MenuItemProps {
  const anchor = item.anchor ?? "";
  const base = homePath && homePath !== "#" ? homePath : "/";
  return {
    id: item.id,
    title: item.label ?? "",
    url: anchor ? `${base}#${anchor}` : base,
    active: false,
  };
}

function mainItemAdapter(
  item: MainItem,
  currentPath: string,
  locale: SiteLocale,
  homePath: string,
): MenuItemProps {
  if (isAnchorLink(item)) {
    return anchorLinkAdapter(item, homePath);
  }
  return menuItemAdapter(item, currentPath, locale);
}

export function createMenu(
  mainItems: MainItem[] = [],
  secondaryItems: SecondaryItem[] = [],
  currentPathname: string,
  currentLocale: SiteLocale,
  homeRecordId?: string,
): HeaderNavbarProps {
  const homePath = linkResolver(homeRecordId, currentLocale);
  return {
    left: mainItems.map((item) =>
      mainItemAdapter(item, currentPathname, currentLocale, homePath),
    ),
    right: secondaryItems.map((item) =>
      secondaryItemAdapter(item, currentPathname, currentLocale),
    ),
  };
}

export function createMetaMenu(
  metaNavigation: ExternalLinkFragmentType[] = [],
  currentPathname: string,
): MenuItemProps[] {
  return metaNavigation.map((item) =>
    metaMenuItemAdapter(item, currentPathname),
  );
}
