# FaultTree Mini — Lightweight Fault Tree Analysis Tool

[简体中文](README.md) | English

A **single-file, zero-dependency, open-and-use** fault tree analysis (FTA) tool: draw.io-style drag-and-drop editing + built-in quantitative calculation + local project files + image export. Symbols follow **IEC 61025 / GB/T 4888-2009** conventions, with optional **ARP4761A / AC 25.1309-1B** failure condition classification and probability objective checking. The calculation engine is verified against published examples and public benchmarks.

## Why

Commercial FTA tools (RAM Commander, Isograph FaultTree+, etc.) are powerful but dated, expensive, and heavy-licensed. There is no handy free tool for "quickly draw a tree, quickly get the number". FaultTree Mini fills that gap.

## Features

- **Drag-and-drop editing** with standard FTA symbols: top/intermediate events, basic events, undeveloped events, house events, OR/AND/voting (k/n) gates; orthogonal bus-style connectors
- **Failure data input**: failure rate λ + mission time t (auto q = 1−e^(−λt)) or direct probability; per-hour, per-flight-hour, per-cycle, per-flight bases
- **Quantitative analysis**:
  - OR = 1−∏(1−qᵢ), AND = ∏qᵢ, voting gate exact Poisson-binomial
  - Automatically switches to **ROBDD** (binary decision diagram) exact evaluation when basic events are shared across gates — the same class of method used by SCRAM and FaultTree+
  - Optional ARP4761A failure condition classification with automatic ✓/✗ check against per-flight-hour probability objectives (Catastrophic ≤1E-9, Hazardous ≤1E-7, Major ≤1E-5, Minor ≤1E-3)
- **Local project files** (`.fta.json`), autosave, PNG (2x) / SVG export
- **Large-tree friendly**: zoom toolbar, fit-to-view (F), locate top event (T), middle-drag pan, auto-layout

## Quick Start

No installation — just open [`index.html`](index.html) in a browser (Chrome / Edge recommended). A demo model ("aircraft braking system failure") is built in; the `examples/` folder contains 7 ready-to-open project files including 3 public Aralia benchmarks.

## Verification

- 4 published textbook examples matched exactly
- 300 randomized fault trees (half with shared basic events) vs. exhaustive Boolean enumeration: max error 1.2×10⁻¹⁵
- 3 Aralia public benchmarks (25/49/89 basic events) cross-checked by Monte Carlo simulation

Run the regression suite: `node tests/verify-calc.js`. See [docs/VERIFICATION_EN.md](docs/VERIFICATION_EN.md). Full guides: [Usage](docs/USAGE_EN.md) · [Standards](docs/STANDARDS_EN.md).

## License

[MIT](LICENSE) — free to use, modify, and distribute, including commercial use.

## Support

If this tool saved you time, buying the author a coffee is appreciated (entirely voluntary — the tool works the same without it):

- China: WeChat reward QR code below in the [Chinese README](README.md#赞赏) (official WeChat tipping code, fee-free)
- International: PayPal — send to account `songlike163@hotmail.com` (this email also works for contacting the author)

All features are free forever; no paid features, no ads.
