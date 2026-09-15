import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const val = (campo) => {
  if (!campo || typeof campo !== "object" || Array.isArray(campo))
    return campo ?? null;
  return LOCALE in campo ? (campo[LOCALE] ?? null) : campo;
};
const testo = (v) => String(v ?? "").trim();

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((x) => x.api_key === key).id;
const blocco = (key, attributi) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idTarget(key) },
    ...attributi,
  });

const cache = new Map();
const recordSorgente = async (id) => {
  if (!cache.has(id))
    cache.set(
      id,
      await from.items.find(id, { version: "current", nested: true }),
    );
  return cache.get(id);
};

const uploadPerSorgente = new Map();
async function copiaUpload(idUpload) {
  if (!idUpload) return null;
  if (uploadPerSorgente.has(idUpload)) return uploadPerSorgente.get(idUpload);
  const sorgente = await from.uploads.find(idUpload);
  if (!COMMIT) return null;
  const creato = await to.uploads.createFromUrl({
    url: sorgente.url,
    filename: sorgente.filename,
    skipCreationIfAlreadyExists: true,
  });
  uploadPerSorgente.set(idUpload, creato.id);
  return creato.id;
}

async function creaKpi(attributi) {
  if (!COMMIT) return "anteprima";
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("kpi_element") },
    ...attributi,
  });
  await to.items.publish(creato.id);
  return creato.id;
}

const [sorgente] = await from.items.list({
  filter: { type: idSorgente("italy2026_page") },
  version: "current",
  nested: true,
});
const [radice] = await to.items.list({
  filter: {
    type: idTarget("page"),
    fields: { slug: { eq: val(sorgente.slug) } },
  },
  version: "current",
  nested: true,
});
if (!radice)
  throw new Error(
    "la pagina radice non esiste: lanciare prima import-italia-digitale.mjs",
  );

const insightPerSlug = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idTarget("insight") },
  version: "current",
})) {
  insightPerSlug.set(val(r.slug), r.id);
}

const linkInterno = (slug, etichetta) =>
  insightPerSlug.has(slug)
    ? blocco("internal_link", {
        label: etichetta,
        link_to: insightPerSlug.get(slug),
      })
    : null;

const sezioni = [];
const descrizione = [];

sezioni.push(
  blocco("hero", {
    variant: "default",
    background_color: "lighter",
    show_breadcrumb: true,
    title: testo(val(sorgente.title)),
    paragraph: testo(val(sorgente.subtitle)),
    background_image: null,
    background_image_for_mobile: null,
    cta: null,
  }),
);
descrizione.push("hero");

