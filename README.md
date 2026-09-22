# n0paths benchmarks

Reproducible experiments for deterministic onchain pricing.

This repository contains numerical experiments used to evaluate pricing
methods developed under `n0paths`.

The goal is to separate three questions:

1. Does the deterministic implementation reproduce its mathematical model?
2. How closely does the pricing approximation reproduce the target payoff?
3. What computational trade-offs exist between deterministic evaluation and
   simulation-based references?

## First experiment

The initial benchmark studies a discretely monitored arithmetic Asian call.

The deterministic method uses:

```text
GBM assumptions
      ↓
exact first moment M1
      ↓
exact second moment M2
      ↓
lognormal moment matching
      ↓
deterministic expected payoff
```

The benchmark reference uses:

```text
GBM assumptions
      ↓
exact GBM transitions
      ↓
simulated arithmetic averages
      ↓
discounted payoffs
      ↓
Monte Carlo estimate ± standard error
```

Both methods use the same observation convention:

\[
t_i = \frac{iT}{n},
\qquad i=1,\ldots,n.
\]

The initial spot at \(t=0\) is not included in the arithmetic average.

## What is measured

Experiments record quantities such as:

```text
deterministic price
Monte Carlo price
Monte Carlo standard error
absolute difference
relative difference
runtime
path count
random seed
scenario parameters
```

Monte Carlo output is never treated as an exact value.

Its sampling uncertainty is reported alongside the estimate.

Likewise, a deterministic result is not automatically an exact market price.
The arithmetic-average distribution is approximated by a moment-matched
lognormal distribution.

## Reproducibility

Experiments use explicit scenario definitions and deterministic random seeds.

A benchmark result should be reproducible from:

```text
code
+ scenario
+ path count
+ seed
+ runtime environment
```

Generated results should not be manually edited.

## Planned structure

```text
benchmarks/
├── README.md
├── package.json
├── tsconfig.json
├── asian/
│   ├── scenarios.json
│   ├── benchmark.ts
│   ├── results.json
│   └── README.md
├── src/
│   ├── deterministic.ts
│   ├── monteCarlo.ts
│   ├── random.ts
│   └── statistics.ts
└── .github/
    └── workflows/
        └── benchmark.yml
```

## Relationship to the engine

The pricing implementation lives separately in `n0paths/engine`.

This repository is intended for experiments and validation rather than
production Solidity code.

Keeping the benchmark implementation separate reduces the risk of validating
an implementation against itself.

## Status

Experimental research software.

Results in this repository should be interpreted together with their model
assumptions, numerical method, sample size, and statistical uncertainty.
