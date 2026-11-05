# Twin Stars Rule Card Reference

Extracted text from the physical rule card scans in this directory. Source images are the original PNG files; this document preserves the content in case the images are unavailable.

## Image files

- `*.png` are the full-resolution originals (~7 MB each). The app only falls back to them in
  browsers without AVIF/WebP support.
- `*.avif` and `*.webp` are 1600 px wide copies the app actually shows (`<picture>` picks
  AVIF, then WebP, then PNG). AVIF set: ~0.74 MB for four books, WebP set: ~1.15 MB, versus
  29 MB of PNG. Budgets are enforced by `tests/e2e/rulebooks.spec.js`.
- Regenerate them after replacing a PNG (needs Node and `sharp`, installed outside the repo):

  ```sh
  npm install --prefix /tmp/rules-tools sharp
  NODE_PATH=/tmp/rules-tools/node_modules node -e '
    const sharp = require("sharp");
    for (const b of process.argv.slice(1)) {
      const img = () => sharp(`rules/${b}.png`).resize({ width: 1600, kernel: "lanczos3" });
      img().avif({ quality: 55, effort: 6, chromaSubsampling: "4:4:4" }).toFile(`rules/${b}.avif`);
      img().webp({ quality: 80, effort: 6, smartSubsample: true }).toFile(`rules/${b}.webp`);
    }' twinstars1 twinstars1-syzygy twinstars2 twinstars2-syzygy
  ```

  Then add `optimized: true` to the book in `RULEBOOK_TABS` (app.js) and bump `RULES_CACHE`
  in service-worker.js so installed apps fetch the new files.

### Known problem: `twinstars-crag.png` is truncated

The committed file stops at exactly 1,920,000 bytes (no IEND chunk; rows ~810-1024 of 1025
are missing). It has been that way since it was first added (commit a7efc03); there is no
complete copy in git history. Browsers still fire `load` for it, so the app now checks the
bytes (in the service worker) and shows "this rulebook image is incomplete" with a link to the
publisher's file instead of a cut-off sheet. No AVIF/WebP was generated from it on purpose.

**Owner action:** download the official file "Official rules (Button Shy)" (`twinstars-crag.png`,
2,353,834 bytes, provided by the publisher) from
https://boardgamegeek.com/filepage/217405/official-rules-button-shy (needs a BGG login), replace
`rules/twinstars-crag.png`, generate its AVIF/WebP as above, add `optimized: true` to the Crag tab,
remove the Crag `official` link if desired, update `KNOWN_TRUNCATED` in
`tests/e2e/rulebooks.spec.js`, and bump `RULES_CACHE`.

---

## twinstars1.png — Series 1 Base Game

**Components (provided):** 6 Scenario Cards, 12 Character Cards
**Not provided:** 2 Character Dice, 2 Skill Check Dice, 2 Coins/Tokens per character for health tracking, additional coins/tokens for specific scenarios

**Setup:** Choose a scenario and set up the card with tokens as described. Choose any two characters to play with and place them in front of you. The character on the left is the **PRIMARY** character; the other is **SECONDARY**. Some scenarios use this designation.

**How to Play:** Read the scenario for its specific rules and win condition. Each scenario card has a list of icon combos. To advance, you must form these combos using the dice and icons on each of your characters.

**Roll Dice:** At the start of the game and any point that one or both Character Dice are not placed on characters, roll all unplaced Character Dice and place them each on a character. Order of placement matters.

**Place Dice:** Place one Character Die on each character, one at a time. When you place the first die, Instants or Effects may activate based on the die roll — resolve them immediately.

- **INSTANT** — ability that occurs as a single die is placed. *Instants are optional.*
- **EFFECT** — ability that occurs as a single die is placed. *Effects are required.*

When you place your second Character Die, Instants, Effects, AND Combos may occur. Resolve Instants and Effects before Combos unless stated otherwise.

**Check for Combos:** When both Character Dice have been placed and all instants and effects resolved, check for a Combo. Combos are a combination of icons shown once both Character Dice are placed, defined on the Scenario Card. **Combos are required unless stated otherwise.**

- **If a Combo occurs:** Take the action shown on the Scenario Card. Take both Character Dice back to your hand and start over at Roll Dice.
- **If a Combo does not occur:** Reduce a die on a character by one and take the other character's die back to your hand. Instants and Effects are NOT activated by this reduction.

**REACTION** — ability that occurs after a die is reduced to this value as a result of not making a combo. Occurs before you take back the other character's die; may result in a combo before re-rolling. *Reactions are optional.*

**FATIGUE** — ability that occurs after a die is reduced to this value as a result of not making a combo. Occurs before you take back the other character's die; may result in a combo before re-rolling. *Fatigues are required.*

> NOTE: If you must reduce a die below 1, you must take the ⚡ combo action for that scenario.

**Repeat:** Continue rolling, placing, and reducing Character Dice until you meet the win condition, lose condition, or until one of your characters is reduced to zero health.

**Additional Rules:**

- **Special Actions** — each character has a special action only they can use, activated by paying the listed cost (most commonly energy ⚡). There is also a Basic Special Action usable by any character: *Re-roll one die.*
- Each scenario has a set amount of energy provided for Easy, Medium, and Hard versions.
- **Skill Checks** — die rolls to see if a character takes a negative effect; occur when stated in the scenario. Roll two Skill Check Dice; each die must fit within each character's Skill Check range.
  - Both fit = success
  - Both do not fit = failure; result listed as `[SKILL ❤️]` = reduce the health of a character of your choice by 1
  - **Focus** — if a character has a Focus ability and uses their focus die value as part of a successful Skill Check, they gain the bonus listed next to the Focus ability.

