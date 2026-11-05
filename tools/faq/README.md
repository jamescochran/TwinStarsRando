# FAQ generator

The Rules FAQ (`#faqModal` in `index.html`) and its `FAQPage` JSON-LD are generated from `faq_data.py`.

Edit entries in `faq_data.py`, then regenerate:

```
python3 tools/faq/gen.py index.html
```

The script replaces everything between `<!-- FAQ MODAL -->` and `<!-- DICE ROLLER MODAL -->`. Don't hand-edit that region: `tests/e2e/faq.spec.js` fails if the JSON-LD questions drift from the visible ones.

Entries are paraphrased from designer rulings (Jason Tagmire on BoardGameGeek) and korossyl's community FAQ threads; each links its source thread. Authority labels are defined in `AUTH`.
