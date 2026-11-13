# Altamira job positions integration

> Exported from the Claude Docs guide on 13 Nov 2026 (rev 26). The online doc is the source of truth.

Nov 3, 2026 · @Lorenzo

The site can read open and closed selections from Altamira's REST v3 API at build time: the CMS stores only the JobIDs of 1–3 featured positions, and closed Altamira selections join the existing archive list.

## At a glance

```
DatoCMS (job_position, altamira_job_id) ──┐
                                          ├──▶ Astro build ──▶ "Ultime posizioni aperte" cards
Altamira REST v3 (exposed views) ─────────┘                 └─▶ job positions archive list
```

The browser never talks to Altamira: the build reads both sources, and the pages ship with the data already in them.

## Where we are

The API side works end to end; what is missing is the dedicated API account and the site code.

| Item                                          | State          | Note                                                                                                             |
| --------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| API contract                                  | Active         | Enabled by Altamira Customer Success on 3 Nov 2026                                                               |
| Login (REST v3, JWT)                          | Works          | Tested with a personal account                                                                                   |
| Open, in-progress and closed selections views | Exposed as API | All three return HTTP 200                                                                                        |
| Data in the views                             | Live           | Open view: 5 ads on 13 Nov 2026, same JobIDs as the career site; in-progress and closed views: 0, as on the site |
| Account tech@innovazione.gov.it               | Not usable     | Created, never logged in                                                                                         |
| Public link to a single ad                    | Known          | `/jobs/<slug>-<JobID>.htm`, tested on a live ad; any slug opens the ad, the JobID decides                        |
| Ad detail view (description, requirements)    | Not exposed    | Optional, see Open questions                                                                                     |
| Site code                                     | Not started    | Client, featured block, archive merge                                                                            |

Altamira support does not cover API usage under standard assistance; dedicated help means a paid project.

## API endpoints and fields

Three calls cover everything: one login and one read per list. Base URL: `https://platform.altamirahrm.com/api/v3/REST`.

| Call                                                                   | Method | Auth                                                                                  |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `/authentication/getToken`                                             | GET    | Headers `username`, `password`, `loginRequest: 1`; returns `token` and `refreshToken` |
| `/views/Jobs/Frontoffice__Lista_Annunci_SelezioniInCorso?paging=false` | GET    | Header `token`                                                                        |
| `/views/Jobs/Frontoffice__Lista_Annunci_SelezioniChiuse?paging=false`  | GET    | Header `token`                                                                        |
| /views/Jobs/Frontoffice__Lista_Annunci?paging=false                    | GET    | Header token; the open ads                                                            |

The career site has three lists, each fed by its own view, and all three are now exposed:

| Career site section       | Altamira view                                    | Exposed                                            | Ads on 13 Nov 2026 |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------- | ------------------ |
| Selezioni aperte (home)   | 160423454 "Sito lavora con noi: Lista Annunci"   | Yes, Frontoffice__Lista_Annunci                    | 5                  |
| Selezioni in corso (home) | 166807022 "… Lista Annunci - Selezioni in corso" | Yes, `Frontoffice__Lista_Annunci_SelezioniInCorso` | 0                  |
| Selezioni chiuse          | 166806306 "… Lista Annunci - Selezioni chiuse"   | Yes, `Frontoffice__Lista_Annunci_SelezioniChiuse`  | 0                  |

"In corso" means applications are closed and the evaluation is running. View 160423454 has the same columns as the other two: title, publication date, closing date and time, office, area.

The views' tag names are `Frontoffice: Lista Annunci_Selezioni…`. The URL only resolves with the colon and the spaces replaced by `_`, hence the double underscore. Renaming the tags in Altamira (for example `Jobs_Open_API`, `Jobs_Closed_API`) would make the URLs less fragile.

| Field                                 | Type      | Open | Closed |
| ------------------------------------- | --------- | ---- | ------ |
| `id` (JobID)                          | integer   | yes  | yes    |
| `Jobs_Title`                          | text      | yes  | yes    |
| `Jobs_DatePublished`                  | date-time | yes  | yes    |
| `Jobs_DateToUnpublish` (closing date) | date-time | yes  | yes    |
| `Locations_LocationsSingle` (office)  | text      | yes  | yes    |
| `Vacancy_BusinessUnits` (area)        | list id   | yes  | yes    |
| `…_GraduatoriaJob` (ranking file)     | file      | no   | yes    |

The open view differs in two fields: its closing date is `Jobs_DateFutureUnpublish` (date and time, for example 17 Nov 2026 12:00 UTC), and `Vacancy_BusinessUnits` arrives as text between slashes, for example `/Unità di Missione PNRR/`. Every row also carries a `status` object; the open ads read "Selezione aperta".

