import { ASSETS } from './lifeData';
import { roll } from './lifeHealth';
import type { Finance, Position } from './lifeTypes';
export function createFinance(): Finance {
  const prices = Object.fromEntries(ASSETS.map(a => [a.id, a.price]));
  return { prices, series: Object.fromEntries(ASSETS.map(a => [a.id, [a.price]])), holdings: Object.fromEntries(ASSETS.map(a => [a.id, 0])), positions: [], nextId: 1, pool: { eth: 100, cash: 1800000, supply: 1000, shares: 0, deposited: 0 }, fees: 0, realized: 0 };
}
export function positionEquity(p: Position, price: number) { return p.margin + (price - p.entry) * p.quantity * (p.side === 'long' ? 1 : -1) - p.funding; }
export function portfolioValue(f: Finance) { return Object.entries(f.holdings).reduce((n, [a, q]) => n + q * f.prices[a], 0) + f.positions.reduce((n, p) => n + Math.max(0, positionEquity(p, f.prices[p.asset])), 0) + (f.pool.shares / f.pool.supply) * (f.pool.eth * f.prices.ETH + f.pool.cash); }
export function stepMarket(f: Finance, seed: number, week: number): { finance: Finance; cash: number; messages: string[] } {
  const next = structuredClone(f), messages: string[] = []; let cash = 0;
  for (const [index, a] of ASSETS.entries()) {
    next.prices[a.id] = Math.max(a.price * .005, Math.round(f.prices[a.id] * (1 + (roll(seed, week * 11 + index) * 2 - 1) * a.volatility) * 100) / 100);
    next.series[a.id] = [...f.series[a.id], next.prices[a.id]].slice(-52);
  }
  // External arbitrage rebalances the pool along the invariant; LPs experience divergence loss.
  const k = next.pool.eth * next.pool.cash, poolPrice = next.prices.ETH;
  next.pool.eth = Math.sqrt(k / poolPrice); next.pool.cash = Math.sqrt(k * poolPrice);
  next.positions = next.positions.filter(p => {
    const price = next.prices[p.asset];
    if (p.kind === 'perpetual') p.funding += p.quantity * price * .0005 * (p.side === 'long' ? 1 : -1);
    const equity = positionEquity(p, price), maintenance = p.quantity * price * .005;
    if (equity <= maintenance) { next.realized -= p.margin; messages.push(`${p.asset} ${p.side === 'long' ? '多' : '空'}单已强平，逐仓保证金损失 ¥${p.margin.toFixed(2)}`); return false; }
    if (p.kind === 'delivery' && week >= p.expiry) { const fee = p.quantity * price * .001, payout = Math.max(0, equity - fee); cash += payout; next.realized += payout - p.margin; next.fees += fee; messages.push(`${p.asset} 交割合约已现金结算 ¥${payout.toFixed(2)}`); return false; }
    return true;
  });
  return { finance: next, cash, messages };
}
export function swapQuote(f: Finance, direction: 'buy' | 'sell', amount: number) { const p = f.pool, input = amount * .997; return direction === 'buy' ? p.eth * input / (p.cash + input) : p.cash * input / (p.eth + input); }