for (const b of val(sorgente.content_blocks) ?? []) {
  const kind = chiaveSorgente[b.relationships.item_type.data.id];
  const a = b.attributes;

  if (kind === "block_pnrr" || kind === "block_italy2026") {
    const percentuali = kind === "block_italy2026";
    const idNumeri = percentuali
      ? (a.percent_numbers ?? [])
      : (a.numbers ?? []);
    const kpi = [];
    for (const idNumero of idNumeri) {
      const numero = await recordSorgente(idNumero);
      kpi.push(
        await creaKpi(
          percentuali
            ? {
                title: testo(val(numero.title)),
                value: testo(val(numero.number)),
                value_suffix: "%",
                value_prefix: "",
                percentage: testo(val(numero.number)),
                footer_text: testo(val(numero.description)).replace(
                  /^%\s*/,
                  "",
                ),
                show_flow: false,
                flow_direction: "",
                flow_value: "",
                flow_detail: "",
                background_color: "",
                open_data_path: "",
              }
            : {
                title: testo(val(numero.text)),
                value: testo(val(numero.number)),
                value_suffix: "",
                value_prefix: "",
                percentage: "",
                footer_text: "",
                show_flow: false,
                flow_direction: "",
                flow_value: "",
                flow_detail: "",
                background_color: "",
                open_data_path: "",
              },
        ),
      );
    }
    sezioni.push(
      blocco("text_statistic", {
        background_color: percentuali ? "lighter" : "default",
        show_inline: false,
        text: blocco("text_block", {
          title: testo(val(a.title)) || testo(val(a.pre_title)),
          paragraph: testo(val(a.text)) || testo(val(a.pre_title)),
          cta: null,
        }),
        statistics: blocco("statistic_block", {
          statistics: [],
          kpi_element: COMMIT ? kpi : [],
        }),
      }),
    );
    descrizione.push(`${kind} → text_statistic (${idNumeri.length} kpi)`);
    continue;
  }

  if (kind === "block_axes_intervention") {
    const carte = [];
    for (const intervento of a.interventions ?? []) {
      const at = intervento.attributes;
      const titolo = testo(val(at.title));
      const slugCorrispondente = titolo.toLowerCase().startsWith("reti")
        ? "reti-ultraveloci"
        : "digitalizzazione-della-pa";
      const upload = await copiaUpload(val(at.thumbnail)?.upload_id);
      carte.push(
        blocco("card_link", {
          title: titolo,
          paragraph: testo(val(at.description)),
          image: { upload_id: COMMIT ? upload : null },
          link: blocco("link_block", {
            link: insightPerSlug.get(slugCorrispondente) ?? null,
            external_url: "",
          }),
        }),
      );
    }
    const linkBlocco = a.link ? await recordSorgente(a.link) : null;
    const etichettaCta = linkBlocco ? testo(val(linkBlocco.cta_label)) : "";
    sezioni.push(
      blocco("card_link_list", {
        show_inline_card: false,
        background_color: "default",
        title: testo(val(a.pre_title)) || "I principali assi di intervento",
        paragraph: "",
        list_content: carte,
        last_items: null,
        category: null,
        show_filter_on_category: false,
        cta: etichettaCta ? linkInterno("il-piano", etichettaCta) : null,
      }),
    );
    descrizione.push(
      `block_axes_intervention → card_link_list (${carte.length} card)`,
    );
    continue;
  }

  if (kind === "block_first_flag") {
    const upload = await copiaUpload(val(a.image)?.upload_id);
    const link = a.link ? await recordSorgente(a.link) : null;
    const url = link ? testo(val(link.link) ?? link.link) : "";
    sezioni.push(
      blocco("text_image", {
        variant: "variant-1",
        background_color: "lighter",
        heading: "h2",
        text: blocco("text_block", {
          title: testo(val(a.title)),
          paragraph: testo(val(a.pre_title)),
          cta: url
            ? blocco("external_link", {
                label: testo(val(link.cta_label)) || "Vai al sito",
                url,
                description: "",
              })
            : null,
        }),
        image: upload ? { upload_id: upload } : null,
        additional_content: null,
      }),
    );
    descrizione.push(`block_first_flag → text_image (${url || "senza link"})`);
    continue;
  }

  if (kind === "block_calendar") {
    sezioni.push(
      blocco("text_only", {
        background_color: "default",
        heading: "h2",
        text: blocco("text_block", {
          title: testo(val(a.title)),
          paragraph:
            testo(val(a.pre_title)) ||
            "Le tappe e gli obiettivi intermedi delle misure, ambito per ambito.",
          cta: null,
        }),
      }),
    );
    for (const idCalendario of a.calendars ?? []) {
      const calendario = await recordSorgente(idCalendario);
      const fasi = val(calendario.phases) ?? calendario.phases ?? [];
      const voci = [];
      for (const fase of fasi) {
        const titoloFase = testo(val(fase.attributes.title));
        for (const tappa of fase.attributes.milestones ?? []) {
          const t = tappa.attributes;
          const periodo = testo(val(t.timeframe));
          const titolo = testo(val(t.subtitle));
          if (!periodo || !titolo) continue;
          voci.push(
            blocco("timeline_item", {
              period: periodo,
              title: titolo,
              paragraph: fasi.length > 1 ? titoloFase : "",
              image: null,
              cta: null,
            }),
          );
        }
      }
      if (!voci.length) continue;
      sezioni.push(
        blocco("timeline", {
          title: testo(val(calendario.title)),
          paragraph: "",
          items: voci,
        }),
      );
      descrizione.push(
        `calendario "${testo(val(calendario.title))}" → timeline (${voci.length} tappe)`,
      );
    }
    continue;
  }

  descrizione.push(`${kind} → NON MAPPATO`);
}

console.log(`pagina radice: ${radice.id}`);
for (const riga of descrizione) console.log(`  ${riga}`);

if (!COMMIT) {
  console.log("\n--- anteprima, nessuna scrittura ---");
  process.exit(0);
}

await to.items.update(radice.id, { content: { [LOCALE]: sezioni } });
await to.items.publish(radice.id);
console.log(`\ncomposta e pubblicata: ${sezioni.length} sezioni`);
