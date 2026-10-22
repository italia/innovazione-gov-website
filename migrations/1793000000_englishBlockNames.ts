import { Client } from "@datocms/cli/lib/cma-client-node";

const NOMI_INGLESI: Record<string, string> = {
  accordion_showcase: "Accordion showcase",
  anchor_link: "Anchor link",
  article_intro: "Article intro with topics",
  attachments_box: "Attachments box",
  benefit: "Benefit",
  fetch_item: "Fetch item",
  footer_column: "Footer column",
  goals_achived: "Goals achieved",
  highlight_carousel: "Highlight carousel",
  highlight_item: "Highlight item",
  insight_topic: "Articles and subpages category",
  intro_detail: "Intro detail",
  job_position_list: "Job position list",
  news_tab: "External content tab",
  settings_chart: "Chart settings",
  settings_kpi: "Kpi settings",
  showcase_item: "Showcase item",
  story_tab: "Internal content tab",
  topic_highlight: "Topic highlight",
  topic_list: "Topic list",
  webinar_author: "Speakers",
  webinar_item: "Webinars and events",
  webinar_topic: "Webinars and events category",
  wide_link_card: "Wide link card",
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const menuItems = await client.menuItems.list();
  const nelMenu = new Set(
    menuItems
      .map((menuItem) => menuItem.item_type?.id)
      .filter((id): id is string => !!id),
  );

  for (const [apiKey, nome] of Object.entries(NOMI_INGLESI)) {
    const itemType = itemTypes.find((tipo) => tipo.api_key === apiKey);
    if (!itemType || itemType.name === nome) continue;
    if (nelMenu.has(itemType.id)) {
      console.log(`Skip "${itemType.name}": ha una voce nel menu laterale`);
      continue;
    }
    console.log(`Rename "${itemType.name}" → "${nome}" (${apiKey})`);
    await client.itemTypes.update(itemType.id, { name: nome });
  }
}
