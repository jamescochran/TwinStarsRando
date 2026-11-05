# Twin Stars Adventure Randomizer: product research

Compiled 2026-11-05 for a product-transformation report. Read-only research. The repo (`/home/user/jamescochran/twinstarsrando`, branch `ux-audit`, HEAD `e302fa7`) was not modified.

**How to read this.** **[E]** = evidence: a source is quoted or paraphrased and linked. **[I]** = my inference. Each [I] says how to check it. I have not invented user numbers, analytics or competitor features. Where I could not find something, I say so.

## 0. Sources and their limits

| Source | What I used | Limits |
|---|---|---|
| BGG forums, 84 threads / 325 posts (2017-01 to 2026-11), already downloaded (`scratchpad/bgg-faq*/raw`) | Every thread was read. Rules threads were coded by topic. Every review, session, general, strategy and variant thread was read in full. Combined corpus: `product-research/work/corpus.txt`. | Only BGG. Reddit returned no Twin Stars threads in search. The Button Shy Discord (the most active venue, per [2179510](https://boardgamegeek.com/thread/2179510)) and the Fandom FAQ wiki (HTTP 403) were not readable. |
| BGG item stats via `api.geekdo.com/api/dynamicinfo`, 11 items (`product-research/dl/dyn_*.json`) | Owners, ratings, logged plays | These are snapshots taken today. "Owned" counts only BGG users who mark a game as owned. |
| BGG collection comments via `api.geekdo.com/api/collections` (`dl/comments.tsv`) | 247 collection rows, 147 with a non-empty comment, across 10 items | Only the first 50 rows per item. Page 2 and later return **HTTP 401** without a login, so Series I (178 comments) and Series II (60) are only partly covered. |
| BGG family 38655 listing + `geekitems` for every member (`dl/family38655.json`, `dl/item_*.json`) | Content inventory | |
| BGG Files sections (`dl/files_*.json`) | Fan aids and official PnPs | |
| buttonshygames.com, fetched with curl: `/pages/twin-stars`, `/pages/twin-stars-faq`, `/products.json`, sitemap (93 pages) | Official pages, current store, any fan-content policy | WebFetch could not resolve the host, but curl through the proxy worked. |
| Web search | Competing tools, fan-content policy, comparable companion apps | The search tool only gives result summaries, so app features from search are second-hand. |
| Repo: `README.md`, `app.js`, `index.html`, `AUDIT_REPORT.md`, `rules/*.png` + `rules/README.md` | What the app does today, and how the game is played | |

---

## 1. Who the users are

### 1.1 Size of the addressable base [E]

BGG figures for the Twin Stars products the app supports. Fetched 2026-11-05 from `api.geekdo.com/api/dynamicinfo`.

| BGG item | Owned | Wishlist | Rated (avg) | Logged plays (all time) |
|---|---|---|---|---|
| Adventure Series I (231854) | 1,358 | 92 | 298 (6.24) | 1,653 |
| Adventure Series II (262770) | 772 | 43 | 99 (6.66) | 194 |
| Sc.14 Save the Spacewhales (376110) | 213 | 14 | 6 (6.33) | 14 |
| Sc.01 Escape the Brig, standalone (212097) | 213 | 10 | 25 (6.42) | 101 |
| SYZYGY Mode (307088) | 155 | 16 | 9 (7.22) | 5 |
| Captain Crag (276844) | 139 | 18 | 11 (6.73) | 2 |
| SYZYGY II Waypoint (322527) | 65 | 24 | 1 | 1 |
| Droids I / II (322525 / 322526) | 58 / 49 | 20 / 23 | 4 / 2 | 1 / 1 |
| Sc.07 Master the Trials, standalone (324775) | 43 | 6 | 1 | 2 |
| Sc.13 Topple the Giant (372403) | 23 | 19 | 0 | 0 |

- This is a **niche, long-tail audience**: roughly 1.4k BGG owners of the core product.
- **[I]** The real number of owners is larger, because many owners never use BGG. Logged plays are about 1.2 per Series I owner, and only 5 SYZYGY plays are logged against 155 owners. So most owners **do not log plays on BGG**, or barely play the add-ons.
  - *Validate:* add an Umami "save record" event and compare records per active user, or run a BGG poll: "Do you log Twin Stars plays? Where?"
- Wishlist numbers are high relative to owners for Sc.13 (19 vs 23), the droid packs (20/23 vs 58/49) and SYZYGY II (24 vs 65). That is **unmet demand for content that is hard to get**. See section 3 and [2466000](https://boardgamegeek.com/thread/2466000) and [3003370](https://boardgamegeek.com/thread/3003370).
- **The game is not currently sold on Button Shy's own store.** [E]
  - `buttonshygames.com/products.json` lists 121 products and none is a Twin Stars item.
  - A store search for "twin stars" returns 2 unrelated products.
  - `/products/twin-stars` (the README's "go buy it" link) returns **404**.
  - `/pages/twin-stars` and `/pages/twin-stars-faq` still exist.
  - **[I]** New users are therefore mostly existing owners, PnP builders and second-hand buyers. *Validate:* ask Button Shy whether a reprint or PnP re-listing is planned.

### 1.2 Print-and-play is a major segment [E]

- **66 of the 147 non-empty collection comments (45%) mention PnP or printing** (`dl/comments.tsv`). Examples: "PnP version", "PNP on Artscow cards", "Pnp, unprinted", "PNP - Downloaded & Printed Incomplete Set", "Color PNP." The sample is skewed toward recent comments.
- Threads show players printing the whole system, tokens included:
  - [2341140](https://boardgamegeek.com/thread/2341140): "I printed all the freely available Twin Stars stuff earlier today"
  - [2296490](https://boardgamegeek.com/thread/2296490): "when I first printed it out and was looking at all the components I had to make for it"
  - [2126668](https://boardgamegeek.com/thread/2126668): "a small plastic crayon box can work great"
- **[I]** PnP players have the most improvised tokens and trackers, so they gain the most from a digital tracker. They are also the most likely to own unusual subsets, such as only the free PnP scenarios or "Incomplete Set". *Validate:* add a "How do you own Twin Stars? (wallet / deluxe / PnP / mixed)" question to an optional in-app survey or a BGG poll.

### 1.3 Collectors and completionists [E]

- Collection comments list whole Button Shy runs: "Button Shy Solo Bag" (the same user owns 8 of the Twin Stars items), "Keep Button Shy", and "#ButtonShy … + Token Kit + SYZYGY II + Spacewhales".
- Players look hard for missing pieces:
  - Droid cards: [2466000](https://boardgamegeek.com/thread/2466000) ran 2020–2022, and Button Shy support said "These are not available at this time"; see also [2482732](https://boardgamegeek.com/thread/2482732).
  - Tokens for Series II: "Can't stand having the tokens for Twin Star 1, but not 2" ([2328523](https://boardgamegeek.com/thread/2328523)).
  - Sc.13, which was ShyCon-only: [3003370](https://boardgamegeek.com/thread/3003370).
  - "Looking for the Oversized Scenario cards" (collection comment on 262770). I could not verify that product.
- The app's "unplayed combinations" and completion % already serve this completionist motive.

### 1.4 Contexts of play [E]

- **Short, portable sessions.** Examples:
  - "enjoying it as a lunch game" ([1792707](https://boardgamegeek.com/thread/1792707))
  - "Stuck in traffic? … Waiting on your family in the mall? … Got Jury Duty?" ([1818949](https://boardgamegeek.com/thread/1818949))
  - "music class, sports practice, or just school pickup … I've played in the car, using paperclips … (Just don't lose the dice under the seats!)" ([2544679](https://boardgamegeek.com/thread/2544679))
  - In bed after surgery: "Button Shy fits better on a lap table" ([3043727](https://boardgamegeek.com/thread/3043727))
  - "Minimal table space needed" (GaryP, 231854 comment)
- **Session length.** "Each game takes about 15 minutes" ([2544679](https://boardgamegeek.com/thread/2544679)); "Time to play: 15 min" (BigBoater comment).
- **Win rate.** Players report roughly even win/loss:
  - "I've lost just as many times as I've won" ([1814747](https://boardgamegeek.com/thread/1814747))
  - "My win/loss ratio is about even overall, but decreases as I play through the scenarios" ([1962453](https://boardgamegeek.com/thread/1962453))
- **Devices:** **no direct evidence.** Only one poster mentions a phone, and only to apologise for formatting.
  - **[I]** Small, cramped play surfaces (car, lap table, lunch table) favour a **phone held in one hand or propped up, used offline**. That argues for a phone-first PWA with offline support, large touch targets and minimal typing.
  - *Validate:* Umami already records page views, so check its device and screen-size breakdown, and how often the PWA runs in standalone (installed) mode.

### 1.5 How they play [E]

- **Random draws are common.**
  - "You can grab a random scenario and 2 random characters, set something up specific, follow the suggestions, or roll dice to decide" ([2015234](https://boardgamegeek.com/thread/2015234))
  - "I personally enjoy just mixing up all the characters and drawing two randomly" ([2126668](https://boardgamegeek.com/thread/2126668))
- **Studying team pairings is the core hobby for engaged players.**
  - "it may not be fair to say that the game is won or lost through character selection, but it comes mighty close … The real thrill of this game, to me, is the study of these characters, pairing them up" ([2126668](https://boardgamegeek.com/thread/2126668))
  - "an astonishingly deep meta-game of pairing together characters" ([3043727](https://boardgamegeek.com/thread/3043727))
  - "What are the most powerful combos in the game?" ([2815045](https://boardgamegeek.com/thread/2815045))
- **Some keep one fixed team across every scenario.** "I've been trying to play specific character combos through all the scenarios rather than changing my team for each game" ([2815045](https://boardgamegeek.com/thread/2815045)). The app has no mode for this.
- **Campaign play.**
  - "There's also a campaign mode you can run through with the same 3 characters" ([2015234](https://boardgamegeek.com/thread/2015234))
  - "Dice matching, quick hit campaign game" (BigBoater, 231854)
  - Yet only 5 SYZYGY plays are logged on BGG, and there are **zero SYZYGY threads**. Usage is unknown.
- **House rules exist.** A "reduce one, keep the other" variant was proposed, and Tagmire offered a softer compromise ([2435075](https://boardgamegeek.com/thread/2435075)).
- **Play logging.** Only BGG play logging is visible (1,653 plays on Series I). No forum post mentions a spreadsheet, a tracker or any app. A keyword search of 325 posts found 0 hits for "app" or "spreadsheet".
- **The app author is visible on BGG.** User jdcochran rated Series I 9.78 and linked the randomizer (231854 comment, 2026-10-30). It is the only mention of any digital tool in the data.

---

## 2. Jobs-to-be-done and pain points, ranked by strength of evidence

Strength key: **High** = several independent sources plus quantitative signal. **Medium** = several sources. **Low** = one or two.

| # | Job / pain | Strength | Evidence | What the app does today |
|---|---|---|---|---|
| P1 | **"Tell me what this card/rule means, right now, without the internet."** Rules are crammed onto tiny cards and corner cases are ambiguous. | **High** | 55 of the 84 threads are rules questions (FAQ.md coverage table). Reviews: "Button Shy ran out of room for detailed instructions … having to look up online content decreases the value of Twin Stars as a highly portable game" ([2544679](https://boardgamegeek.com/thread/2544679)). "rules of specific scenarios could be somewhat vague" ([1818949](https://boardgamegeek.com/thread/1818949)). "Compacting all the rules down to single cards is pretty tough on the player … I doubt I made the right guess about some corner cases" (grasa_total, 262770). "lack of clarity in some of the rules and just too much going on on one tiny card" (GamesGamesG, 231854). Per-scenario complaints: "Unclear rules" (Rule the World), "No hint how many guards start" (Steal the Plans) (zefquaavius, 231854). "The wording on this particular adventure also is a smidgen suboptimal" (zefquaavius, 376110). "Very confused about a few rules" ([2296490](https://boardgamegeek.com/thread/2296490)). "Did I win or lose?" ([2004183](https://boardgamegeek.com/thread/2004183)). Even the app author says "the rules can be a bit difficult to wrap your head around". | An offline Rules FAQ (72 entries) with `?` links from 13 characters and scenarios 01–12. **Gaps:** about 53 entries in the merged FAQ.md are NEW (not in the app). There is no Sc.13 or Sc.14 section. Striker and Bippinnidip have no anchors. Three app answers conflict with or omit designer rulings (FAQ.md §"Conflicts"). |
| P2 | **"Track the state of my game without a pile of fiddly tokens."** | **High** | "you have to provide your own dice and coloured tokens to represent this and that. And the game play is oddly frustrating" (mathmethman, rating 3). "Don't love: all the extra tokens needed" (GamesGamesG). "scenarios could get really crowded up with tokens … The game could easily be bumped, shifted, or even wind swept" ([1818949](https://boardgamegeek.com/thread/1818949)). "anywhere from 6 to 13 [tokens] … using paperclips for health" ([2544679](https://boardgamegeek.com/thread/2544679)). "Plastic-coated paperclips work better than cubes for tracking health and all" (GaryP). Telling base precision from current precision: "I cannot discriminate base and current precision any more using identical markers" → "I used different coloured cubes" ([1706174](https://boardgamegeek.com/thread/1706174)). Deluxe tokens "are really helpful in remembering what each token represents" ([2015234](https://boardgamegeek.com/thread/2015234)). Demand for token PnP ([2193562](https://boardgamegeek.com/thread/2193562), [2328523](https://boardgamegeek.com/thread/2328523)). An official Token Kit accessory (BGG 307089: "120 single sided tokens … and 2 reference sheets") exists. Even the 2022 Moonset reimplementation changed tracking to "uses cubes … on the card instead of using the edges of the card" (BGG 371921). | **Not addressed.** There is no health or energy tracker in a normal mission. Health and energy steppers exist only in SYZYGY carry-over (`app.js` ≈L2239–2400). |
| P3 | **"Pick a pairing I haven't tried / that's interesting, and see how my teams do."** | **High** (job), **Medium** (pain) | Random draws and studying pairings (§1.5). Recommended pairs mislead: "The recommended characters are NOT always the best characters" ([2179510](https://boardgamegeek.com/thread/2179510)). Designer errata: "Recommended With" is "simply wrong" ([2524299](https://boardgamegeek.com/thread/2524299)). | The app's core already covers this: randomize, locks, unplayed list, stats. There is **no per-pair analysis** (win rate by pair or by pair×scenario) and no fixed-team mode. |
| P4 | **"Don't let me forget a step (skill check, energy re-roll, mandatory effect, ⚠⚠ when reducing below 1)."** | **Medium** | "providing that you remember to do the skill checks when called for … I may have messed up a couple of times … I found myself forgetting to use the Energy ability" ([1814747](https://boardgamegeek.com/thread/1814747)). Thread clusters on sequencing: G5–G11 in FAQ.md, e.g. [2016581](https://boardgamegeek.com/thread/2016581), [3109567](https://boardgamegeek.com/thread/3109567), [2749853](https://boardgamegeek.com/thread/2749853). "Master The Trials, am I cheating?" ([2341140](https://boardgamegeek.com/thread/2341140)). | The dice roller includes Skill Check, Hebolt flip and Yanfred swap. There is no turn-step guidance. |
| P5 | **"Learn the game / a new scenario quickly."** | **Medium** | "new player tips?" ([2179510](https://boardgamegeek.com/thread/2179510)): advice to start with Escape the Brig and read the TS2 rules. Request for setup videos: "I just seem to get confused about many of the new scenarios and how to place certain things" ([2182643](https://boardgamegeek.com/thread/2182643)). "it looks very complicated to me right now" ([3043727](https://boardgamegeek.com/thread/3043727)). "Scenario Setup" ([1857714](https://boardgamegeek.com/thread/1857714)). "Precision Track Setup" ([1921399](https://boardgamegeek.com/thread/1921399)). | Rulebook images and a Tips modal. No per-scenario setup checklist. |
| P6 | **"Know what exists and what I'm missing; get hold of it."** | **Medium** | Droid scarcity ([2466000](https://boardgamegeek.com/thread/2466000), [2482732](https://boardgamegeek.com/thread/2482732), [2107910](https://boardgamegeek.com/thread/2107910): "don't see any rules how to use them"). Sc.13: "the only way to get it is to get the wallet for that ShyCon" ([3003370](https://boardgamegeek.com/thread/3003370)). Reprint and availability questions ([2259153](https://boardgamegeek.com/thread/2259153), [2737086](https://boardgamegeek.com/thread/2737086), [1792707](https://boardgamegeek.com/thread/1792707)). PnP Arcade product URLs cited in threads now return 404 (checked today). | My Collection supports only whole packs (see §3). |
| P7 | **"The dice feel too swingy; let me play my way."** | **Low–Medium** | The variant thread ([2435075](https://boardgamegeek.com/thread/2435075)): "I also found it frustrating to be 'near' a good combo, and not able to keep either … That felt teasing." Ratings: "Not nearly fun enough for the effort involved" (drewgang, 4). "oddly frustrating" (mathmethman, 3). "too random for some" (BigBoater). Confine the Quarks: "I do not feel like I have good control options" (zefquaavius); "coming nowhere close to beating it" ([2524299](https://boardgamegeek.com/thread/2524299)). | The app records difficulty (Easy/Medium/Hard) but not house rules or droids per record (see opportunity O6). |
| P8 | **"Run a SYZYGY campaign without bookkeeping."** | **Low** (no forum threads; 155 + 65 owners; 5 + 1 logged plays) | The rulebooks (`rules/twinstars1-syzygy.png`, `twinstars2-syzygy.png`) require a lot of state: health set to half (rounded up) for 3 characters, 5 resources per scenario, carry-over, bench healing, permanent elimination at 0 HP, and a branching path. | Implemented, but **still diverges from the rulebooks on the current HEAD**: SYZYGY I has 3 stages and SYZYGY II is linear (`app.js` L1963–2032: `stage === 2` is the last for SYZYGY I). The bench rotates by `stage % alive.length`. `removed[]` is never set. See AUDIT_REPORT H1. |

**Praise to preserve [E].**
- Replayability from very few cards: "replayability is insane" (jdcochran); "the amount of replayability you can get from three cards" (GamesGamesG); "Each and every combination will play very differently" ([2126668](https://boardgamegeek.com/thread/2126668)).
- Portability and quick setup.
- Real decisions despite the dice: "selecting which character gets what dice subtracts from the random-ness" (BigBoater); "surprisingly difficult decisions" ([2544679](https://boardgamegeek.com/thread/2544679)).
- **[I]** The app should reduce bookkeeping and confusion, but it must not automate away decisions. Players value "which die goes where".

---

## 3. Content inventory vs the app

### 3.1 Everything published that I could verify

Sources: the BGG family "Game: Twin Stars – Adventure Series" (38655, 19 items) plus each item's page, and `buttonshygames.com/pages/twin-stars`.

| Product (BGG id) | Year | How released (BGG description) | Content | In the app? |
|---|---|---|---|---|
| Adventure Series I (231854) | 2017 | Wallet + Deluxe (dice + 45 tokens, per Tagmire in [1792707](https://boardgamegeek.com/thread/1792707)); PnP | 6 scenarios, 12 characters | ✅ `series1` |
| Sc.01 Escape the Brig (212097) | 2016 | Pod-X KS stretch goal; standalone 3 cards; **free official PnP** (BGG file 171071) with **Inzill Mey + Strezelsior** | 1 scenario, 2 characters | ⚠ Only inside `series1`; you cannot own just this |
| Sc.02 "The Quark Star" (212098) | 2016 | Pentaquark KS stretch goal | renamed "Confine the Quarks" | ⚠ as above; BGG still uses the old name |
| Sc.03 Rule the World (212971) | 2017 | Universal Rule KS stretch goal | | ⚠ as above |
| Sc.04 Stop the Virus (224505) | 2017 | standalone | | ⚠ as above |
| Sc.05 Steal the Plans (229275) | 2017 | standalone | | ⚠ as above |
| Sc.06 "Bounty Hunt" (235441) | 2017 | standalone | app: "Hunt The Bounty!" | ⚠ as above; naming |
| SYZYGY Mode (307088) | 2017 | KS promo / PnP Arcade free download (pwwka comment) | Campaign for S1 | ✅ (rules diverge, §2 P8) |
| Series I Droid Assistants (322525) | 2017 | KS stretch goals, later $2 add-on; half-size cards | C.R.A.N.K., MC-CY ("Mickey"), Domino 2-5 | ✅ `droids1` |
| Adventure Series II (262770) | 2019 | Wallet; deluxe tokens add-on; PnP | 6 scenarios, 12 characters | ✅ `series2` |
| Sc.07 Master the Trials (324775) | 2017 | Sept 2017 Board Game of the Month Club + PnP; **free official PnP** (BGG file 171067) with **Grulexon + Dain Taubo** | | ⚠ Only inside `series2` |
| SYZYGY II: Waypoint (322527) | 2019 | KS "Free Expansion" booklet | Campaign | ✅ (rules diverge) |
| Series II Droid Assistants (322526) | 2019 | KS free expansion, later $2 | F1D0, T.R.IX, MANTIS | ✅ `droids2` |
| Captain Crag (276844) | 2019 | PnP Arcade exclusive, later May 2019 BGotMC; **fan-designed by Discord vote** | 1 character | ✅ `captaincrag` |
| Series III Sc.13 Topple the Giant (372403) | 2022 | ShyCon Nashville 2022 only, "prototype edition"; no PnP ([3003370](https://boardgamegeek.com/thread/3003370)) | 1 scenario, 2 characters (names not on BGG) | ✅ `scenario13`: Feth Doriet, Pummtoggs (**unverified spellings**) |
| Series III Sc.14 Save the Spacewhales (376110) | 2023 | Numbsters KS / Dec 2022 BGotMC (shipped Oct 2023); BGG lists "Print & Play" and "Sleeve" versions | 1 scenario, 2 characters | ✅ `scenario14`: Striker, Bippinnidip (**see naming**) |
| Twin Stars: Token Kit (307089, accessory) | 2020 | 120 single-sided tokens + 2 reference sheets | components | n/a, but useful as a design reference for which tokens each scenario needs |
| **Moonset** #1 Destroy the Artifact (371921) | 2022 | "new episodic game that **reimplements** Twin Stars"; scenario postcard + 2 cards; cubes on the card; Hide/Hunt; skills and items | characters listed as "Korma Ranogh Saria Balgalor" (word boundaries unclear) | ❌ |
| Moonset #2 Protect the Village (377398) | 2022 | as above | "Machilo Unora-Vae" | ❌ |
| Moonset #3 Catch the Slayer (379634) | 2023 | as above | "Rallyed Thilve Nereayne" | ❌ |

Not verified: "Supertall" was described as a "standalone sequel to Twin Stars" by a search summary only, and "Oversized Scenario cards" appear in one collection comment.

### 3.2 Gaps and mismatches

1. **The app's collection is all-or-nothing per wallet [E→I].** Free-PnP users (Escape the Brig + 2 characters; Master the Trials + 2 characters) and owners of standalone scenario wallets (213 BGG owners of Sc.01 alone, 43 of Sc.07) cannot describe what they own.
   - **[I]** These players will get random picks they don't own. That violates the app's own promise ("from the content packs you own").
   - Fix: let users toggle individual scenarios and characters inside a pack, or add "Free PnP: Escape the Brig" and "Free PnP: Master the Trials" packs.
   - Only those two scenario→character pairings are verified (BGG files 171071 and 171067). The other original 3-card pairings were not found in my sources.
2. **Moonset is missing.** It is a *reimplementation* with different rules (cubes, Hide/Hunt, items), and I found no statement that it can be mixed with Adventure Series content.
   - **[I]** It needs a separate content system, or it should be listed as "not supported". *Validate:* ask in the BGG Moonset forums or the Button Shy Discord whether people cross-play.
3. **Naming mismatches.**
   - BGG uses old or alternative names: "The Quark Star" (renamed "Confine the Quarks", per the official FAQ) and "Bounty Hunt" vs the app's "Hunt The Bounty!". The publisher's Series I description says "06: Hunt the Bounty", so the app matches the publisher.
   - The app's capitalisation is inconsistent: Series I uses Title Case ("Escape The Brig!") and Series II uses sentence-style ("Master the Trials!"). Button Shy's FAQ page writes "Escape The Brig" and "Confine The Quarks", so the app follows the cards. Low priority, but a consistent display form would help search and BGG cross-referencing.
   - **"Striker" vs "Ztriker."** The only forum post that names this Sc.14 character spells it "Ztriker" twice ([3109567](https://boardgamegeek.com/thread/3109567)). The app uses "Striker". *Validate:* check against the physical card or the BGG image gallery for 376110. One poster's spelling is weak evidence, but no source supports "Striker" either.
   - The Sc.13 character names "Feth Doriet" and "Pummtoggs" appear in no BGG data. Verify them from the card.
4. **SYZYGY naming and gating.** BGG names are "SYZYGY Mode" and "SYZYGY Mode II: Waypoint". The rulebook says SYZYGY II "Requires: Twin Stars: Adventure Series (I or II)" (`rules/README.md`). The app derives availability from series ownership, but SYZYGY booklets are separate items (155 and 65 owners vs 1,358 for Series I).
   - **[I]** Many app users may not own the booklets. The SYZYGY UI should say where to get them, or be framed as "if you have the SYZYGY booklet".
5. **Combination counts differ from the publisher's.** The publisher counts unordered pairs: "396" for one series and "3,312" for Series I+II (BGG 231854, 262770). The app counts ordered pairs (Primary/Secondary): 11,368 with all packs.
   - The rulebook does define Primary/Secondary ("Some scenarios will make use of this designation", `rules/twinstars1.png`), so ordered counting is defensible. But the difference will confuse people who compare with the box. Consider showing both.
6. **Errors in the repo's rules transcription.** `rules/README.md` says the Series I components are "6 Scenario Cards, 12 Character Cards". The actual image `twinstars1.png` says "1 Scenario Card, 2 Character Cards", so it is the single-scenario rule sheet. The transcription also leaves out the `[SKILL⊘]` failure result ("the action immediately following this Skill Check doesn't occur").
7. **Broken purchase link.** The README links `buttonshygames.com/products/twin-stars`, which returns 404 (checked 2026-11-05).

---

## 4. Competitive and alternative landscape

| Alternative | What it gives players | Evidence | Gap the app can fill |
|---|---|---|---|
| **Physical deluxe tokens / Token Kit / PnP token set** | Icons that show what each token means | [2015234](https://boardgamegeek.com/thread/2015234), BGG 307089, [2328523](https://boardgamegeek.com/thread/2328523) | Out of print, and the PnP Arcade link is now 404. A digital tracker removes the need for tokens. |
| **Improvised components:** paperclips, coloured cubes, post-its with stick figures | Health and track markers | GaryP; [2544679](https://boardgamegeek.com/thread/2544679); [1706174](https://boardgamegeek.com/thread/1706174); [2296490](https://boardgamegeek.com/thread/2296490); [1814747](https://boardgamegeek.com/thread/1814747) ("I drew stick figures on post-it notes") | Same as above. |
| **Official Button Shy FAQ page** (`/pages/twin-stars-faq`) | Covers General (1 Q), Sc.01–03 and Yanfred Jima only (fetched today) | curl of the page | Partial and online-only. The app's offline FAQ is already more complete. |
| **korossyl's three BGG FAQ threads + Fandom wiki FAQ** | Designer-approved answers | [2226633](https://boardgamegeek.com/thread/2226633), [2226629](https://boardgamegeek.com/thread/2226629), [2226618](https://boardgamegeek.com/thread/2226618), [2296490](https://boardgamegeek.com/thread/2296490) | Online-only. The wiki returned 403 to me. |
| **Fan rules aid "Twin Stars holistic summary"** (BGG file 291213, 2024) | "wallet-sized summary integrates all three Adventure Series' rules into a single quick reference" | `dl/files_231854.json` | Static. Could be linked from the app, with credit (the author asks for credit). |
| **Official rule PDFs and free PnPs on BGG Files** | Rules; a free 1-scenario starter for each series | BGG files 171071, 171067, 193660, 217403/4/6, 254154/6 | Discovery: the app could point newcomers to the free PnPs. |
| **YouTube playthroughs** (Maadmatt / Matt Upton) | Setup and teaching | [2182643](https://boardgamegeek.com/thread/2182643), [2179510](https://boardgamegeek.com/thread/2179510) | Not tied to the moment of play. |
| **Button Shy Discord** | Fast rules answers; the community designed Captain Crag | [2179510](https://boardgamegeek.com/thread/2179510), BGG 276844, [2466000](https://boardgamegeek.com/thread/2466000) | Not searched (closed platform). Probably where power users are; recruit interviewees there. |
| **BGG play logging** | 1,653 plays logged on Series I | dynamicinfo | No awareness of characters or scenarios, no unplayed-combination view. |
| **BG Stats (Board Game Stats app)** | Logs plays with expansions, per-combination stats, campaigns via tags (paid), BGG sync (per search summaries of the App Store listings) | [App Store id892542000](https://apps.apple.com/us/app/-/id892542000) | Generic. It cannot model "character A + character B + scenario + difficulty + droid", or suggest unplayed combos. **[I]** It is a likely log destination for heavy loggers, so interoperability may matter. |
| **Generic randomizer apps** | Spin a wheel | search results | No content knowledge. |
| **Analogues in other games** | Spirit Island's Spirit Guide: randomizer + scoring + game log. Frosthaven's official companion: automated setup + campaign tracking. | [Spirit Guide](https://apps.apple.com/us/app/id1452929632), [Frosthaven companion](https://apps.apple.com/us/app/-/id6443837203) | Shows that randomizer + log + in-game state + campaign is an accepted companion pattern. |
| **Official Button Shy apps** | Button Shy publishes digital games (it has a "Digital Game Privacy Policy" page), but I found **no Twin Stars app or companion** | sitemap; search | None. |

**Result of the search:** I found **no other Twin Stars-specific app, tracker, spreadsheet or randomizer** on BGG (forums, files) or the web. Reddit and the Discord were not searchable. The app is, as far as I can verify, the only Twin Stars-aware digital tool.

**What no alternative does, and the app could:**
1. Model Twin Stars entities (primary/secondary pair × scenario × difficulty × droid) and remember coverage.
2. Track live scenario state offline, replacing tokens.
3. Show rulings filtered to the two characters and scenario on the table.
4. Learn from the player's own history which pairs work.
5. Run the SYZYGY campaign state machine.

---

## 5. Opportunities (evidence → hypothesis → how to validate)

Order: evidence strength first, then fit with the app's offline, local-only principles.

| # | Opportunity | Evidence | Hypothesis | Validation |
|---|---|---|---|---|
| **O1** | **Live Mission Tracker:** health per character, a shared energy pool, and labelled scenario counters during a normal mission | P2 (High), P4 | Players playing on small, unstable surfaces will use phone counters instead of tokens, and fewer state errors will happen | (a) A fake-door "Track health & energy (beta)" button with an Umami custom event, measuring CTR among sessions that load a mission. (b) BGG poll in the Series I forum: "What do you use to track health/energy?" (c) 5 interviews with PnP players recruited via BGG/Discord. |
| **O2** | **Complete and fix the in-context FAQ:** add the ~53 NEW rulings, a Sc.13/14 section, fixes for the 3 conflicts, anchors for every character, and show only the rulings for the current pair + scenario first | P1 (High) | In-context rulings reduce the "look it up online" problem a reviewer named explicitly ([2544679](https://boardgamegeek.com/thread/2544679)) | Umami events: `faq_open` with the anchor id (no personal data), and the share of missions where the FAQ is opened. Compare before and after the FAQ is filtered by context. |
| **O3** | **Collection granularity:** toggle individual scenarios and characters; packs for the free PnPs; standalone scenario wallets | P6, §3.2(1) | Owners of a subset will otherwise abandon the app after it rolls content they don't own | Umami: how often a randomize result is followed by a re-roll or manual change (a proxy). Poll: "Which Twin Stars items do you own?" (BGG polls support multiple choice). |
| **O4** | **Pairing insights from your own log:** win rate per ordered pair, pair × scenario heat-map, "never won with", "best pair for this scenario"; a **fixed-team gauntlet** (one pair through all owned scenarios) | §1.5, P3 ([2126668](https://boardgamegeek.com/thread/2126668), [2815045](https://boardgamegeek.com/thread/2815045), [3043727](https://boardgamegeek.com/thread/3043727)) | The engaged segment's favourite activity is studying pairings, and the app already holds the data | Interviews; count users with ≥20 records (Umami `save_record` counts per device); a fake-door "Gauntlet" entry. |
| **O5** | **SYZYGY done right:** model both rulebook graphs, elimination at 0 HP, a chosen bench, and correct ranks; label it "requires the SYZYGY booklet" | Rulebooks; AUDIT H1 (still present at HEAD) | Correctness protects trust. Demand is uncertain (5 BGG plays) | Umami `sz_start` / `sz_complete` funnel before investing beyond the correctness fix. |
| **O6** | **Record context with each play:** droid used, house-rule variant (e.g. Tagmire's keep-or-reroll compromise from [2435075](https://boardgamegeek.com/thread/2435075)), owned edition | P7 | Stats are misleading if variant and droid plays are mixed with standard ones | Count records that use the droid field. Poll: "Do you use any house rules?" |
| **O7** | **Teach / first-mission mode:** recommend Escape the Brig first, a per-scenario setup checklist (dice, token count, starting positions), the turn summary, and a link to the free PnPs and rule PDFs | P5 ([2179510](https://boardgamegeek.com/thread/2179510), [2182643](https://boardgamegeek.com/thread/2182643), [3043727](https://boardgamegeek.com/thread/3043727)) | Lowers drop-off for new or returning players and PnP builders | Umami: share of first sessions that reach "save record". Interviews with 2–3 newcomers (think-aloud test). |
| **O8** | **Interoperability:** export plays as a BGG-loggable summary or BG Stats-compatible file; import from them | Only BGG logging is observed (1,653 plays). **No user has asked for this.** | Heavy loggers will want one source of truth | **Speculative.** Check BG Stats' documented import format first. Poll: "Do you log plays elsewhere?" |
| **O9** | **Availability and "what exists" guide:** an inventory page (§3.1) showing how each item was released, without pirated links | P6 | Collectors value it; it also helps Button Shy (reprint demand signal) | Low cost. Measure outbound clicks. **Ask Button Shy** before linking to any files. |

Cross-cutting instrumentation **[I]**: Umami on this app is configured for page views only (README; `index.html` L34). To validate O1–O7, add a small set of anonymous `umami.track()` events: `randomize`, `lock`, `manual_pick`, `save_record`, `dice_roll`, `skill_check`, `faq_open{anchor}`, `rules_open{tab}`, `sz_start`, `sz_complete`, `export`, `import`, `unplayed_play`, `radio_play`, plus fake-door clicks.
- Keep the README's privacy promise: no free text, no record contents.
- Update the README "Analytics" line to match.

---

## 6. Feature concepts grounded in the game's mechanics

What happens at the table, from `rules/twinstars1.png`, `twinstars2.png`, the SYZYGY sheets, and `rules/README.md` (verified against the downscaled `twinstars1.png`):

- **Setup.** Choose a scenario and two characters; the left one is **Primary**. Set energy by difficulty (each scenario lists Easy/Medium/Hard energy). Place scenario tokens.
- **Each round:**
  - **Roll** the unplaced character dice.
  - **Place** them one at a time; order matters. Optional INSTANTs and mandatory EFFECTs fire on placement.
  - **Check for combos** using the icons (✓, ★, ⚠) defined on the scenario card. Combos are mandatory.
  - **Combo:** take the scenario action and pick both dice back up.
  - **No combo:** reduce one die by 1 (optional REACTION / mandatory FATIGUE on the new value), then re-roll and re-place the other die.
  - **Reducing below 1** forces the ⚠⚠ action.
- **Special actions** cost energy. The basic special action is "1⚡: re-roll one die".
- **Skill check:** roll 2 skill dice; each must fit a character's range. On failure, resolve `[SKILL ❤]` (−1 health to a character of your choice) or `[SKILL ⊘]` (the next action doesn't happen). FOCUS gives a bonus.
- **The game ends** at the win or lose condition, or when a character reaches 0 health.
- **Tracked state:** health for 2 characters, the energy pool, 4 dice (2 character + 2 skill), 1–3 scenario-specific tracks or resources, and markers placed on the card. Examples from the FAQ: Escape the Brig (prisoner, guard, pick); Quarks (base and current precision, funding, quarks); Rule the World (assault track, starfighters, ion cannon); Hunt the Bounty (information, threat, supplies); Beat the Odds (coins vs thieves' track); Control the Skies (upgrade track, shields, missiles); Sell the Junk (money track that skips $9/$11); Destroy the Order (passed laws); Spacewhales (junk, spacewhales).
- **SYZYGY adds:** 3 characters at half health, a bench that heals to full, 5 resources (3 after a loss) split between ❤ and ⚡, carry-over, elimination at 0 HP, and a branching path with ranks.

| Concept | What it does | Evidence-backed? | Notes / risks |
|---|---|---|---|
| **C1. Mission board** (O1) | Large-tap counters: ❤ per character (Primary/Secondary labelled), ⚡ pool preset by the chosen difficulty, plus 1–4 **generic named tracks per scenario** (e.g. "Base precision" and "Precision" as two visually distinct markers, which fixes [1706174](https://boardgamegeek.com/thread/1706174)). Undo; screen wake-lock; survives reload (localStorage). On loss at 0 ❤, offer "Record Loss". | **Yes** (P2, P4) | **IP:** store *numbers and track names*, not card text or art. Starting health and energy per difficulty are short factual values. **[I]** That is lower risk than reproducing card text, but still ask Button Shy. Safest fallback: users type their own starting values once and the app remembers them. |
| **C2. Turn-step rail** | A thin stepper beside the dice roller: Roll → Place (Instants/Effects) → Combo? → Reduce/Re-roll (Reactions/Fatigue) → "below 1 ⇒ ⚠⚠". A reminder chip "⚡ Re-roll available" whenever energy > 0. Skill check result buttons `[SKILL ❤]` / `[SKILL ⊘]`. | **Partly** (P4; the sequencing threads G5–G11) | Must be dismissible and never block play. Some players dislike being "managed". Test with a toggle. |
| **C3. Smarter Skill Check** | The user enters each character's skill range once (e.g. 4–6, 1–2). The roller then says pass/fail using the rulebook rule "each die must fit within each character's range, one die per character" (FAQ D1). Show FOCUS as a highlight. | **Partly** (skill-check confusion: [1706180](https://boardgamegeek.com/thread/1706180), [1859901](https://boardgamegeek.com/thread/1859901), [3192416](https://boardgamegeek.com/thread/3192416), [2749853](https://boardgamegeek.com/thread/2749853)) | Same IP note as C1 (user-entered ranges). |
| **C4. Character-die mode in the roller** | Two dice labelled with the current Primary and Secondary names; "No combo → reduce [A] / re-roll [B]" in one tap; a "−1 from 1" warning that triggers the ⚠⚠ reminder. | **Speculative**, extending an existing feature | Keeps the player's choice; only removes fiddly steps. |
| **C5. Rules-in-context** (O2) | When a mission is loaded, the FAQ opens filtered to *these two characters + this scenario + general*. Every ruling shows an authority badge (Designer / Designer-approved / Community / Disputed), using the tags FAQ.md already has. | **Yes** (P1) | Paraphrase forum rulings and link the thread. Don't copy long posts verbatim. **[I]** BGG posts belong to their authors. |
| **C6. Combo lookup / synergy explorer** | Show which faces of each character carry ✓/★/⚠, and compute the chance of a ★★ or ✓✓ combo for a pair. | Motivated by [2126668](https://boardgamegeek.com/thread/2126668) (icon placement is "of the utmost importance") and [2435075](https://boardgamegeek.com/thread/2435075) (Tagmire's icon-distribution stats) | **Highest IP risk:** it needs a transcription of every card's icon layout, which is core game data. **Do not ship without Button Shy's written OK.** A lower-risk alternative is O4: an empirical synergy view from the user's own logs. |
| **C7. Scenario setup checklist** (O7) | Dice needed (4), approximate token count, where markers start, "Primary/Secondary matters here". | **Partly** (P5, [1857714](https://boardgamegeek.com/thread/1857714), [1921399](https://boardgamegeek.com/thread/1921399), [2084141](https://boardgamegeek.com/thread/2084141)) | Same IP care: short paraphrases plus a link to the card or rule sheet. |
| **C8. SYZYGY state machine** (O5) | Graph-driven stages from both rulebooks; resource allocator (5, or 3 after a loss); half health rounded up; bench heals; eliminate at 0; correct ranks. | **Rulebook-backed;** demand **unproven** | Already partly built. Fix correctness first, then measure. |
| **C9. Droid slot in every record and in the tracker** | Pick a droid; record it with the play; filter stats by droid. | **Low** (droids exist; [2107910](https://boardgamegeek.com/thread/2107910)) | Don't reproduce droid card text; name and user notes only. |
| **C10. Gauntlet / fixed-team mode** (O4) | Lock a pair; the app serves each owned scenario in turn and shows a progress strip and per-scenario result. | **Yes, one explicit user** ([2815045](https://boardgamegeek.com/thread/2815045)), plus campaign appetite | Cheap to build on locks plus the unplayed logic. |

### Rights and IP cautions

- **No Button Shy fan-content or licensing policy was found.**
  - I checked: `buttonshygames.com` sitemap (93 pages), `/pages/faq`, and the Twin Stars pages, all via curl, and web search.
  - The only related statements are informal itch.io comments about a *different* Button Shy-published system (AdvanceQuest): fan content is fine if it is "offered for free … includes a credit". Sources: [itch.io/post/5930008](https://itch.io/post/5930008), [itch.io/post/7899144](https://itch.io/post/7899144). **This is not a Twin Stars policy.**
- **Things that already deserve a permission check [I]:**
  - The app **bundles the rulebook images** (`rules/*.png`), which are Button Shy artwork and text by Luke Milton, Tagmire and Mullins.
  - The FAQ reproduces rulings.
  - The app has a Ko-fi donation link. **[I]** That may matter if Button Shy's informal norm is "free, non-commercial".
- **Recommendation:** email or Discord Jason Tagmire. He is visibly responsive: he posted rulings on BGG and answered a droid request by email ([2466000](https://boardgamegeek.com/thread/2466000)). Ask for explicit permission covering:
  - (a) the bundled rule sheets,
  - (b) storing per-card numbers (health, skill range, energy by difficulty),
  - (c) any icon-layout data (C6).

  Until then, prefer user-entered values and links, and keep the existing "unofficial, not affiliated" disclaimer.
- **Forum content:** paraphrase and link BGG posts with author attribution. Don't bulk-copy them.
- **Fan aids** (e.g. the "holistic summary", BGG file 291213): link only, credit the author, and don't re-host.

---

## 7. Gaps and next research steps

- **No device, usage or retention data.** Umami tracks page views only. Add the events in §5 before prioritising O4–O8.
- **The Discord was not examined.** It is likely the richest source on power users, house rules and tracking hacks. Next step: 5–8 interviews recruited there and on BGG (the Series I forum). Screen for PnP vs wallet and logger vs non-logger.
- **The comment sample is partial:** the first 50 per item; later pages need a BGG login. Series I has 178 comments in total.
- **Unverified:** the spellings of the Sc.13/14 character names, Moonset character name boundaries, whether Moonset and Adventure Series can be mixed, "Supertall" as a sequel, the "Oversized Scenario cards" product, and the current availability of PnP Arcade products (their old URLs now 404).
- **Combination math:** the app counts ordered pairs (11,368) and the publisher counts unordered ones (3,312 for S1+S2). Decide which to show, or show both.
