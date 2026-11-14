# Usage Guide

语言 / Language: [简体中文](USAGE.md) | **English**

## 1. Launch

Open `index.html` in a browser (Chrome / Edge recommended). No installation, no network, no account. All data stays local.

## 2. Layout

```
┌──────────┬──────────────────────────────┬──────────┐
│ Palette  │        Canvas (SVG)          │  Props   │
│ (left)   │  zoom toolbar bottom-right   │  (right) │
└──────────┴──────────────────────────────┴──────────┘
Status bar: node count · edge count · top-event result · messages
```

## 3. Draw a Tree (three steps)

1. **Drag nodes** from the palette:

   | Symbol | Name | Purpose |
   |---|---|---|
   | Rectangle | Top / Intermediate event | Failure state under analysis; probability derived from inputs |
   | Circle | Basic event | Leaf event — enter failure data here |
   | Diamond | Undeveloped event | Minor impact or insufficient info; not expanded |
   | House | House event | Deterministic state (true q=1 / false q=0) for boundary conditions & what-if |
   | D-shape | AND gate | Output occurs only if ALL inputs occur |
   | Shield | OR gate | Output occurs if ANY input occurs |
   | Shield + k/n | Voting gate | At least k of n inputs occur |

2. **Connect**: drag the **small dot at the bottom** of a parent node onto a child node. Each node has a single parent; cycles are detected and blocked automatically. Sibling edges share **orthogonal bus-style routing**, matching traditional FTA drawing conventions.

3. **Enter data**: click a basic event and use the properties panel:
   - **Rate mode**: λ (per hour) + mission time t (hours), auto-converted q = 1−e^(−λt); time bases: per-hour, per-flight-hour, per-cycle, per-flight
   - **Probability mode**: enter q (0–1) directly
   - Name and failure-mode description editable anytime

## 4. Calculation

Click **Calculate** in the toolbar:

- OR gate: q = 1 − ∏(1−qᵢ)
- AND gate: q = ∏qᵢ
- Voting gate: exact Poisson-binomial (dynamic programming)
- Top/intermediate events: probability derived from inputs (single input passes through; multiple inputs merged as OR)
- **Shared basic events**: when a basic event is referenced by multiple gates, the tool automatically switches to **ROBDD** exact evaluation — the naive independence formulas would be wrong in that case

After calculation, each node shows a `P=` badge; the top-event probability appears in the status bar.

### ARP4761A Classification Check

Select the **top event** and pick a failure condition class. The result is automatically checked against AC 25.1309-1B per-flight-hour objectives:

| Class | Objective (per flight hour) |
|---|---|
| Catastrophic | ≤ 1×10⁻⁹ |
| Hazardous | ≤ 1×10⁻⁷ |
| Major | ≤ 1×10⁻⁵ |
| Minor | ≤ 1×10⁻³ |

⚠ Use **per-flight-hour** figures for the comparison (set mission time = 1). Pass shows green ✓; exceedance shows red ✗.

## 5. Canvas Navigation (large trees)

| Action | How |
|---|---|
| Zoom | Mouse wheel (cursor-anchored); −/＋ buttons; `+` `-` `0` keys |
| Fit to view | "⤢ Fit" button or `F` |
| Locate top event | "⌖ Top" button or `T` |
| Pan | Middle-drag anywhere, or drag blank canvas |
| Auto-layout | Toolbar "Auto layout" (auto-fits afterwards) |

Recommended flow for large trees: auto-layout → `F` for overview → wheel to zoom into details → `T` to return to top.

## 6. Save & Open

- `Ctrl+S` / Save: writes a `.fta.json` project file. In Chrome/Edge, subsequent saves write back to the same file; other browsers download a copy
- `Ctrl+O` / Open: reopen a project for editing
- Unsaved work is autosaved to localStorage and restored on next open

## 7. Export

- **PNG**: 2x resolution, auto-cropped margins
- **SVG**: vector, editable in Visio / Illustrator / draw.io

## 8. FAQ

**Q: No P= badges?** — Click Calculate first; badges appear only for computed nodes.

**Q: ⚠ message in the status bar?** — Typical: a top/intermediate event has no input (treated as 0), or has multiple direct children (merged as OR). Add a gate as suggested.

**Q: "cycle detected" error?** — Your tree contains a loop (A→B→A). Check the connections.

**Q: How to set voting k/n?** — Select the gate and set k (required events) and n (total inputs) in the properties panel; n should match the actual input count.

**Q: Browser support?** — Chrome / Edge recommended (write-back save). Firefox works but saves as a downloaded copy.