Server-side filters exist for free text, office and area, but not for JobID. With a handful of ads, the build reads both lists whole and picks ids from them. Results are capped at 50,000 per call.

## Setting up tech@innovazione.gov.it as the API account

The site should log in with the shared "Account per API" user, limited to reading job ads, not with a personal account. The user already exists in Altamira but has never logged in; it is not locked and has no OTP. Someone with the Sicurezza permission does these steps in Impostazioni → Sicurezza → Utenti → "Account per API".

1. **Activate it.** Send the login credentials to tech@innovazione.gov.it, or set a password. The mailbox is shared, so colleagues can reset it later.
2. **Log in once in the browser** with the new password, to confirm the account works and to clear any first-login password change.
3. **Permissions tab:** tick Lettura on **Annunci** and **Report**, nothing else. No Scrittura, Elimina or Nuovo.
4. **Rights tab:** leave everything off. Publishing ads, exporting data and viewing CVs are not needed.
5. **Groups:** add it to none. Groups add their own permissions on top.
6. **Keep OTP off** for this user. The API login sends only username and password, so a second factor would block the build.
7. **Test the API:** `getToken` with the new credentials, then both views. Expected: HTTP 200 and `count`, even if 0. If a view answers 401 or 403, add Lettura on the missing section and retry; if both work without Report, remove it.
8. **Store the credentials** as `ALTAMIRA_USERNAME` and `ALTAMIRA_PASSWORD` in Vercel (Production and Preview) and in the local `.env`, replacing the personal account.
9. **Clean up the personal account:** delete the API key created on it if nothing uses it (v3 never does), and remove the Annunci and Report write permissions granted for the view setup once that is finished.

If Altamira forces password expiry, the build will start failing on that date: check the password policy and put the renewal in the team calendar.

## Environment variables

The credentials serve one job only: reading the closed positions from Altamira for the archive list. The featured cards need no API call, only the career site's base URL.

| Variable                   | Used for                                                                                   | State                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `ALTAMIRA_RECRUITMENT_URL` | Base of the links to the ads (`/jobs/<slug>-<JobID>.htm`), read in `src/utils/altamira.ts` | In use since commit `d12eef1`; without it the cards link to the internal page |
| `ALTAMIRA_USERNAME`        | Login of the API account (tech@innovazione.gov.it) for the archive client                  | Reserved: no code reads it yet                                                |
| `ALTAMIRA_PASSWORD`        | Password of the same account                                                               | Reserved: no code reads it yet                                                |

All three go in Vercel (Production and Preview) and in the local `.env`; `.env.example` lists `ALTAMIRA_RECRUITMENT_URL`, and the other two join it with the archive client.

## Featured positions

Editors pick 1–3 positions by JobID in DatoCMS; the build fetches the details and the link from Altamira. The JobID is the stable key Altamira returns for every ad.

**In DatoCMS:** a small block model, for example `altamira_position` with one required integer field `job_id`, used in a modular field capped at 3 items. The help text says where to find the JobID in Altamira. Today the "Ultime posizioni aperte" cards (`CardLinkListAdapter` → `getOpenPositions`) list the latest open CMS positions; the new field would feed the same `ListOpenPositions` cards.

**At build time:**

1. A new `src/lib/altamira.ts` gets a token and reads both views once per build (one shared promise, so every page reuses the same 3 calls).
2. It returns a map from JobID to title, dates, office, area and state (open or closed).
3. The adapter resolves each featured `job_id` from the map and builds the card: title, closing date, office, link to the ad on the career site.
4. An id that is in neither list is skipped, with a build warning naming the record.

The call to Altamira must stay on the server (Astro build or SSR): the token needs the username and password, which must never reach the browser.

The link is built from the JobID: `https://recruitment.innovazione.gov.it/jobs/<slug>-<JobID>.htm`, with the slug made from the title. The career site opens the ad from the id alone, so a title change on Altamira never breaks the link.

## Closed positions in the archive list

Altamira's selections can join the existing archive list in the Astro adapter, with no change to the React component. The data is merged on the server and the component keeps receiving the same item shape.

**Data source:** a build-time client logs in with `ALTAMIRA_USERNAME` and `ALTAMIRA_PASSWORD` (`getToken`), then reads the closed selections view, `GET /api/v3/REST/views/Jobs/Frontoffice__Lista_Annunci_SelezioniChiuse?paging=false`. It is the only code that uses the credentials.

**How it works today:**

