# Codon Optimizer for *Acinetobacter baylyi* — Implementation Plan

## Goal

Build a single-page tool as a **standalone HTML file** to be served from a **Zola static site**. The tool should:

1. Accepts an amino acid sequence (single-letter codes) in a text box
2. Reverse-translates it into a DNA sequence using **optimal codons for *A. baylyi* ADP1**
3. Displays the resulting nucleotide sequence in a copyable output box

---

## Method: Frequency-Weighted Codon Selection

Use a **codon usage frequency table** derived from the *A. baylyi* ADP1 genome. For each amino acid, select the codon with the **highest relative usage frequency** (i.e., the most-used codon for that residue in native *A. baylyi* genes). This is the standard "one-best-codon" approach used by most simple codon optimizers (IDT, GenScript, etc.).

### Where the codon table comes from

The user will supply one of:

- A **codon usage table** (e.g., from the Kazusa Codon Usage Database for *A. baylyi* ADP1, organism ID 62977), OR
- The **full genome FASTA** from which we compute codon frequencies by scanning all annotated CDS regions

If the user provides a raw frequency table, parse it directly. If they provide a genome, count codons across all open reading frames and normalize per amino acid.

### Fallback table

If no user data is provided, embed a hardcoded codon usage table for *A. baylyi* ADP1 sourced from Kazusa or the literature. The app should still work out of the box.

---

## Architecture — Zola Integration

This is a **Zola static site**. No npm, no React, no build step. The tool is a **single self-contained HTML file** with all JS and CSS inline, served as a Zola page.

### File placement

```
your-zola-site/
├── config.toml
├── content/
│   └── tools/
│       └── codon-optimizer.md    # Zola content file (frontmatter + shortcode/raw HTML)
├── templates/
│   └── tools.html               # (optional) custom template for tool pages
├── static/
│   └── js/
│       └── codon-optimizer.js   # (alternative) external JS if you prefer
└── ...
```

### Two approaches (pick one)

**Option A — Inline HTML in a Zola page (simplest)**
Create `content/tools/codon-optimizer.md` with Zola frontmatter, then use a `{% raw %}` block or a custom shortcode to embed the full HTML/JS tool inline. All JavaScript lives inside `<script>` tags in that file.

**Option B — Standalone HTML in `static/`**
Place a complete `codon-optimizer.html` in the `static/` directory. It's served as-is at `/codon-optimizer.html`. No Zola templating, but also no site nav/styling integration.

**Recommendation: Option A** — keeps the tool inside your site's layout and nav.

### Key constraints
- **No build tooling.** Vanilla JS only — no imports, no modules, no npm.
- **No external dependencies.** Everything is self-contained.
- **All logic in a single `<script>` block** (or one external `.js` file in `static/js/`).

---

## Data Structure: Codon Table

Create a JavaScript object mapping each amino acid (single-letter code) to its **optimal codon** (the one with the highest frequency in *A. baylyi*).

```js
// All of this lives inside a single <script> tag in the page

const OPTIMAL_CODONS = {
  A: "GCC",  // Ala — fill in actual best codon from data
  R: "CGC",  // Arg
  N: "AAC",  // Asn
  D: "GAC",  // Asp
  C: "TGC",  // Cys
  E: "GAA",  // Glu
  Q: "CAG",  // Gln
  G: "GGC",  // Gly
  H: "CAC",  // His
  I: "ATC",  // Ile
  L: "CTG",  // Leu
  K: "AAA",  // Lys
  M: "ATG",  // Met (only codon)
  F: "TTC",  // Phe
  P: "CCC",  // Pro
  S: "AGC",  // Ser
  T: "ACC",  // Thr
  W: "TGG",  // Trp (only codon)
  Y: "TAC",  // Tyr
  V: "GTG",  // Val
  "*": "TAA", // Stop — most common stop codon in A. baylyi
};
```

> **IMPORTANT**: The exact best codons above are **placeholders**. Replace every value with the actual highest-frequency codon from the *A. baylyi* data the user provides. The user should verify these against their source before deploying.

### Optional: Full frequency table

For a more advanced version, also store the full frequency distribution so the user can later add features like:

- Weighted-random codon selection (to avoid codon monotony in long sequences)
- Codon Adaptation Index (CAI) scoring of input sequences
- Rare codon flagging

```js
const CODON_FREQUENCIES = {
  A: { GCT: 0.18, GCC: 0.40, GCA: 0.22, GCG: 0.20 },
  R: { CGT: 0.12, CGC: 0.35, CGA: 0.08, CGG: 0.10, AGA: 0.15, AGG: 0.20 },
  // ... etc for all 20 amino acids + stop
};
```

---

## Core Logic

All logic lives in the same `<script>` block as the codon table. No imports or modules.

