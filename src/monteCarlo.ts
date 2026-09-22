import { NormalGenerator } from "./random.js";
import {
  OnlineStatistics,
  type StatisticsSnapshot,
} from "./statistics.js";

export interface MarketState {
  spot: number;
  volatility: number;
  riskFreeRate: number;
  dividendYield: number;
}

export interface AsianOption {
  strike: number;
  timeToExpiry: number;
  observations: number;
}

export interface MonteCarloConfig {
  paths: number;
  seed: number;
}

export interface MonteCarloResult {
  price: number;
  standardError: number;

  confidence95: {
    lower: number;
    upper: number;
  };

  sampleStandardDeviation: number;

  paths: number;
  seed: number;

  elapsedMilliseconds: number;
}

/**
 * Validate the model and experiment inputs.
 */
function validateInputs(
  market: MarketState,
  option: AsianOption,
  config: MonteCarloConfig,
): void {
  if (
    !Number.isFinite(market.spot) ||
    market.spot <= 0
  ) {
    throw new Error(
      "spot must be positive and finite",
    );
  }

  if (
    !Number.isFinite(market.volatility) ||
    market.volatility < 0
  ) {
    throw new Error(
      "volatility must be non-negative and finite",
    );
  }

  if (
    !Number.isFinite(market.riskFreeRate)
  ) {
    throw new Error(
      "risk-free rate must be finite",
    );
  }

  if (
    !Number.isFinite(market.dividendYield)
  ) {
    throw new Error(
      "dividend yield must be finite",
    );
  }

  if (
    !Number.isFinite(option.strike) ||
    option.strike <= 0
  ) {
    throw new Error(
      "strike must be positive and finite",
    );
  }

  if (
    !Number.isFinite(option.timeToExpiry) ||
    option.timeToExpiry <= 0
  ) {
    throw new Error(
      "time to expiry must be positive and finite",
    );
  }

  if (
    !Number.isInteger(option.observations) ||
    option.observations <= 0
  ) {
    throw new Error(
      "observations must be a positive integer",
    );
  }

  if (
    !Number.isInteger(config.paths) ||
    config.paths < 2
  ) {
    throw new Error(
      "paths must be an integer >= 2",
    );
  }

  if (
    !Number.isInteger(config.seed)
  ) {
    throw new Error(
      "seed must be an integer",
    );
  }
}

/**
 * Simulate one discounted arithmetic Asian call payoff.
 *
 * Observation convention:
 *
 * t_i = iT / n
 *
 * for i = 1, ..., n.
 *
 * The initial spot at t = 0 is not included in the average.
 *
 * Exact GBM transitions are used between monitoring dates, so there is no
 * Euler discretization error between observations.
 */
function simulateDiscountedPayoff(
  market: MarketState,
  option: AsianOption,
  normal: NormalGenerator,
): number {
  const {
    spot,
    volatility,
    riskFreeRate,
    dividendYield,
  } = market;

  const {
    strike,
    timeToExpiry,
    observations,
  } = option;

  const dt =
    timeToExpiry /
    observations;

  const drift =
    (
      riskFreeRate -
      dividendYield -
      0.5 *
        volatility *
        volatility
    ) *
    dt;

  const diffusion =
    volatility *
    Math.sqrt(dt);

  let underlying = spot;
  let sum = 0;

  for (
    let i = 0;
    i < observations;
    i += 1
  ) {
    const z = normal.next();

    underlying *= Math.exp(
      drift +
      diffusion * z,
    );

    sum += underlying;
  }

  const arithmeticAverage =
    sum / observations;

  const payoff =
    Math.max(
      arithmeticAverage - strike,
      0,
    );

  const discountFactor =
    Math.exp(
      -riskFreeRate *
      timeToExpiry,
    );

  return (
    discountFactor * payoff
  );
}

/**
 * Run a reproducible Monte Carlo experiment.
 */
export function priceAsianCallMonteCarlo(
  market: MarketState,
  option: AsianOption,
  config: MonteCarloConfig,
): MonteCarloResult {
  validateInputs(
    market,
    option,
    config,
  );

  const normal =
    new NormalGenerator(
      config.seed,
    );

  const statistics =
    new OnlineStatistics();

  const start =
    performance.now();

  for (
    let path = 0;
    path < config.paths;
    path += 1
  ) {
    const discountedPayoff =
      simulateDiscountedPayoff(
        market,
        option,
        normal,
      );

    statistics.push(
      discountedPayoff,
    );
  }

  const elapsedMilliseconds =
    performance.now() - start;

  const snapshot:
    StatisticsSnapshot =
      statistics.snapshot();

  return {
    price:
      snapshot.mean,

    standardError:
      snapshot.standardError,

    confidence95:
      snapshot.confidence95,

    sampleStandardDeviation:
      snapshot.sampleStandardDeviation,

    paths:
      config.paths,

    seed:
      config.seed,

    elapsedMilliseconds,
  };
}
