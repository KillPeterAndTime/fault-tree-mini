# Standards Alignment

语言 / Language: [简体中文](STANDARDS.md) | **English**

This document records the standards that FaultTree Mini follows or references for its graphics and quantitative checks, so the tool can be traced to authority in formal settings (reviews, audits, training).

## 1. Graphical symbols

### Conventions followed

| Symbol in this tool | Name | Basis |
|---|---|---|
| Rectangle | Top / Intermediate event | IEC 61025:2006 Annex A; GB/T 4888-2009 §2; NUREG-0492 |
| Circle | Basic event | same |
| Diamond | Undeveloped event | same |
| House (pentagon) | House event (normal event) | GB/T 4888-2009 normal-event symbol; IEC 61025 house event |
| D-shape (flat bottom + semicircular top) | AND gate | common convention |
| Shield (convex top + concave bottom) | OR gate | common convention |
| Shield + k/n label | Voting gate k/n | GB/T 4888-2009 voting gate; IEC 61025 k-out-of-n |

### On symbol rigidity

IEC 61025:2006 Clause 4 states that symbols may vary with user preference and software; Annex A is informative, not normative. This tool uses the conventional shapes accepted by reviewers and used by textbooks and commercial tools. GB/T 4888-2009 provides the authoritative Chinese terminology and symbols, which this tool follows (顶事件/中间事件/底事件/基本事件/未探明事件/正常事件, etc.).

### Not yet implemented

- Transfer symbols (triangles, for splitting large trees across pages)
- INHIBIT gate (requires a conditioning event, ellipse symbol)
- PAND (priority AND), XOR, NOT (non-coherent logic)
- All are on the roadmap; large trees can currently be split into separate project files

## 2. Quantitative checks

### ARP4761A / AC 25.1309-1B failure condition objectives

The top event can carry a failure condition classification; results are checked automatically against per-flight-hour objectives:

| Failure condition class | Objective (per flight hour) |
|---|---|
| Catastrophic | ≤ 1×10⁻⁹ (no single-point failures also required — a qualitative check to be performed manually) |
| Hazardous | ≤ 1×10⁻⁷ |
| Major | ≤ 1×10⁻⁵ |
| Minor | ≤ 1×10⁻³ |
| No safety effect | no quantitative objective |

**Usage notes**:

1. Comparisons must use **per-flight-hour** figures — set mission time = 1, or enter probabilities per flight hour directly
2. ARP4754A defines the development process and failure-condition allocation (FHA→PSSA→SSA); ARP4761A provides the methods including FTA. This tool covers the ARP4761A FTA method step
3. In certification practice, FTA supports the SSA quantitatively; final acceptability is determined by the authority. **This tool is an analysis aid, not a substitute for the full safety assessment process or certification credit**

## 3. Public references

- IEC 61025:2006 *Fault tree analysis (FTA)*
- GB/T 4888-2009 *Terms and symbols for fault tree* (replacing GB/T 4888-1985)
- NUREG-0492 *Fault Tree Handbook* (U.S. NRC, 1981)
- AC 25.1309-1B *System Design and Analysis* (per the Dec 2023 revision)
- SAE ARP4754A / ARP4761A
- Aralia fault tree benchmark suite (distributed via the SCRAM project)
