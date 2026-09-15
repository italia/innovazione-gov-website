import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  for (const apiKey of ["page", "insight"]) {
    const model = itemTypes.find((itemType) => itemType.api_key === apiKey);
    if (!model) continue;

    const fields = await client.fields.list(model.id);
    if (fields.some((field) => field.api_key === "sections_nav_layout")) {
      console.log(`\`sections_nav_layout\` già presente su ${apiKey}`);
      continue;
    }

    const showSectionsNav = fields.find(
      (field) => field.api_key === "show_sections_nav",
    );

    console.log(
      `Create Single-line string field "Posizione dell'indice" (\`sections_nav_layout\`) in model \`${apiKey}\``,
    );
    await client.fields.create(model.id, {
      label: "Posizione dell'indice",
      api_key: "sections_nav_layout",
      field_type: "string",
      hint: "«Barra laterale» tiene l'indice a sinistra del contenuto: adatto alle pagine lunghe con molte sezioni.",
      default_value: "horizontal",
      validators: { enum: { values: ["horizontal", "sidebar"] } },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: {
          options: [
            { hint: "", label: "In cima alla pagina", value: "horizontal" },
            { hint: "", label: "Barra laterale", value: "sidebar" },
          ],
        },
      },
      position: showSectionsNav ? showSectionsNav.position + 1 : undefined,
    });
  }
}