Design: Jason Tagmire & Mike Mullins | Artwork: Luke Milton | Rules: buttonshygames.com

---

## twinstars2.png — Series 2

**Components (provided):** 6 Scenario Cards, 12 Character Cards
**Not provided:** 2 Character Dice, 2 Skill Check Dice, 2 Coins/Tokens per character for health tracking, additional coins/tokens for specific scenarios

Rules are identical to Series 1 with the following additions:

**New Keywords:**

- **FATIGUE** — ability that occurs when a die is reduced after not making a combo. If the reduced die lands on a Fatigue ability, you MUST take it.
- **REACTION** — ability that occurs after a die is reduced as a result of not making a combo. Reactions are optional.

**Cross-series play:** Fully combinable with Series I. Mix any characters and scenarios freely — e.g., bring Saaze and Bood from Series I and have them Sell the Junk in Series II, or have Gari Obul and Phaeton try to Rule The World.

**Turn order summary:**
1. Roll Dice
2. Place Dice → resolve Instants (optional) → resolve Effects (required)
3. Check for Combos
   - **If combo:** activate → start over
   - **If no combo:** reduce a die → resolve Reactions (optional) → resolve Fatigues (required) → roll and place the other

Design: Jason Tagmire & Mike Mullins | Artwork: Luke Milton | Rules: buttonshygames.com

---

## twinstars1-syzygy.png — Series 1 SYZYGY Mode

**Requires:** Twin Stars: Adventure Series I

**Theme:** Three adventurers are in debt to the Grosksh and must pay it off by taking jobs across the universe. The Grosksh send Enforcers to "remind" you — survive the week and scrape together the money.

*Featured NPC: Zoaze, a Grosksh from the Outer Crust.*

**Setup:**
- Choose 3 characters. Set all to half health, rounded up.
- You control all three, but only use two in each scenario — the third sits out and heals to full health while benched.

**Campaign Structure:** 4 scenarios in a branching path:
- **A** (fixed start) → choose **B or C** (player's choice, complete only one) → **D** (fixed end)

**Select your two characters** for the first scenario; the third sits out and heals to full.

**Apply Resources:** Start each scenario with 5 resources, distributable freely as ❤️ or ⚡. Cannot exceed the max ⚡ shown on the scenario card.

**Complete a Scenario:** When finished, review unused ❤️ and ⚡ — both carry over to the next stage.

**Winning a Scenario:** Proceed to the next. In sections B and C you choose left or right; you don't need to complete both.

**Losing a Scenario:** Retry with only 3 resources. A character reduced to 0 HP is permanently removed from the campaign. Lose a second scenario = game ends.

**End of Game:** Complete the ending scenario, or lose twice.

**Rankings:**
| Result | Rank |
|--------|------|
| All 4 scenarios, 0 losses | **LEGENDS** — word spreads across the galaxy; there's apparently a song |
| All 4 scenarios, 1 loss | **FREE** — debt paid off; where's your next adventure? |
| 3 scenarios completed | **ALIVE** — the Grosksh aren't about to waste a perfectly good servant |
| Fewer than 3 scenarios | **GROSKSH'D** |

Design: Mike Mullins | Artwork: Luke Milton | buttonshygames.com

---

## twinstars2-syzygy.png — Series 2 SYZYGY Mode (Waypoint)

**Requires:** Twin Stars: Adventure Series (I or II)

**Theme:** You've escaped debt but you're stranded on the other side of the universe. Waypoint access codes are one-time use and hard to come by. Trekking across the universe, taking any job you can, hoping to earn fast credits — and make it out alive.

*Featured NPC: Rollie, your waypoint codemaster.*

**Setup:**
- Choose 3 characters. Set all to half health, rounded up.
- Shuffle all 6 scenario cards into a random lineup of 3.
- Only 2 characters play each scenario; the third sits out and heals to full.

**Campaign Structure:** 3-scenario linear path.
- **Win** → follow black arrows forward
- **Lose** → follow red arrows (alternate path)
- 3 wins in a row = win the game
- Lose 2 characters OR lose any bottom-row scenario = game over

**Apply Resources:** 5 resources per scenario, distributable as ❤️ or ⚡. Unused resources carry over.

**Rankings:**
| Result | Rank |
|--------|------|
| 3 scenarios, 0 losses | **LOADED** — the only thing that slowed you down was all the loot you brought home |
| 3 scenarios, 1 loss | **SAFE** — home with one nifty new scar |
| 3 scenarios, 2 losses | **BACK TO SQUARE ONE** — home, broken, and broke, but home |
| Did not make it home | Lost in the universe |

Design: Mike Mullins | Artwork: Luke Milton | buttonshygames.com

---

## twinstars-crag.png — Captain Crag Promo

**Character flavour:** Captain Crag navigates starships for the Dynasty. Natural among the stars, even better at avoiding his job. You'll find him off looking for some made-up tool for hours, with a 528-Z Longnose coasting on autopilot. Nobody works as hard as him to not work.

But when the stars align, Crag will take control — save the crew, then disappear before anyone can thank him, co-worker covering for him. Almost comical... if his job wasn't so crucial.

**New keywords (also introduced in Series II):**

- **FATIGUE** — ability that occurs when a die is reduced after not making a combo. If the reduced die lands on a Fatigue ability, you MUST take it.

*No new scenarios included. Tremendous hat.*
