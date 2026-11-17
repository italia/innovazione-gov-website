# Fix richiesti il 16 novembre — stato al 17 novembre

Punti arrivati da Leonardo (DTD) nei due messaggi del 16 novembre, nell'ordine
in cui li ha scritti. Per ciascuno: cosa è stato fatto, cosa cambia nel CMS,
cosa resta da fare a mano.

---

## 1. Tipografia sulla pagina Novità — risolto

Gli ultimi tre blocchi della pagina («Gli approfondimenti», «Cartella stampa»,
«Cerchi un tema in particolare?») avevano un titolo che cresceva fino a 44 px,
fuori dalla scala concordata.

Il blocco si chiama _Support CTA section_ e si portava dietro una regola
`font-size: clamp(1.75rem, 1.2rem + 2vw, 2.75rem)` scritta a mano. È stata
tolta: il titolo è un `h3` e adesso prende i 28 px della scala.

Verificato a 1440 px: tutti e tre i titoli misurano 28 px.

Passata completa sui titoli di `/it`, `/it/novita` e `/it/novita/avvisi-pubblici`:
h1 40, h2 32, h3 28. Restano volutamente fuori scala, perché sono convenzioni
decise prima:

- titoli delle schede: `h3` a 20 px (l'eccezione chiesta nel commento Figma)
- titoli delle righe d'elenco: `h3` a 18 px
- intestazioni del footer: `h4` a 16 px maiuscolo

---

## 2. Avvisi pubblici — risolto

### 2.1 «Avvisi pubblici» selezionabile nel blocco schede

Il campo _Contenuti automatici_ del blocco **Section card link list** non aveva
l'opzione. Adesso c'è: **Avvisi pubblici**, in fondo all'elenco a tendina,
accanto a Notizie, Comunicati stampa, Focus e le altre.

Il campo è stato anche rinominato: si chiamava «3 automatic last items», che
non era più vero da quando esiste _Quante schede_.

### 2.2 Massimo 2 schede con le card orizzontali

Con _Show inline card_ acceso il blocco si ferma a 2 schede, qualunque numero
sia scritto in _Quante schede_. Senza card orizzontali il comportamento non
cambia.

### 2.3 Cosa compare sulla scheda

Sulle schede degli avvisi adesso compaiono solo le tre informazioni chieste:

- **stato** — APERTO in verde, CHIUSO / SCADUTO / ESITI in grigio
- **scade il** — solo finché l'avviso è aperto. Resta visibile anche da chiuso
  se nel record è acceso _Mostra la scadenza anche da chiuso_
- **categoria** — sempre e solo «Avvisi pubblici»

Sono spariti gli argomenti e la data di pubblicazione, che non servivano e si
vedevano male.

Sullo stato: un avviso segnato «aperto» nel CMS ma con la data di scadenza già
passata viene mostrato come SCADUTO, non come aperto. È la stessa regola già in
uso sulle posizioni lavorative.

### 2.4 I sei tipi restano sul dettaglio

Avviso, Bando, Concorso, Gara d'appalto, Incarico esterno e Manifestazione
d'interesse restano come sono nel CMS e continuano a comparire sulla pagina di
dettaglio. Nelle schede e negli elenchi, al loro posto, compare la categoria
unica «Avvisi pubblici».

### 2.5 La pagina /it/novita/avvisi-pubblici è diventata un elenco

Era una griglia di schede, adesso è un elenco come i comunicati stampa, con per
ogni riga: stato, categoria «Avvisi pubblici», titolo e abstract. I filtri
«Argomenti in evidenza» sopra l'elenco restano e funzionano: si basano sugli
argomenti segnati come in evidenza nel CMS.

Negli elenchi dei comunicati stampa non è cambiato niente: lì la categoria non
compare, perché ripeterla su ogni riga di una pagina che è tutta comunicati non
aggiunge nulla.

### 2.6 Una cosa da sistemare nel CMS

Il blocco «Avvisi pubblici» che hai creato in fondo alla pagina Novità è ancora
impostato su **Comunicati stampa**, perché quando l'hai fatto l'opzione giusta
non esisteva. Va aperto e cambiato in **Avvisi pubblici** dal menù _Contenuti
automatici_: sono due clic. Non l'ho fatto io perché è contenuto pubblicato.

---

## 3. Potrebbe interessarti — risolto

### 3.1 Il flag è invertito

Il campo si chiamava «Non mostrare «Potrebbe interessarti»». Adesso si chiama
**«Mostra «Potrebbe interessarti»»** e funziona al contrario, come chiesto:

- **spento** (è lo stato di partenza di tutti i contenuti) → in fondo alla
  pagina non compare niente
- **acceso** → compare la sezione completa

**Attenzione, è un cambio visibile:** prima la sezione compariva in automatico
in fondo a tutti e 740 i contenuti; adesso è spenta ovunque e va accesa contenuto
per contenuto. È quello che avevi chiesto, ma vale la pena saperlo prima di
guardare il sito. Se serve, si riaccende in blocco su tutto lo storico con uno
script: dimmelo e lo lancio.

### 3.2 I focus in evidenza

Nuovo campo **Focus in evidenza** sul modello Articolo, subito sopra
«Potrebbe interessarti»:

- fino a **2** contenuti, scelti **sempre a mano** (nessun automatismo)
- se lo lasci vuoto, le due card orizzontali non compaiono — il resto della
  sezione sì, se il flag è acceso
- le card mostrano solo titolo, descrizione e l'etichetta del tipo, come nel
  Figma: niente argomenti e niente data

### 3.3 Il resto della sezione

«Novità e altri» funziona come prima: le schede scelte a mano nel campo
«Potrebbe interessarti», e se è vuoto quelle composte in automatico per
argomento. Nessun titolo aggiuntivo: l'unico titolo è «Potrebbe interessarti».

### 3.4 La card orizzontale è stata ridisegnata

Quando non ha un'immagine, la card orizzontale impilava titolo, testo ed
etichetta su tre colonne strettissime e l'etichetta si spezzava a metà parola
(«COMUNICAT / O STAMPA»). Adesso è una card pulita: titolo, descrizione,
etichetta sotto. Gli argomenti, dove compaiono, non escono più dal bordo.

---

## 4. Componenti vari

### 4.1 Collegamenti utili: link interni ed esterni nella stessa lista — risolto

Il blocco **List external link** adesso accetta due tipi di voce. Dentro il
campo _Collegamenti_ trovi due pulsanti: **Aggiungi External link** e
**Aggiungi Internal link**.

- _Internal link_ → scegli una pagina del sito (con ancora facoltativa), il
  link si apre nella stessa scheda e **non** ha l'icona
- _External link_ → URL scritto a mano, si apre in una scheda nuova e ha
  l'icona del link esterno

I blocchi che esistono già continuano a funzionare come prima: non c'è niente
da rifare a mano.

### 4.2 Pulsante di download del comunicato — da decidere insieme

Qui serve una decisione prima di scrivere il codice. Il bottone che c'è oggi
scarica il primo file del campo Allegati; tu chiedi che scarichi invece il PDF
o il testo **della pagina**. Sono tre strade diverse per costo e risultato:

1. **PDF generato in fase di pubblicazione** — ogni comunicato ha il suo file
   `.pdf` con titolo, data, testo, link e allegati. È un download vero, con un
   file che si può archiviare e inoltrare. È la soluzione migliore ed è anche
   la più lunga da costruire.
2. **Stampa del browser** — il bottone apre la finestra «Stampa», da cui si
   salva in PDF, con un foglio di stile dedicato che toglie menù e footer.
   Si fa in poco, ma è una finestra di sistema, non un download.
3. **File di testo** — un `.txt` con il testo del comunicato. Immediato da
   fare, ma è il risultato più povero.

Nel frattempo il bottone resta spento ovunque: ho verificato che non è acceso
su nessuno dei 740 contenuti, quindi online non si vede.

**Mi serve sapere quale delle tre volete.**

### 4.3 Logo del Dipartimento nel footer — manca il file

Il footer usa l'emblema della Repubblica più il nome scritto in testo. Tu chiedi
il marchio grafico per esteso, come su Developers Italia.

Lato sito è pronto: c'è un campo nuovo **Logo del footer** sul modello Layout,
e appena ci carichi un'immagine questa prende il posto dell'emblema e del testo.

Il problema è il file. Ho cercato fra i media già caricati su DatoCMS e il
marchio per esteso non c'è: i due file che sembravano buoni
(`ministero-dtd-logo-white.svg` e `ministero_dtd_logo_white_v2.svg`) sono
entrambi il solo emblema con il quadrato, senza la dicitura.

**Mi serve il file del marchio per esteso, in bianco, preferibilmente SVG.**
Lo carichi tu nel campo o me lo mandi e lo carico io.

---

## 5. Breadcrumb di notizie e comunicati — risolto

Era `Innovazione / Novità / Le notizie / Dettaglio notizia`: quattro livelli,
di cui l'ultimo un'etichetta generica uguale per tutti.

Adesso è `Innovazione / Le notizie / <titolo della notizia>`: il livello
intermedio è sparito e l'ultima voce è il titolo vero del contenuto, accorciato
con i puntini se troppo lungo (40 caratteri da tablet in su, 20 su telefono).

Vale per notizie, comunicati stampa, focus, interviste, interventi e attività.

---

## 6. Argomenti nella testata: testo bianco su fondo bianco — risolto

Era il problema più serio dei due messaggi: nella testata delle notizie le
pastiglie degli argomenti (nel tuo screenshot «ANCI») erano **testo bianco su
fondo chiaro**, cioè invisibili.

Non dipendeva dal cambio di tipografia. Bootstrap Italia dà per scontato che la
testata sia scura e colora di bianco tutto il testo che ci sta dentro, con una
regola più forte della nostra: la nostra diceva blu, la sua vinceva e diceva
bianco.

Adesso le pastiglie sono blu su fondo chiaro — contrasto 5,06:1, sopra la soglia
AA — e sul focus, dove la testata è blu scuro, diventano bianche con il bordo
bianco.

### Controllo di accessibilità, già che c'ero

Ho passato axe su quattro pagine (home, Novità, Avvisi pubblici, una notizia,
una pagina di attività). Sono usciti due errori che non c'entravano con le
richieste, ma erano errori veri, e li ho sistemati:

- **il logo in testata** aveva una descrizione per gli screen reader
  («Risultati del Piano Nazionale di Ripresa e Resilienza») che non c'entrava
  niente con la scritta visibile accanto. Chi naviga a voce leggeva una cosa e
  ne vedeva un'altra: è una violazione del criterio 2.5.3 di WCAG. Tolta: adesso
  vale la scritta visibile.
- **la barra di avanzamento della lettura**, nell'indice laterale degli
  articoli, non aveva nome. Aggiunto.

Dopo i fix: **zero violazioni** su tutte e quattro le pagine.

---

## 7. Immagini nei comunicati stampa — mi servono i file

Confermo il problema: **tutti e 87 i comunicati stampa sono senza immagine**,
quindi nelle schede esce solo testo.

Sì, si fa in blocco: è uno script che assegna le immagini a rotazione per data,
così non escono tre schede identiche di fila. Un quarto d'ora di lavoro una
volta che ho i file.

**Mi servono le 3 immagini scelte giovedì** — caricate su DatoCMS o mandate a
me. Dimmi anche se le vuoi a rotazione o se ce n'è una sola da mettere su tutti.

---

## Riepilogo

| #   | Punto                                              | Stato                   |
| --- | -------------------------------------------------- | ----------------------- |
| 1   | Tipografia pagina Novità                           | Fatto                   |
| 2.1 | «Avvisi pubblici» nel menù del blocco              | Fatto                   |
| 2.2 | Massimo 2 card orizzontali                         | Fatto                   |
| 2.3 | Stato, scadenza, categoria sulle schede            | Fatto                   |
| 2.4 | I sei tipi solo sul dettaglio                      | Fatto                   |
| 2.5 | Pagina avvisi come elenco                          | Fatto                   |
| 2.6 | Blocco in fondo a Novità da reimpostare            | **Da fare nel CMS**     |
| 3.1 | Flag «Mostra» invertito                            | Fatto                   |
| 3.2 | Focus in evidenza, max 2, a mano                   | Fatto                   |
| 3.3 | Novità e altri come prima                          | Fatto                   |
| 3.4 | Card orizzontale ridisegnata                       | Fatto                   |
| 4.1 | Link interni nei Collegamenti utili                | Fatto                   |
| 4.2 | Download PDF del comunicato                        | **Serve una decisione** |
| 4.3 | Logo del footer                                    | **Serve il file**       |
| 5   | Breadcrumb                                         | Fatto                   |
| 6   | Argomenti invisibili in testata                    | Fatto                   |
| 6b  | Due errori di accessibilità trovati strada facendo | Fatto                   |
| 7   | Immagini dei comunicati                            | **Servono i file**      |

### Cosa serve da voi

1. La scelta su come deve funzionare il download del comunicato (punto 4.2).
2. Il file del marchio per esteso per il footer (punto 4.3).
3. Le 3 immagini per i comunicati stampa (punto 7).
4. Due clic nel CMS sul blocco in fondo a Novità (punto 2.6).

### Nota sulle migrazioni

Quattro modifiche allo schema DatoCMS, già applicate all'ambiente
`website-astro-2026`:

- `1795300000_announcementInLastItems` — «Avvisi pubblici» fra i contenuti automatici
- `1795400000_showRelatedArticles` — flag invertito e campo «Focus in evidenza»
- `1795500000_internalLinksInUsefulList` — link interni nei Collegamenti utili
- `1795600000_footerLogo` — campo «Logo del footer»
