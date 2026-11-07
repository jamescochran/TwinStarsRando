# Twin Stars: Adventure Series — Rules FAQ from the BoardGameGeek forums

This is the merged FAQ for the Twin Stars Adventure Randomizer (fan app). It covers Series I, Series II and Series III Scenario 14. Compiled 2026-11-05.

The game is designed by **Jason Tagmire** (BGG user `jtagmire`, also Button Shy's owner) and **Mike Mullins**. Every "Designer ruling" below is a post by Jason Tagmire. No post by Mike Mullins was found.

## How to read the tags

- **Product:** `S1` = Series I (scenarios 01–06 and its 12 characters). `S2` = Series II (scenarios 07–12). `S3-14` = Series III Scenario 14: Save the Spacewhales. `S3` = Series III in general. `All` = core rules.
- **Authority:**
  - *Designer ruling*: Jason Tagmire posted it himself.
  - *Designer-endorsed*: Tagmire replied "Official here", or approved another person's answers in the same thread.
  - *Designer-approved (via korossyl's FAQ)*: from the three "Twin Stars FAQ" threads by korossyl (Laszlo Korossy, a fan, not staff). He states that every answer was approved by Tagmire. I could not verify this myself.
  - *Rulebook citation*: quoted from the rulebook in a thread.
  - *Community consensus*: players' answers (korossyl's own replies count here too).
  - *Disputed/unresolved*.
- **Status:** **NEW** (not in the app's `faqModal`), **Already in app FAQ**, or **NEW detail** (the app covers the topic, but this adds something new).

## Coverage

Source: three workers, one per game scope. The BGG XML API2 returned **HTTP 401 Unauthorized** for all three ("See https://boardgamegeek.com/using_the_xml_api"), so it now needs a registered token. All content came from the site's JSON endpoints (`api.geekdo.com/api/forums`, `/forums/threads`, `/articles`, `/users`). The network proxy blocked **no hosts**. Every thread was read in full, and post counts match the forum totals.

| Scope (BGG id) | Non-empty forums | Threads | Posts | Dates | Thread categories |
|---|---|---|---|---|---|
| Series I base (231854) | 6 of 10 | 31 | 135 | 2017-10 to 2026-02 | rules 20, review 3, errata/component 2, general-chat 2, trade/sales 2, strategy 1, variant 1 |
| Series I scenario wallets: Sc.01 (212097), Sc.02 (212098), Sc.03 (212971), Sc.04 (224505), Sc.05 (229275), Sc.06 (235441) | 11 of 60 | 31 | 122 | 2017-01 to 2026-03 | rules 24, review 5, errata/component 1, trade/sales 1 |
| Series III Sc.13 Topple the Giant (372403) | 1 of 10 | 2 | 4 | 2023 to 2026 | trade/sales 2 |
| Captain Crag (276844), S1 Droids (322525), S2 Droids (322526), SYZYGY Mode (307088), SYZYGY II (322527), Sc.07 wallet (324775) | 0 | 0 | 0 | — | — |
| **Series II (262770)** (separate worker) | 3 of 10 | 17 | 56 | 2019-01 to 2025-07 | rules 10, errata/component 3, general-chat 2, review 1, trade/sales 1 |
| **Series III Sc.14 (376110)** (separate worker) | 2 of 10 | 3 | 8 | 2023-02 to 2023-11 | rules 1, general-chat 1, trade/sales 1 |
| **Total** | | **84** | **325** | 2017-01 to 2026-11 | rules 55, review 9, errata/component 6, trade/sales 8, general-chat 5, strategy 1, variant 1 |

**Gaps:**
- No thread covers **SYZYGY campaign mode** (either version), droid **rules** beyond "how to add one", **Captain Crag**, Scenario 13 rules, or **2-handed / multiplayer** play. The game is solo-only. One parent asked about co-op decision making; the one-die-per-character answer is covered under G1.
- Rulings that live on the Button Shy Discord, the old buttonshygames.com FAQ page, or the Fandom wiki FAQ were not checked directly.
- The Twin Stars: Moonset scenarios are a separate reimplementation and were not covered.
- Some 2018 questions in the Hunt the Bounty thread (by `christopherwood`) have been deleted. Only Tagmire's quoted replies remain.

Raw notes: `bgg-faq/threads.json` (Series I scope, 64 threads), `bgg-faq-262770/threads.json` and `bgg-faq-376110/threads.json`. Each lists id, title, URL, forum, dates, reply count, category and whether a ruling was found.

---

## ⚠ Conflicts and discrepancies with the app's existing FAQ (read first)

1. **Hunt the Bounty: energy re-rolls on search dice. The app's example conflicts with designer rulings.** The app says: "Energy can be used to re-roll any die at any time, unless a special rule states otherwise (e.g., in Hunt the Bounty, search dice can only be re-rolled using resources rather than energy)." Jason Tagmire said the opposite twice:
   - Asked whether the basic energy ability can re-roll "character die OR capture die OR spaceship die" in Bounty Hunt, he answered "Yes, the basic energy ability is to re-roll a die" ([2082302](https://boardgamegeek.com/thread/2082302)).
   - In this scenario **energy is itself one of the resources** (supply cubes, health and energy) ([1875678](https://boardgamegeek.com/thread/1875678)). So "resources rather than energy" contradicts itself.
   - The app's wording probably comes from korossyl's 2019 FAQ, which postdates these posts. *Suggested fix:* "in Hunt the Bounty, a resource (supply, health or energy) can be spent to re-roll one search die". Or drop the example.
2. **Bood can pay health for the universal re-roll. The app omits this** (Series II finding). The designer-approved general FAQ says the universal re-roll "is itself modified (for instance, by Bood, who can spend health instead)". The app leaves that sentence out. This is an omission, not a contradiction (see C-Bood-1).
3. **Do single-die combos fire right after a reduction? The designer gave two answers.** The app's reaction/fatigue entry says "If no combo results from that, pick up the other die…", which implies you check for combos straight after a reduction.
   - Rule the World (2017): Tagmire gave the order "reduce → check for combos (a single-die combo, rare but possible) → move the Assault Track → roll" ([1817169](https://boardgamegeek.com/thread/1817169)).
   - Hunt the Bounty (2018): he said a knock-down onto an alert "doesn't happen right away", because combos are checked only once both dice are placed ([1875678](https://boardgamegeek.com/thread/1875678)).
   - The app's wording matches the first answer. Flag it as Disputed (see G10).
4. **Scenario 11 "using" a law: the app is right.** The source FAQ thread has a typo ("does result in a combo"). The app already uses the corrected "does not". No change needed (Series II finding).
5. **The "Recommended With" text on scenario cards should be ignored (designer errata).** The app doesn't currently use these pairings, but don't add them as "suggested pairs" (see E1).

No other contradictions were found. Every other app answer that has a direct forum source matches it.

---

## 1. General rules and turn structure

### G1. Can both character dice go on one character? Can one character take both skill dice?
**Product:** All · **Authority:** Designer ruling (Jason Tagmire) · **Status:** Already in app FAQ (character dice). **NEW detail:** the same limit applies to skill dice.
No. Each character gets one character die. In a skill check, each character also gets one skill die. The only exception is a special ability that says otherwise.
Sources: [2074253](https://boardgamegeek.com/thread/2074253), [1792172](https://boardgamegeek.com/thread/1792172), [1706180](https://boardgamegeek.com/thread/1706180)

### G2. Is each die tied to one character, or do you roll and then choose where each die goes?
**Product:** All · **Authority:** Community consensus (matches the rulebook's "Roll dice" section) · **Status:** NEW
You roll first, then choose which character gets which die. The order you place them in matters, because instants and effects resolve as each die is placed. Choosing placement and what to re-roll is where most of the decisions are.
Sources: [2443957](https://boardgamegeek.com/thread/2443957), [2074253](https://boardgamegeek.com/thread/2074253)

### G3. If two combos are possible at once, which one happens?
**Product:** All · **Authority:** Designer ruling · **Status:** Already in app FAQ
You choose. This comes up a lot in Hunt the Bounty and on characters with two icons on one spot.
Sources: [1862034](https://boardgamegeek.com/thread/1862034), [1860728](https://boardgamegeek.com/thread/1860728), [1875678](https://boardgamegeek.com/thread/1875678), [2226633](https://boardgamegeek.com/thread/2226633)

### G4. Can one roll trigger two combos if you have enough icons?
**Product:** All · **Authority:** Community consensus (korossyl, from the rulebook) · **Status:** NEW
No, only one combo per roll. Resolving a combo returns both dice to your hand, so a second combo never gets to fire.
Source: [2226633](https://boardgamegeek.com/thread/2226633)

### G5. Which abilities trigger when a die is reduced ("knocked down")?
**Product:** All · **Authority:** Designer ruling · **Status:** NEW (the app states this only for Brenimov-X and in its reaction/fatigue entry)
- **Instants and Effects** trigger only when a die is **placed** after a roll. A die can be placed after the initial roll, an energy re-roll, or a character's re-roll. Reducing a die never triggers them unless a card says otherwise. The Series II rulebook spells this out: "Instants and Effects are NOT activated by this reduction."
- **Reactions and Fatigue** trigger only when a die is **reduced**.
- **Icons or text with no Instant/Effect header** apply whenever a die is on that spot, however it got there (placed or reduced). Examples: Kinglan's flip, and Inpon Gol's broken heart.
Sources: [2000219](https://boardgamegeek.com/thread/2000219), [1867687](https://boardgamegeek.com/thread/1867687), [2435075](https://boardgamegeek.com/thread/2435075), [2453762](https://boardgamegeek.com/thread/2453762)

### G6. Are instants optional? If an instant has a skill check, when do you roll it, and does failing cancel the instant?
**Product:** All · **Authority:** Community consensus (korossyl). The timing is designer-confirmed in the Roux and Grant rulings (C-Roux-3, C-Grant-1) · **Status:** NEW
Instants are optional. Effects are mandatory. You roll an instant's skill check only if you choose to use the instant. The instant happens either way, and the check (with its bracketed penalty) comes afterwards. In Escape the Brig, the "any Instant" cost (skill check or alert the guard) likewise applies only when you actually use an instant.
Sources: [1859901](https://boardgamegeek.com/thread/1859901), [2749853](https://boardgamegeek.com/thread/2749853), [1759623](https://boardgamegeek.com/thread/1759623)

### G7. Can an instant trigger on a re-rolled die, or only on the first roll?
**Product:** All · **Authority:** Designer ruling · **Status:** NEW
Any roll counts, re-rolls included. Reducing a die does not count. See Roux Jaezmina's chained 6-instant (C-Roux-2).
Source: [1839180](https://boardgamegeek.com/thread/1839180)

### G8. When no combo occurs again, must you reduce the same die again?
**Product:** All · **Authority:** Designer ruling · **Status:** Already in app FAQ
No. Each time, you choose which die to reduce and which to re-roll.
Sources: [2016581](https://boardgamegeek.com/thread/2016581), [2226633](https://boardgamegeek.com/thread/2226633)

### G9. Do you keep reducing and re-rolling until a combo happens? What if a die would go below 1?
**Product:** All · **Authority:** Rulebook citation (as quoted by a player) · **Status:** NEW
Yes, you repeat reduce-and-re-roll until a combo occurs. If a reduction would take a die below 1, you take the **!!** combo.
Source: [2749853](https://boardgamegeek.com/thread/2749853)

### G10. When exactly do you check for a combo? Can a single reduced die make one?
**Product:** All · **Authority:** Disputed/unresolved (two designer answers) · **Status:** NEW (bears on the app's reaction/fatigue entry; see Conflict 3)
The normal check comes after both dice are placed and all instants and effects have resolved. Whether a lone reduced die can form a combo before the other die is rolled is disputed:
- Rule the World (2017): Tagmire said yes.
- Hunt the Bounty (2018): he said no, it "doesn't happen right away".
Sources: [1817169](https://boardgamegeek.com/thread/1817169), [1875678](https://boardgamegeek.com/thread/1875678)

### G11. If the action that wins the game includes a skill check, do you win before the check?
**Product:** All · **Authority:** Designer ruling · **Status:** Already in app FAQ
No. Finish the skill check first. If it kills a character, you lose.
Sources: [1713744](https://boardgamegeek.com/thread/1713744), [2004183](https://boardgamegeek.com/thread/2004183), [2084141](https://boardgamegeek.com/thread/2084141), [2165810](https://boardgamegeek.com/thread/2165810)

### G12. Who gains or loses health?
**Product:** All · **Authority:** Designer ruling ("OFFICIAL RULING TIME") · **Status:** Already in app FAQ
- A heart icon on a character means that character.
- A heart icon on the scenario means either character, unless the card says otherwise. Some scenarios name Primary or Secondary.
- A health loss from a skill check can go to either character, unless the card names one (for example, the Doctor in Stop the Virus).

This is why Stag Solar's 1-spot heal can only heal Stag.
Sources: [1706782](https://boardgamegeek.com/thread/1706782), [1792172](https://boardgamegeek.com/thread/1792172), [2524299](https://boardgamegeek.com/thread/2524299)

### G13. Can special actions be used at any time? Do they all cost energy?
**Product:** All · **Authority:** Designer ruling for Yanfred ("can be activated at any time"); community for the rest · **Status:** Already in app FAQ (energy). **NEW detail:** timing.
Special actions can be used at any time, like the universal energy re-roll. A special costs only what it lists. Saaze's and Yanfred's specials cost no energy: Saaze's triggers when she would drop to 0 health, and Yanfred's is paid for by taking a !! effect.
Sources: [1759636](https://boardgamegeek.com/thread/1759636), [2749853](https://boardgamegeek.com/thread/2749853)

### G14. Does "dice" on a card mean character dice or skill dice?
**Product:** All · **Authority:** Designer ruling · **Status:** NEW
Character dice, unless the card says otherwise.
Source: [1711093](https://boardgamegeek.com/thread/1711093)

### G15. Do the Series II rules replace the Series I rules?
**Product:** S1, S2 · **Authority:** Community consensus · **Status:** NEW
Yes. The rules are the same. The Series II book is clearer and explains the two icons added in Series II.
Sources: [2165812](https://boardgamegeek.com/thread/2165812), [2179510](https://boardgamegeek.com/thread/2179510)

### G16. Which scenario should a new player start with? (tip, not a rule)
**Product:** S1, S2 · **Authority:** Community consensus · **Status:** NEW
Start with Escape the Brig, the system tutorial. Master the Trials is the Series II tutorial. The suggested character pairs are a starting point, not the best pairs (see E1).
Sources: [2179510](https://boardgamegeek.com/thread/2179510), [2341140](https://boardgamegeek.com/thread/2341140)

## 2. Dice and skill checks

### D1. How does a skill check work? Can one character's range cover both dice?
**Product:** All · **Authority:** Designer ruling · **Status:** Already in app FAQ ("unless both dice can fit"). **NEW detail:** the worked example.
Roll both skill dice and assign **one to each character**. Each die must fall within the range of the character it goes to. Tagmire's example: Bood (range 4–6) and Stag Solar (3–4) roll 3 and 3. That is a **fail**: Stag can take one 3, but the other 3 is outside Bood's range. If one die fits and the other doesn't, the check fails.
Sources: [1706180](https://boardgamegeek.com/thread/1706180), [1859901](https://boardgamegeek.com/thread/1859901), [1792172](https://boardgamegeek.com/thread/1792172)

### D2. Do skill dice trigger the icons or instants on the number they show?
**Product:** All · **Authority:** Community consensus (Achim Zien) · **Status:** NEW
No. A skill check only asks whether each die fits a range. Stars, alerts, checks and instant text on that number are ignored. Dice manipulation can still re-roll skill dice (see D4).
Source: [1859901](https://boardgamegeek.com/thread/1859901)

### D3. A skill die fits my character's range, but my character die already sits on that number. Do I still pass?
**Product:** All · **Authority:** Disputed/unresolved (no reply) · **Status:** NEW
Nobody answered. Character dice and skill dice are separate: one of each per character (G1), and skill checks look only at ranges (D2). So the occupied spot should not matter, and you pass. That is my inference, not a ruling.
Source: [3192416](https://boardgamegeek.com/thread/3192416)

### D4. What can the universal energy re-roll target?
**Product:** All · **Authority:** Designer ruling · **Status:** Already in app FAQ. **⚠ The app's Hunt the Bounty example conflicts (Conflict 1).**
Any single die at any time: character, skill, experiment, capture or search dice. This applies on every difficulty, whatever the starting energy. Character re-roll abilities such as Bood's affect character dice only (C-Bood-2).
Sources: [2082302](https://boardgamegeek.com/thread/2082302), [1711093](https://boardgamegeek.com/thread/1711093), [1875678](https://boardgamegeek.com/thread/1875678)

### D5. Is "re-roll both dice" rolled together or one at a time?
**Product:** All · **Authority:** Community consensus. This matches the designer-approved Bood and Grant answers · **Status:** NEW (the app covers it only for Bood and Grant)
Together, as a fresh roll, then place them. Example: Dain Taubo's 3-spot.
Source: [2357969](https://boardgamegeek.com/thread/2357969)

### D6. Does a re-roll add a second attempt, or replace the first?
**Product:** All · **Authority:** Designer ruling · **Status:** NEW
It replaces it. For example, re-rolling an experiment in Confine the Quarks can't earn two quarks.
Source: [1711093](https://boardgamegeek.com/thread/1711093)

## 3. Characters (A–Z)

### Bood
- **C-Bood-1. Can Bood pay health instead of energy for the universal re-roll?** Yes. Skill dice can still only be re-rolled through the universal re-roll, not through Bood's own instant. **Product:** S1 · **Authority:** Designer-approved (via korossyl's FAQ) · **Status:** NEW detail (missing from the app; Conflict 2) · [2226633](https://boardgamegeek.com/thread/2226633), [2226629](https://boardgamegeek.com/thread/2226629)
- **C-Bood-2. Do Bood's re-rolls hit skill dice or character dice?** Character dice only. **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [1711093](https://boardgamegeek.com/thread/1711093)

### Brenimov-X
- **How do you get the star on the 2-spot?** Only by reducing a die to 2. A rolled 2 forces a re-roll, and reducing doesn't trigger that effect. **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [1867687](https://boardgamegeek.com/thread/1867687)

### Fanoobia
- **C-Fan-1. Her special "Prevent a !!": does it cancel the whole combo step, including returning the dice to hand?** Played as: the combo is cancelled, the dice stay where they are, and you then reduce one die and re-roll the other as if no combo had happened. **Product:** S1 · **Authority:** Community consensus (korossyl, "can't speak for the official verdict") · **Status:** NEW · [1856802](https://boardgamegeek.com/thread/1856802)
- Her 1-spot heals only herself. **Status:** Already in app FAQ.

### Gari Obul
- **His special reduces his health to 1 to set his die to any value. Must he be above 1 health to use it?** Yes. **Product:** S2 · **Authority:** Designer ruling ("Yes correct") · **Status:** NEW · [2357845](https://boardgamegeek.com/thread/2357845)

### Grant Rockgardner
- **C-Grant-1. On his 4 and 5 instants, when do you roll the skill check?** When the instant triggers. The check is part of the instant's text. **Product:** S1 · **Authority:** Designer-endorsed (Tagmire: "Official here… all correct except 7") · **Status:** NEW · [2084141](https://boardgamegeek.com/thread/2084141)

### Hebolt Rom
- **His 2-spot fatigue flips the partner's die. Does it matter if that die is about to be re-rolled?** Yes. Resolve the flip first. If the flipped die forms a combo or triggers something, resolve it. Only if nothing results do you re-roll. **Product:** S2 · **Authority:** Community consensus · **Status:** NEW · [2357881](https://boardgamegeek.com/thread/2357881)

### Inpon Gol
- **When does his 3-spot token move, and when does he lose health?** The token moves every time a die leaves the 3-spot (re-rolled, taken back or reduced). He loses health whenever a die ends up on the 3-spot while the broken heart is uncovered. That loss is unlabeled, so it applies however the die arrived. **Product:** S1 · **Authority:** Designer-approved (via korossyl's FAQ); the designer's email was also relayed by a player · **Status:** Already in app FAQ · [1763297](https://boardgamegeek.com/thread/1763297), [2808539](https://boardgamegeek.com/thread/2808539)
- **Does the health loss apply if a die lands on 3 through Fanoobia's flip instant?** Probably yes, because unlabeled text always applies (G5). **Authority:** Community consensus ("pretty sure") · **Status:** NEW · [2808539](https://boardgamegeek.com/thread/2808539)

### Inzill Mey
- **When she copies another character's instant, who uses it?** Inzill does, as if it were on her own card. **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [2000219](https://boardgamegeek.com/thread/2000219)
- **Her 2-instant: where does each die go?** Set the partner's die on the partner, at any number. Inzill's own die is re-rolled and stays on Inzill. **Authority:** Community consensus · **Status:** Already in app FAQ · [1849293](https://boardgamegeek.com/thread/1849293), [1852052](https://boardgamegeek.com/thread/1852052)

### Kinglan
- **Is the heads-up coin used up? Do two activations stack?** One use. Remove the coin after it replaces a flip. A second activation while the coin is already down does nothing. **Product:** S1 · **Authority:** Designer ruling (one use); community (no stacking) · **Status:** Already in app FAQ · [1860728](https://boardgamegeek.com/thread/1860728), [2082300](https://boardgamegeek.com/thread/2082300)
- **C-King-1. When does his unlabeled "Flip" happen?** Whenever a die is on that spot, whether it was placed or reduced there. Effects such as his coin placement still need the die to be placed. **Authority:** Community consensus (korossyl), consistent with Tagmire's rule on unlabeled text (G5) · **Status:** NEW · [2453762](https://boardgamegeek.com/thread/2453762), [2000219](https://boardgamegeek.com/thread/2000219)

### Phaeton
- Only !!! is not a combo; !!!! counts as !!. **Product:** S2 · **Authority:** Designer-approved (via korossyl's FAQ) · **Status:** Already in app FAQ · [2226629](https://boardgamegeek.com/thread/2226629)

### Roux Jaezmina
- **C-Roux-1. Her 6-instant: must the two new dice match?** No. Split the sum any way you like (for example, 7 can be 1/6, 2/5 or 3/4). **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [1839180](https://boardgamegeek.com/thread/1839180)
- **C-Roux-2. Can she chain the 6-instant?** Yes. If the sum is 7 or more you can split it to give her a 6 and go again. You keep going until the sum is 6 or less, and then you're stuck with it. It's press-your-luck, and it never triggers off a reduction. **Authority:** Designer ruling · **Status:** NEW · [1839180](https://boardgamegeek.com/thread/1839180), [2084141](https://boardgamegeek.com/thread/2084141)
- **C-Roux-3. Her 5-spot skill check: before or after the combo resolves?** After. It is still part of the action, so a combo that would win doesn't win if the check kills a character. **Authority:** Designer ruling (corrects a community answer) · **Status:** NEW detail (the app has only the general win-timing rule) · [2084141](https://boardgamegeek.com/thread/2084141)

### Saaze
- **C-Saaze-1. Her special "If Saaze would drop to 0 health, wound teammate and place die on star": which die, and when?** It happens immediately. Her **own** die becomes a 4 (her star), then you check for a combo. It costs no energy, and Saaze doesn't drop to 0. **Product:** S1 · **Authority:** Designer ruling (timing and die); community (no energy cost) · **Status:** NEW · [2526938](https://boardgamegeek.com/thread/2526938), [1759636](https://boardgamegeek.com/thread/1759636)
- **C-Saaze-2. Her 6-instant "[Skill −♥] to −2 either die": does the −2 depend on passing the check?** Players disagree. The general rule that the instant happens and the check comes after (G6) suggests you always get the −2 and risk 1 health. One player reads the bracket as a gate. **Authority:** Disputed/unresolved · **Status:** NEW · [1759623](https://boardgamegeek.com/thread/1759623)
- For her card wording, see E2.

### Smiff
- Focus ★ works as the app describes. **Product:** S1 · **Status:** Already in app FAQ.

### Stag Solar
- **His special ("instead of reducing it"): can it raise a 5 to a 6 to complete a ★★ with the partner's die?** No reply. It looks plausible under the reaction/fatigue sequence, but that is my inference. **Product:** S1 · **Authority:** Disputed/unresolved · **Status:** NEW · [2226629](https://boardgamegeek.com/thread/2226629)
- His 1-spot heal affects only Stag (G12).

### Strezelsior
- **Special "combine both dice, use the sum, re-roll the other die": how does it work?** Combine the two values (say 3 + 3 = 6), set one die to the sum on either character, then re-roll the other die. It works only if the sum is 6 or less. **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [1843276](https://boardgamegeek.com/thread/1843276)
- **C-Strez-1. His 5-instant "Re-roll. If you roll a 5, −3 to this die": which dice?** Only his own die. If it comes up 5 again, it becomes a 2. **Authority:** Designer ruling · **Status:** NEW · [1843276](https://boardgamegeek.com/thread/1843276)

### Yanfred Jima
- **His special "!! to swap both dice": when, and what happens?** Any time. Take the scenario's !! effect as the cost, then swap the two dice. The dice don't return to your hand, and you resolve anything the swap creates. Example: Saaze 5 and Jima 4 swap into ★★. **Product:** S1 · **Authority:** Designer ruling · **Status:** Already in app FAQ · [1759636](https://boardgamegeek.com/thread/1759636)

### Zoaze
- Her re-rolls: +1 to the reaction roll in exchange for a skill check. **Product:** S2 · **Status:** Already in app FAQ.

### Ztriker (Series III)
- **C-Ztr-1. His 4-spot effect "If this doesn't combo, re-roll it": does it fire when a die is reduced to 4?** No. Effects don't trigger on reduction. The Series III rulebook's "Effects may apply" wording is an error left over from Series I; it was corrected in Series II and confirmed on the Button Shy Discord. **Product:** S3 · **Authority:** Community consensus (cites Discord; not verified) · **Status:** NEW · [3109567](https://boardgamegeek.com/thread/3109567)

## 4. Scenarios

### 01 Escape the Brig! (S1)
- **The Pick:** it starts covered. A ★★ combo takes it. Before that, ★! is not a combo. A dropped pick goes back to its spot and can be retaken. **Authority:** Designer ruling · **Status:** Already in app FAQ · [1760270](https://boardgamegeek.com/thread/1760270), [2749853](https://boardgamegeek.com/thread/2749853)
- **Reaching the escape space with a ✓✓ Advance:** you still must pass the skill check (G11). **Status:** Already in app FAQ · [1713744](https://boardgamegeek.com/thread/1713744), [2004183](https://boardgamegeek.com/thread/2004183)
- **SC01-1. "Any Instant: skill check or alert the guard": does this apply when you place on an instant but don't use it, or when you reduce onto one?** No. It applies only when you actually use an instant. **Authority:** Community consensus · **Status:** NEW · [2749853](https://boardgamegeek.com/thread/2749853), [1852052](https://boardgamegeek.com/thread/1852052)

### 02 Confine the Quarks! (S1; originally "The Quark Star")
- **Base vs current precision:** both start on Start. Current can't go below base or Start, and it rises with base when they are level. **Authority:** Designer ruling · **Status:** Already in app FAQ · [1706174](https://boardgamegeek.com/thread/1706174), [1870655](https://boardgamegeek.com/thread/1870655), [1921399](https://boardgamegeek.com/thread/1921399)
- **"Re-roll 1" = every die showing 1; "5 and 6" = one 5 plus one 6, worth +$1M:** a 5+6 is neither a success nor a failure ("near miss"), and it isn't a double. **Authority:** Designer ruling ("OFFICIAL RULING TIME") · **Status:** Already in app FAQ · [1706174](https://boardgamegeek.com/thread/1706174), [1870655](https://boardgamegeek.com/thread/1870655)
- **SC02-1. Are the precision-track bonuses cumulative?** Yes. At the top you have all three. **Authority:** Designer ruling · **Status:** NEW · [1706174](https://boardgamegeek.com/thread/1706174)
- **SC02-2. Does Calibrate raise base or current precision? Can you experiment twice?** Calibrate raises **current** precision by 1, then you experiment. You may also take the free experiment after any combo, but that one carries the downside. So a Calibrate turn can mean two experiments. **Authority:** Designer ruling (community for "twice") · **Status:** NEW · [1706174](https://boardgamegeek.com/thread/1706174)
- **SC02-3. Does an even double (2/2, 4/4, 6/6) at "Evens = +1" give +2?** No, just +1 ("as far as I know"; Tagmire said he would confirm with Mike Mullins, and no follow-up was found). **Authority:** Designer ruling (tentative); community agrees · **Status:** NEW detail · [1706174](https://boardgamegeek.com/thread/1706174), [1760277](https://boardgamegeek.com/thread/1760277)
- **SC02-4. What does each combo do to the tracks?** ★★ = Calibrate (+1 current). ✓✓ = +1 base. !✓ = skill check, −1 current on a failure. !! = current drops to base. Base never goes down. **Authority:** Community consensus (Tagmire thanked the poster) · **Status:** NEW · [1921399](https://boardgamegeek.com/thread/1921399), [1760277](https://boardgamegeek.com/thread/1760277)

### 03 Rule the World! (S1)
- **Do the ships start covered?** No, uncovered. **Authority:** Designer ruling · **Status:** Already in app FAQ · [1857714](https://boardgamegeek.com/thread/1857714)
- **SC03-1. How do the !! sneak attack and the Assault Track work?** On !!, roll two dice. If a result matches an uncovered starfighter, that fighter's target takes damage. Even numbers or covered fighters do nothing. The Assault Track drops each time you **reduce** a die, not on !!. **Authority:** Designer ruling · **Status:** NEW · [1759342](https://boardgamegeek.com/thread/1759342)
- **SC03-2. Order of events when you reduce:** reduce one die and take the other in hand → check for a (single-die) combo → move the Assault Track and resolve its end → roll the other die. (See G10 for the dispute.) **Authority:** Designer ruling · **Status:** NEW · [1817169](https://boardgamegeek.com/thread/1817169)
- **SC03-3. Who is Primary and who is Secondary?** You choose before the game. Put the Primary on your left. Stop the Virus uses the same convention. **Authority:** Designer ruling · **Status:** NEW · [1817169](https://boardgamegeek.com/thread/1817169)
- **SC03-4. What does Ion Cannon damage mean, and do you lose if it's hit at Start?** It moves down one step. Players say a hit at Start does not lose the game, but this is unconfirmed. **Authority:** Disputed/unresolved · **Status:** NEW · [1759342](https://boardgamegeek.com/thread/1759342)

### 04 Stop the Virus! (S1)
- **Marked vs covered viruses; treating vs healing:** see the app. **Status:** Already in app FAQ · [1763297](https://boardgamegeek.com/thread/1763297)
- **SC04-1. Does the healing attempt's "start" rule apply once per game or at every attempt?** At every attempt. **Authority:** Designer ruling, relayed from email by a player · **Status:** NEW · [1763297](https://boardgamegeek.com/thread/1763297)
- **SC04-2. For "Doctor [Skill −1 Stamina]", does only the Doctor roll?** No. Both characters do the skill check as usual, but the Doctor takes the penalty if it fails. **Authority:** Designer ruling · **Status:** NEW · [1792172](https://boardgamegeek.com/thread/1792172)

### 05 Steal the Plans! (S1)
- **Guards:** one at the start, at most four tokens, tokens can be reused, and "straight line" means along the same edge. **Authority:** Designer-endorsed · **Status:** Already in app FAQ · [2084141](https://boardgamegeek.com/thread/2084141)
- **SC05-1. Can the ★★ combo give both actions to the same character?** Yes. **Authority:** Designer-endorsed · **Status:** NEW · [2084141](https://boardgamegeek.com/thread/2084141)
- **SC05-2. Does "If plans here" apply only at the marked spots?** No answer. The plans start with 1 guard, and guards are added as the plans pass the marked points. **Authority:** Disputed/unresolved · **Status:** NEW (the app covers passing through a spot) · [1899380](https://boardgamegeek.com/thread/1899380)

### 06 Hunt the Bounty! (S1)
- **Resources and capture:** resources are supply cubes, health and energy. On ★★, spend any number, then roll two dice. Info level + dice + resources spent must reach **30** to capture. **Authority:** Designer ruling · **Status:** Already in app FAQ · [1875678](https://boardgamegeek.com/thread/1875678), [2296490](https://boardgamegeek.com/thread/2296490)
- **Inquiry and Restock:** see the app. **Authority:** Designer ruling · **Status:** Already in app FAQ · [1875678](https://boardgamegeek.com/thread/1875678)
- **SC06-1. If an inquiry spans two planets, do both apply?** Yes. You can fail one and succeed at the other in the same roll. **Authority:** Designer ruling · **Status:** NEW · [1875678](https://boardgamegeek.com/thread/1875678)
- **SC06-2. How does Max Info or Max Threat "add a star/alert to combos" work?** Treat it as an imaginary **third die** sitting on one ★ (max info) or one ! (max threat). After instants and effects, check all three for a combo. One real ! plus the imaginary ! makes a !! ambush. You can manipulate the real dice to dodge it. **Authority:** Designer ruling · **Status:** NEW · [1875678](https://boardgamegeek.com/thread/1875678)
- **SC06-3. Re-rolling inquiry dice:** each resource spent re-rolls **one** die, and energy counts as a resource (Conflict 1). **Authority:** Designer ruling · **Status:** NEW detail; **⚠ conflicts with the app** · [1875678](https://boardgamegeek.com/thread/1875678), [2082302](https://boardgamegeek.com/thread/2082302)
- **SC06-4. Restock and Inquiry tokens: does any character's skill range count?** No. Each token belongs to a specific character (primary or secondary), and only that character's range counts. **Authority:** Community consensus · **Status:** NEW (the app's wording implies it) · [1875678](https://boardgamegeek.com/thread/1875678)
- **SC06-5. What does the "7" planet require?** The two dice must sum to exactly 7. **Authority:** Community consensus · **Status:** NEW · [3656913](https://boardgamegeek.com/thread/3656913), [1875678](https://boardgamegeek.com/thread/1875678)
- **SC06-6. What if I'm not ready to capture on ★★?** Take the alternative instead: +1 info, +1 energy and +1 supply. A failed capture doesn't lose the game, but it drains you. Avoid reaching 15 threat. **Authority:** Community consensus and designer advice · **Status:** NEW · [2296490](https://boardgamegeek.com/thread/2296490), [1875678](https://boardgamegeek.com/thread/1875678)

### 07 Master the Trials! (S2)
- Skill check at each reduction; trial attempt math. **Status:** Already in app FAQ.
- **SC07-1. Is it supposed to be this easy?** Yes, it is the Series II tutorial. The win condition is three trials in order, or reaching the end of training. Pairs that self-combo a lot make it easier still. **Authority:** Community consensus · **Status:** NEW · [2341140](https://boardgamegeek.com/thread/2341140)

### 08 Beat the Odds! (S2)
- Use 5 coins (the scenario side's 6 is wrong); stolen coins can be recovered until they reach X; marking the re-roll track. **Status:** Already in app FAQ · [2226618](https://boardgamegeek.com/thread/2226618)
- **SC08-1. Re-roll track and betting in detail:**
  - ★★ does one of two things: moves a coin back from the thieves, **or** permanently unlocks re-rolls on one of the four numbers. The token is not used up.
  - Re-rolling a 6 or an 8 needs a skill check. Failing it costs 1 health, but you still re-roll.
  - ✓✓ is a bet on <7, 7 or >7. If you hit, you win a coin. If you win on 7, you must bet again. If you miss, you lose 1 health.
  
  **Authority:** Community consensus (summarised from the Button Shy Discord) · **Status:** NEW detail · [2165810](https://boardgamegeek.com/thread/2165810)

### 09 Control the Skies! (S2)
- Placement order, no free move, forced attack, upgrade track, one missile and one shield. **Status:** Already in app FAQ · [2226618](https://boardgamegeek.com/thread/2226618)

### 10 Sell the Junk! (S2)
- Start at $1; the track skips are intentional. **Status:** Already in app FAQ.
- **SC10-1. When the selling fee rises above the price, does anything reset? Do you lose health on every later rise?** Nothing resets until you sell, or until a ★★ barter resets the fee to $0. You lose 1 health only when the fee **first** passes the price. **Authority:** Community consensus · **Status:** NEW · [2357964](https://boardgamegeek.com/thread/2357964)

### 11 Destroy the Order! (S2)
- Laws are mandatory. A law is "used" only by a combo it changes. The source thread's "does result" is a typo, and the app already has it right. **Authority:** Designer-approved (via korossyl's FAQ) plus a community correction · **Status:** Already in app FAQ · [2226618](https://boardgamegeek.com/thread/2226618)

### 12 Serve the Rabble! (S2)
- The role tokens are only markers; see the app for bouncer vs server. **Status:** Already in app FAQ.

### 13 Topple the Giant! (S3)
- No rules threads. The only two threads ask about PnP availability.

### 14 Save the Spacewhales! (S3-14)
- **SC14-1. The !! combo says "roll to see if any spacewhales are lost". What do you roll?** One plain die. If the junk is at least double the roll, you lose a spacewhale and both characters lose 1 health. It is not a skill check. **Authority:** Community consensus (the asker accepted it) · **Status:** NEW · [3028668](https://boardgamegeek.com/thread/3028668)

## 5. Droids and expansions

- **X1. How are Droid Assistants used?** As an optional add-on: add one droid to your team before play. Droids have both helpful and harmful traits. No official droid rules thread exists. **Product:** S1, S2 droid packs · **Authority:** Community consensus · **Status:** NEW · [2107910](https://boardgamegeek.com/thread/2107910)
- **X2. Where can I get the droid cards and tokens?** (availability, not a rule)
  - In 2020 Tagmire posted PnP links for the Series I and Series II droids. Those links later died; the art is in the BGG image gallery, and the files were reposted on the Button Shy Discord.
  - The token art was a free download at PnP Arcade.
  - The deluxe PnP includes the droids.
  
  **Authority:** Designer posted the links; the rest is community · **Status:** NEW · [2466000](https://boardgamegeek.com/thread/2466000), [2482732](https://boardgamegeek.com/thread/2482732), [2328523](https://boardgamegeek.com/thread/2328523), [2193562](https://boardgamegeek.com/thread/2193562)
- Captain Crag, both SYZYGY entries and the Sc.07 wallet have **no forum threads**.

## 6. SYZYGY campaign modes

No rules threads exist in any of the scopes. One review notes that the campaign plays several scenarios in a row with the same characters. Nothing here can check the app's SYZYGY implementation.

## 7. Solo vs 2-handed play

No threads. The game is solo-only. Splitting dice between two characters is mandatory even in "co-op" family play (G1).

## 8. Components and errata

- **E1. Ignore "Recommended With" on scenario cards.** Tagmire said it is purely thematic and "simply wrong", and should be removed in the next printing. The characters were designed for the whole system, not for one scenario. **Product:** S1 · **Authority:** Designer ruling · **Status:** NEW · [2524299](https://boardgamegeek.com/thread/2524299)
- **E2. Saaze's printed card differs from the early promo images** (! vs ✓ on her 1-spot, and extra skill text on her 3-instant). Play the printed card; the promo images were early versions. **Product:** S1 · **Authority:** Designer ruling · **Status:** NEW · [1780743](https://boardgamegeek.com/thread/1780743)
- **E3. Scenario 02 was renamed** from "The Quark Star" to "Confine the Quarks!". **Product:** S1 · **Authority:** Designer-approved (via korossyl's FAQ) · **Status:** NEW · [2226618](https://boardgamegeek.com/thread/2226618)
- **E4. Scenario 08 coin count is 5, not 6.** **Product:** S2 · **Authority:** Designer-approved (via korossyl's FAQ) · **Status:** Already in app FAQ · [2226618](https://boardgamegeek.com/thread/2226618)
- **E5. The Series III rulebook's "Effects may apply" on reduction is an error.** See C-Ztr-1. **Product:** S3 · **Authority:** Community consensus · **Status:** NEW · [3109567](https://boardgamegeek.com/thread/3109567)
- **E6. Deluxe dice sizes:** 16 mm character dice and 12 mm skill dice. **Product:** S1 · **Authority:** Designer ruling · **Status:** NEW (component info) · [1792707](https://boardgamegeek.com/thread/1792707)

## 9. Variants (not official rules)

- Players proposed a variant where, after no combo, you reduce one die and keep the other. Tagmire suggested a softer version instead: "reduce either die and EITHER keep the other OR re-roll it". He warned it makes the game much easier. This is a house rule, not errata. **Product:** All · [2435075](https://boardgamegeek.com/thread/2435075)

---

## Appendix: app entries backed only by korossyl's designer-approved FAQ

These app answers have no separate forum ruling beyond korossyl's FAQ threads ([2226633](https://boardgamegeek.com/thread/2226633), [2226629](https://boardgamegeek.com/thread/2226629), [2226618](https://boardgamegeek.com/thread/2226618)). All match the source.
- Universal re-roll timing.
- Reaction/fatigue sequence (but see Conflict 3).
- Grant can't call two dice rolled together.
- Smiff Focus.
- Zoaze re-rolls.
- Phaeton.
- Scenario 04 entries.
- Scenario 07 entries.
- Scenario 09 entries.
- Scenario 10 entries.
- Scenario 12 entries.
