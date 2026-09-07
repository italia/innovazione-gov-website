import { Client } from "@datocms/cli/lib/cma-client-node";

type SelectOption = { hint: string; label: string; value: string };

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
  if (values.includes("project")) {
    console.log("`project` già presente tra i tipi di articolo");
    return;
  }

  console.log(
    'Add option "Attività (progetti)" (`project`) to field `article_type` of model "Articolo" (`article`)',
  );
  await client.fields.update(articleType.id, {
    validators: {
      ...articleType.validators,
      enum: { values: [...values, "project"] },
    },
    appearance: {
      ...articleType.appearance,
      parameters: {
        ...articleType.appearance.parameters,
        options: [
          ...options,
          {
            hint: "Le attività e i progetti coordinati dal Dipartimento.",
            label: "Attività (progetti)",
            value: "project",
          },
        ],
      },
    },
  });
}