```js
/**
 * Reverse-translate an amino acid sequence to DNA using optimal A. baylyi codons.
 * @param {string} aaSequence - Amino acid sequence (single-letter, uppercase)
 * @param {object} options
 * @param {boolean} options.addStop - Append a stop codon (default true)
 * @returns {{ dna: string, errors: string[] }}
 */
function optimizeSequence(aaSequence, { addStop = true } = {}) {
  const cleaned = aaSequence
    .toUpperCase()
    .replace(/\s+/g, "")       // strip whitespace
    .replace(/[^ARNDCEQGHILKMFPSTWYV*]/g, (match) => {
      // flag invalid characters
      return `?${match}?`;
    });

  const errors = [];
  const codons = [];

  for (const char of cleaned) {
    if (char === "?" || !OPTIMAL_CODONS[char]) {
      // skip error markers or unknown residues
      continue;
    }
    codons.push(OPTIMAL_CODONS[char]);
  }

  // Check for invalid residues
  const invalid = [...aaSequence.toUpperCase().replace(/\s/g, "")]
    .filter((c) => !OPTIMAL_CODONS[c] && c !== "*");
  if (invalid.length > 0) {
    errors.push(`Unknown residues ignored: ${[...new Set(invalid)].join(", ")}`);
  }

  let dna = codons.join("");

  if (addStop && !aaSequence.trim().endsWith("*")) {
    dna += OPTIMAL_CODONS["*"];
  }

  return { dna, errors };
}
```

---

## UI Requirements

### Input area
- Large `<textarea>` for pasting amino acid sequences
- Accept FASTA format (strip header lines starting with `>`) or plain sequence
- Strip numbers, spaces, newlines automatically
- Show character count (amino acids) below the input

### Output area
- Read-only `<textarea>` or `<pre>` block showing the optimized DNA sequence
- Show nucleotide count and confirm it equals `(amino acids × 3) + 3` if stop was added
- **Copy to clipboard** button (use `navigator.clipboard.writeText()`)
- Optional: format output in lines of 60 or 80 characters for readability

### Controls
- "Optimize" button to run the conversion
- Checkbox: "Add stop codon" (default: checked)
- Checkbox: "Output as FASTA" (wraps output in `>optimized_sequence\n...`)
- Optional: dropdown to choose line width (60, 80, no wrap)

### Validation / feedback
- Show warning if input contains non-standard amino acid characters
- Show error if input is empty
- Display sequence stats: AA count, NT count, GC content (%)

---

## Step-by-Step Implementation Checklist

1. **Create the Zola content file** — Create `content/tools/codon-optimizer.md` with appropriate frontmatter (`title`, `template` if using a custom one, `date`, etc.). Use Zola's `{% raw %}` block or a shortcode to embed raw HTML.
2. **Populate the codon table** — Parse the user's *A. baylyi* codon usage data and populate `OPTIMAL_CODONS` with the highest-frequency codon per amino acid. If the user supplies a Kazusa-format table, write a small parser script. If they supply a genome FASTA + GFF, write a codon-counting script (Python).
3. **Implement `optimizeSequence()`** — Core reverse-translation function, inline in a `<script>` tag.
4. **Build the UI** — HTML input textarea, output textarea, buttons, stats display — all inside the same content file or template.
5. **Wire it up** — On button click (or live as-you-type), call `optimizeSequence()`, display result.
6. **Add copy-to-clipboard** — Button that copies the DNA output.
7. **Add FASTA parsing** — Strip `>` header lines from input if present.
8. **Add GC content calculation** — Count G+C in output, display as percentage.
9. **Style it** — Inline `<style>` block. Monospace font for sequences. Keep it consistent with the existing Zola site theme if possible (reuse CSS variables/classes from the site's base template).
10. **Test locally** — Run `zola serve`, visit the page, verify with known sequences (e.g., GFP).

---

## Codon Table Generation (if user provides genome data)

If the user provides a genome FASTA + annotation (GFF/GenBank), compute the codon table with a helper script:

```
# Python pseudocode
1. Parse GFF for CDS features
2. Extract each CDS nucleotide sequence from the FASTA
3. Split each CDS into codons (triplets)
4. Count occurrences of each codon
5. Group by amino acid (using standard genetic code)
6. For each amino acid, pick the codon with the highest count
7. Output as JSON: { "A": "GCC", "R": "CGT", ... }
```

This script only needs to run once. Its output (the JSON map) gets pasted into `codonTable.js`.

---

## Notes

- **This is a deterministic one-best-codon optimizer.** Every instance of the same amino acid always gets the same codon. This is fine for most synthetic biology use cases. If the user later wants stochastic/weighted selection to reduce sequence repetitiveness, the `CODON_FREQUENCIES` table supports that as a future enhancement.
- **No backend required.** Everything runs client-side in the browser. Zola just serves the static page.
- **Zola compatibility.** The tool is plain HTML/JS inside a Zola content page. No build tools, no npm, no external dependencies. It should work with any Zola theme — just make sure the template renders the page body content (most do by default).
- **The codon table is the single source of truth.** Swapping species is as simple as replacing the `OPTIMAL_CODONS` object with a different organism's frequencies.