- `JobPositionListAdapter.astro` loads every `job_position` record from DatoCMS (the `job_position` content collection), keeps those in the page's locale and sorts them by `sortDate`, falling back to `openDate`, newest first.
- `effectivePositionStatus` turns an "open" position whose `closeDate` has passed into "closed". The other states (results, withdrawn, expired, suspended) pass through.
- The React `JobPositionList` receives `{ id, title, description, linkTo, status, statusLabel }` items and adds text search and pagination. Since commit `dc2532f` it has no open/closed toggle: the archive page holds the closed positions.

**What changes:**

1. The adapter also calls `getAltamiraJobs()` (the build-time client in src/lib/altamira.ts) and maps each Altamira ad to an item:

| Item field    | From Altamira                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`          | `altamira-<JobID>`, so it never collides with a DatoCMS id                                                         |
| `title`       | `Jobs_Title`                                                                                                       |
| `description` | Area and office, plus the closing date                                                                             |
| `status`      | `results` when the ranking file (`GraduatoriaJob`) is present, otherwise `closed`; `open` for ads in the open view |
| `statusLabel` | The existing `position.badge.*` labels ("Esiti pubblicati", "Posizione chiusa", "Posizione aperta")                |
| `linkTo`      | `recruitment.innovazione.gov.it/jobs/<slug>-<JobID>.htm`                                                           |

2. Sorting moves before the mapping. CMS records sort by `sortDate`/`openDate`, Altamira ads by `Jobs_DatePublished`, on one merged array.
3. **Duplicates.** A selection could exist in both systems during the transition. An optional `altamira_job_id` field on `job_position` lets the adapter drop the Altamira copy when the CMS already has it. The alternative is a cut-over date after which new selections live only in Altamira.
4. **Language.** Altamira titles are Italian only: show Altamira items on the Italian page only, unless the team prefers them on the English page too.
5. **External links.** Altamira items point to another site. The component can mark them (icon and "opens the career site" text for screen readers) with an optional `external` flag on the item.
6. **Altamira unreachable.** The adapter renders the CMS items alone and logs a build warning; the page never breaks.

The search keeps working on Altamira items, because it filters on `title` and `description`.

## Freshness and failures

The Altamira data is as fresh as the last build, so the site needs a rebuild when an ad opens or closes.

| Option                                                                         | Effort                                     | Delay      |
| ------------------------------------------------------------------------------ | ------------------------------------------ | ---------- |
| Scheduled rebuild (Vercel deploy hook called nightly)                          | Low                                        | Up to 24 h |
| Altamira trigger with a webhook to the Vercel deploy hook, on ad status change | Medium; needs a user who can edit triggers | Minutes    |
| Render only the Altamira blocks in SSR, with a short cache                     | Medium; code change                        | Minutes    |

Suggested start: the nightly rebuild, plus a manual deploy when an ad goes live. Missing ids and Altamira outages never fail the build: they skip the item and log a warning.

## Open questions

- [x] Expose view 160423454 "Sito lavora con noi: Lista Annunci" as API: it holds the open ads.
- [ ] How should "Selezioni in corso" ads look in the archive: open, closed, or a badge of their own?
- [ ] Expose the detail view "DTD Sito lavora con noi: dettaglio Annuncio - Selezioni in corso/chiuse" with a JobID filter, if the site should show description and requirements?
- [ ] Rename the view tags to `Jobs_Open_API` and `Jobs_Closed_API`?
- [ ] Cut-over date or `altamira_job_id` field for selections that exist in both DatoCMS and Altamira?
- [ ] Altamira items on the English archive page too?
- [ ] Does Altamira force password expiry for the API account?

## Sources

- [Altamira API documentation (section)](https://support.altamirahrm.com/hc/it/sections/360004032599-API)
- [Autenticazione](https://support.altamirahrm.com/hc/it/articles/360013741519-Autenticazione)
- [Come esporre una vista nell'API](https://support.altamirahrm.com/hc/it/articles/360013672800-Come-esporre-una-vista-nell-API)
- [REST - Esempio chiamata di lettura con filtro](https://support.altamirahrm.com/hc/it/articles/5580791222546-REST-Esempio-chiamata-di-lettura-con-filtro)
- [Impostare permessi / Assegnare diritti ad un utente](https://support.altamirahrm.com/hc/it/articles/360009125859-Impostare-permessi-Assegnare-diritti-ad-un-utente)
- [Sicurezza utenti](https://support.altamirahrm.com/hc/it/articles/360008976119-Sicurezza-utenti)
- Live tests against the Altamira API and recruitment.innovazione.gov.it, 3 Nov 2026
- Site code: `JobPositionListAdapter.astro`, `JobPositionList.tsx`, `positionStatus.ts`, `openPositions.ts`
