# Verification of the Calculation Engine

语言 / Language: [简体中文](VERIFICATION.md) | **English**

The quantitative calculations are backed by three reproducible verification layers:

```bash
node tests/verify-calc.js
```

## Layer 1: Published examples

| Example | Structure | Expected (published) | Tool result |
|---|---|---|---|
| Dual-pump redundancy (NUREG-0492 style) | AND(0.01, 0.01) | 1.0E-4 | 1.000000E-4 ✓ |
| Unplanned line stoppage (CSSBB tutorial) | OR(AND(0.02,0.05), OR(0.01,0.004)) | 0.014946 | 1.494604E-2 ✓ |
| Controller + two actuators (textbook) | OR(0.02, AND(0.10, 0.05)) | 0.0249 | 2.490000E-2 ✓ |
| Classic 2oo3 voting (p=0.1) | Voting gate 2/3 | 0.028 | 2.800000E-2 ✓ |

Rate conversion also verified: λ=1e-5/h, t=10000h → q=1−e^(−0.1)=0.095163, exact match.

## Layer 2: Randomized fuzz testing vs. exhaustive enumeration

300 random fault trees are generated (mixed OR/AND/voting gates, **half with shared basic events**). Each tree is computed two ways:

- **Tool engine**: independence recursion for trees without shared events; automatic ROBDD switch when shared events are detected
- **Exact reference**: exhaustive enumeration of all basic-event state combinations (2ⁿ truth enumeration) — assumption-free and mathematically exact

**Result: all 300 trees pass with a maximum absolute error of 1.2×10⁻¹⁵ (floating-point precision level).**

> Historical note: an early version was systematically wrong when basic events were shared across gates (the independence recursion treats repeated occurrences as independent events). Monte Carlo cross-checking exposed a 15σ deviation, which led to the BDD implementation.

## Layer 3: Aralia public benchmarks vs. Monte Carlo

The [Aralia benchmark suite](https://github.com/rakhimov/scram/tree/develop/input/Aralia) (distributed via the SCRAM project) is a widely recognized FTA verification set. Convert the Open-PSA files with `scripts/openpsa-convert.js`, then compute:

| Benchmark | Size | Exact top probability (this tool) | Monte Carlo |
|---|---|---|---|
| chinese | 61 nodes / 25 basic events | 1.76×10⁻⁹ | Consistent (probabilities ×500 for statistical power) ✓ |
| das9202 | 122 nodes / 49 basic events | 1.02×10⁻²⁵ | Consistent ✓ |
| isp9606 | 130 nodes / 89 basic events | 4.08×10⁻⁹ | Consistent ✓ |

> Note: at original probabilities (order 10⁻⁹) Monte Carlo with ≤10⁶ samples has no statistical power, so probabilities are scaled up to verify **structure and gate logic**; the probability math itself is proven by Layer 2's exact enumeration. The three benchmark files in `examples/` carry original probabilities and can be opened in the tool directly.

## Reproduce the benchmark checks

```bash
# 1. Download a benchmark (Open-PSA XML)
curl -sL "https://raw.githubusercontent.com/rakhimov/scram/develop/input/Aralia/chinese.xml" -o benchmarks/chinese.xml

# 2. Convert to a project file (optional probability scale for MC verification)
node scripts/openpsa-convert.js benchmarks/chinese.xml out.fta.json
```

## Scope and known limitations

- Supported gates: OR / AND / voting k/n (coherent static trees). INHIBIT / PAND / XOR / NOT are on the roadmap
- Basic events are assumed mutually independent (explicit common-cause modeling not yet provided; shared events approximate the effect)
- House events are deterministic (q=0 or 1) and participate in OR/AND/voting logic
