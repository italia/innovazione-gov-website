import { Client } from "@datocms/cli/lib/cma-client-node";

type SelectOption = { hint: string; label: string; value: string };

const INTERNATIONAL = "international";
const PARENT_SLUG = "attivita-internazionali";

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isOptionList = (value: unknown): value is SelectOption[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "value" in entry &&
      typeof entry.value === "string",
  );

const readEnumValues = (validators: unknown): string[] | null => {
  if (typeof validators !== "object" || validators === null) return null;
  if (!("enum" in validators)) return null;
  const { enum: candidate } = validators;
  if (typeof candidate !== "object" || candidate === null) return null;
  if (!("values" in candidate)) return null;
  const { values } = candidate;
  return isStringList(values) ? values : null;
};

const readOptions = (parameters: unknown): SelectOption[] | null => {
  if (typeof parameters !== "object" || parameters === null) return null;
  if (!("options" in parameters)) return null;
  const { options } = parameters;
  return isOptionList(options) ? options : null;
};

const localizedValue = (field: unknown): string | null => {
  if (typeof field === "string") return field;
  if (typeof field !== "object" || field === null) return null;
  const perLocale = field as Record<string, unknown>;
  if (typeof perLocale.it === "string") return perLocale.it;
  const first = Object.values(perLocale).find(
    (entry) => typeof entry === "string",
  );
  return typeof first === "string" ? first : null;
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);
  const articleType = fields.find((field) => field.api_key === "article_type");
  if (!articleType) throw new Error("campo article_type non trovato");

  const values = readEnumValues(articleType.validators);
  const options = readOptions(articleType.appearance.parameters);
  if (!values || !options)
    throw new Error("il campo article_type non espone enum e opzioni attese");

  if (values.includes(INTERNATIONAL)) {
    console.log(`\`${INTERNATIONAL}\` già presente tra i tipi di articolo`);
  } else {
    console.log(
      'Add option "Attività internazionali" (`international`) to field `article_type` of model "Articolo" (`article`)',
    );
    await client.fields.update(articleType.id, {
      validators: {
        ...articleType.validators,
        enum: { values: [...values, INTERNATIONAL] },
      },
      appearance: {
        ...articleType.appearance,
        parameters: {
          ...articleType.appearance.parameters,
          options: [
            ...options,
            {
              hint: "Le attività internazionali ricorrenti del Dipartimento: non compaiono fra i Focus.",
              label: "Attività internazionali",
              value: INTERNATIONAL,
            },
          ],
        },
      },
    });
  }

  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  if (!insight) throw new Error("modello insight non trovato");

  const parents = [];
  for await (const record of client.items.listPagedIterator({
    filter: { type: insight.id },
    nested: false,
  })) {
    if (localizedValue(record.slug) === PARENT_SLUG) parents.push(record.id);
  }
  if (parents.length !== 1)
    throw new Error(
      `attesa una pagina "${PARENT_SLUG}", trovate ${parents.length}`,
    );
  const [parentId] = parents;

  const daRitipizzare = [];
  for await (const record of client.items.listPagedIterator({
    filter: { type: article.id },
    nested: false,
  })) {
    if (record.article_type !== "focus") continue;
    if (localizedValue(record.parent_page) !== parentId) continue;
    daRitipizzare.push(record);
  }

  if (!daRitipizzare.length) {
    console.log("nessun focus da ritipizzare sotto le attività internazionali");
    return;
  }

  for (const record of daRitipizzare) {
    const titolo = localizedValue(record.title) ?? record.id;
    console.log(`Retype "${titolo}" from \`focus\` to \`${INTERNATIONAL}\``);
    await client.items.update(record.id, { article_type: INTERNATIONAL });
    if (record.meta.status === "published") {
      await client.items.publish(record.id);
    }
  }
}
