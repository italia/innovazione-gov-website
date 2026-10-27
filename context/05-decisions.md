# Decisioni tecniche

Registro delle scelte non ovvie. Se una decisione non è qui, non è stata presa.

## Design system

I componenti seguono il design system Italia. Il markup di riferimento non va
copiato a mano: si legge dal repository ufficiale, alla stessa versione di
`bootstrap-italia` che il progetto ha installata.

```
gh api "repos/italia/bootstrap-italia/contents/docs/componenti/<componente>.md?ref=v<versione>"
```

Le cartelle disponibili sono `docs/componenti`, `docs/menu-di-navigazione`,
`docs/organizzare-i-contenuti`, `docs/organizzare-gli-spazi`, `docs/form`,
`docs/utilities`.

Quando si crea o si rifà un componente si parte da quel markup e si inietta
solo il dato. Ogni divergenza voluta va registrata qui sotto, con il motivo:
senza, alla lettura successiva non si distingue una scelta da un difetto.

### D-01 — L'icona del megamenu è nascosta agli screen reader

Il markup ufficiale del toggle megamenu usa `<svg role="img">` senza etichetta
accessibile, quindi uno screen reader annuncia "immagine" senza poter dire
cosa rappresenti. Noi aggiungiamo `aria-hidden="true"`: il triangolino resta
identico a vedersi ed è puramente decorativo, visto che lo stato aperto/chiuso
è già esposto da `aria-expanded` sul bottone.

Divergenza per sola aggiunta: classi e struttura restano quelle ufficiali.

### D-02 — AccordionShowcase usa `<details>`, non il componente Accordion

`src/components/organisms/AccordionShowcase` non usa l'accordion del design
system: usa `<details>`/`<summary>` con l'attributo `name`, che dà un accordion
a elemento singolo nativo, senza JavaScript. Funziona anche se il bundle non
carica, mentre l'accordion della libreria dipende da Bootstrap.

Resta così finché non emerge un motivo concreto per allinearlo. Non è una
svista: il componente è stato scritto apposta.

### D-03 — Il titolo dell'accordion è un heading, con livello dal chiamante

Il markup ufficiale mette il bottone dentro un heading perché quei bottoni
sono i titoli delle sezioni. `Accordion` accetta `headingLevel` (default `h2`)
invece di fissare il livello: la documentazione ufficiale dice esplicitamente
che il livello dipende dal contesto della pagina.

### D-04 — La variante `card` dell'accordion tiene la spaziatura esistente

`UseCaseCard` aveva una seconda copia del markup dell'accordion scritta a mano.
Ora usa il componente con `variant="card"`, che porta le utility bootstrap già
in uso (`rounded-2 px-4`, `border-0 border-bottom`, `py-3`) invece di `accordion-body`.

`py-3` non è la spaziatura ufficiale del corpo, ma è quella che la card aveva:
il refactor doveva togliere la duplicazione, non cambiare l'aspetto. Verificato
con un confronto pixel a pixel, zero differenze. Se si vorrà allineare anche la
spaziatura, è una modifica visibile da decidere a parte.
