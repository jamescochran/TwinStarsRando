#!/usr/bin/env python3
"""Generate the #faqModal markup and FAQPage JSON-LD from faq_data.py and
splice them into index.html between <!-- FAQ MODAL --> and <!-- DICE ROLLER MODAL -->."""
import html, json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from faq_data import AUTH, GENERAL, DICE, CHARACTERS, SCENARIOS, DROIDS, ERRATA

INDEX = sys.argv[1]
esc = lambda s: html.escape(s, quote=True)
all_entries = []

def item(e, ind="      "):
    all_entries.append(e)
    label, desc = AUTH[e["auth"]]
    attrs = ""
    if e["for_"]: attrs += f' data-faq-for="{" ".join(e["for_"])}"'
    if e["common"]: attrs += ' data-faq-common=""'
    srcs = e["src"]
    if len(srcs) == 1:
        links = f'<a href="https://boardgamegeek.com/thread/{srcs[0]}" target="_blank" rel="noopener">Source<span class="sr-only"> (BoardGameGeek thread)</span></a>'
    else:
        links = "Sources: " + " ".join(
            f'<a href="https://boardgamegeek.com/thread/{s}" target="_blank" rel="noopener"><span class="sr-only">BoardGameGeek thread </span>{i}</a>'
            for i, s in enumerate(srcs, 1))
    return (f'{ind}<details class="faq-item"{attrs}>\n'
            f'{ind}  <summary>{e["q"]}</summary>\n'
            f'{ind}  <div class="faq-answer">{e["a"]}\n'
            f'{ind}    <p class="faq-meta"><span class="faq-badge faq-badge-{e["auth"]}" title="{esc(desc)}"><span class="sr-only">Authority: </span>{label}</span> <span class="faq-sources">{links}</span></p></div>\n'
            f'{ind}</details>\n')

def none_note(text, ind="      "):
    return f'{ind}<p class="faq-none">{text}</p>\n'

def section(sid, title, body):
    return (f'    <section class="faq-section" aria-labelledby="faq-s-{sid}">\n'
            f'      <h3 class="faq-section-header" id="faq-s-{sid}">{title}</h3>\n{body}    </section>\n\n')

def group(anchor, cls, title, entries, empty_text):
    out = f'      <div class="faq-group" data-faq-group="{anchor}">\n        <h4 class="{cls}" id="{anchor}">{esc(title)}</h4>\n'
    if entries:
        out += "".join(item(e, "        ") for e in entries)
    else:
        out += none_note(empty_text, "        ")
    return out + "      </div>\n"

parts = []
parts.append(section("general", "General rules", "".join(item(e) for e in GENERAL)))
parts.append(section("dice", "Dice &amp; skill checks", "".join(item(e) for e in DICE)))
chars = sorted(CHARACTERS, key=lambda c: c[0].strip('"').lower())
body = ""
for name, anchor, entries in chars:
    extra = " The Captain Crag rulebook is under Rules at the bottom of the page." if name == "Captain Crag" else ""
    body += group(anchor, "faq-char-header", name, entries,
                  f"No rulings specific to {esc(name)} have been published yet. The general rules above apply.{extra}")
parts.append(section("characters", "Characters", body))
body = ""
for num, title, entries in SCENARIOS:
    empty = (f"No rulings for {esc(title)} have been published yet; its BoardGameGeek forum only has print-and-play availability threads. The general rules apply."
             if num == "13" else "No rulings published yet.")
    body += group(f"faq-sc-{num}", "faq-scenario-header", f"Scenario {num}: {title}", entries, empty)
parts.append(section("scenarios", "Scenarios", body))
parts.append(section("droids", "Droid Assistants", "".join(item(e) for e in DROIDS)))
parts.append(section("syzygy", "SYZYGY campaigns",
    none_note("No SYZYGY campaign rulings have been published on BoardGameGeek yet. Follow the SYZYGY rulebooks under Rules at the bottom of the page.")))
parts.append(section("errata", "Components &amp; errata", "".join(item(e) for e in ERRATA)))

modal = f'''<!-- FAQ MODAL -->
<div class="modal-overlay" id="faqModal">
  <div class="faq-box" role="dialog" aria-modal="true" aria-labelledby="faqModalTitle">
    <div class="dialog-header">
      <h2 id="faqModalTitle">Rules FAQ</h2>
      <button type="button" class="dialog-close" id="faqClose" aria-label="Close Rules FAQ">✕</button>
    </div>
    <div class="faq-search" role="search">
      <label for="faqSearch" class="faq-search-label">Search rulings</label>
      <input type="search" id="faqSearch" class="faq-search-input" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="e.g. Bood, re-roll, Hunt the Bounty" aria-describedby="faqSearchStatus">
      <p class="faq-search-status" id="faqSearchStatus" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
    <div class="faq-content" tabindex="-1">
    <p class="faq-credit">Rulings from designer Jason Tagmire on <a href="https://boardgamegeek.com/boardgame/231854/twin-stars-adventure-series-i/forums/0" target="_blank" rel="noopener">BoardGameGeek</a> and korossyl's community FAQ (<a href="https://boardgamegeek.com/thread/2226633" target="_blank" rel="noopener">general</a>, <a href="https://boardgamegeek.com/thread/2226629" target="_blank" rel="noopener">characters</a>, <a href="https://boardgamegeek.com/thread/2226618" target="_blank" rel="noopener">scenarios</a>), which states every answer was approved by the designer. Each answer is labelled with who made the ruling and links to its source thread. Unofficial and paraphrased.</p>
    <div class="faq-mission" id="faqMission" hidden></div>
    <div class="faq-empty" id="faqEmpty" hidden></div>
    <div class="faq-all" id="faqAll">

{"".join(parts)}    </div>
    </div>
  </div>
</div>
'''

def plain(h):
    t = re.sub(r"<li>", " ", h)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()

ld = {"@context": "https://schema.org", "@type": "FAQPage",
      "name": "Twin Stars Adventure Series rules FAQ",
      "mainEntity": [{"@type": "Question", "name": plain(e["q"]),
                      "acceptedAnswer": {"@type": "Answer", "text": plain(e["a"])}} for e in all_entries]}
_q = [json.dumps(q, ensure_ascii=False) for q in ld["mainEntity"]]
_head = json.dumps({k: v for k, v in ld.items() if k != "mainEntity"}, ensure_ascii=False)[:-1]
ld_json = (_head + ', "mainEntity": [\n' + ",\n".join(_q) + "\n]}").replace("</", "<\\/")
modal += f'<script type="application/ld+json" id="faqJsonLd">\n{ld_json}\n</script>\n\n'

src = open(INDEX, encoding="utf-8").read()
a = src.index("<!-- FAQ MODAL -->"); b = src.index("<!-- DICE ROLLER MODAL -->")
open(INDEX, "w", encoding="utf-8").write(src[:a] + modal + src[b:])
print("entries:", len(all_entries))
