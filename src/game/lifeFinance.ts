import { ASSETS } from './lifeData';
import { roll } from './lifeHealth';
import { newsPressure, publishNews } from './lifeNews';
import type { Candle, Finance, Position } from './lifeTypes';
const cents=(v:number)=>Math.round(v*100)/100;
export function aggregateCandles(candles:Candle[],days:number):Candle[]{
 const groups=new Map<number,Candle[]>();
 for(const c of candles){const key=Math.floor(c.day/days);groups.set(key,[...(groups.get(key)??[]),c]);}
 return [...groups.values()].map(g=>({day:g[0].day,open:g[0].open,high:Math.max(...g.map(c=>c.high)),low:Math.min(...g.map(c=>c.low)),close:g[g.length-1].close,volume:g.reduce((n,c)=>n+c.volume,0),news:[...new Set(g.flatMap(c=>c.news))]}));
}
export function createFinance(): Finance {
 const prices=Object.fromEntries(ASSETS.map(a=>[a.id,a.price]));
 const candles=Object.fromEntries(ASSETS.map((a,index)=>{let price=a.price*.9;const list:Candle[]=[];for(let day=-140;day<0;day++){const open=price;price=day===-1?a.price:Math.max(a.price*.5,open*(1+(roll(831+index,day)*2-1)*a.volatility*.18));list.push({day,open,close:price,high:Math.max(open,price)*1.007,low:Math.min(open,price)*.993,volume:Math.round(10000+roll(32+index,day)*40000),news:[]});}return[a.id,list];}));
 return {rebuiltBefore:null,prices,candles,series:Object.fromEntries(ASSETS.map(a=>[a.id,aggregateCandles(candles[a.id],7).map(c=>c.close)])),holdings:Object.fromEntries(ASSETS.map(a=>[a.id,0])),basis:Object.fromEntries(ASSETS.map(a=>[a.id,0])),trades:[],sentiment:Object.fromEntries(ASSETS.map(a=>[a.id,0])),news:[publishNews(817,0,[])],positions:[],nextId:1,pool:{eth:100,cash:1800000,supply:1000,shares:0,deposited:0},fees:0,realized:0};
}
export function positionEquity(p:Position,price:number){return p.margin+(price-p.entry)*p.quantity*(p.side==='long'?1:-1)-p.funding;}
export function liquidationPrice(p:Position){return p.side==='long'?(p.entry-(p.margin-p.funding)/p.quantity)/.995:(p.entry+(p.margin-p.funding)/p.quantity)/1.005;}
export function portfolioValue(f:Finance){return Object.entries(f.holdings).reduce((n,[a,q])=>n+q*f.prices[a],0)+f.positions.reduce((n,p)=>n+Math.max(0,positionEquity(p,f.prices[p.asset])),0)+f.pool.shares/f.pool.supply*(f.pool.eth*f.prices.ETH+f.pool.cash);}
export function stepMarket(f:Finance,seed:number,week:number):{finance:Finance;cash:number;messages:string[]}{
 const next=structuredClone(f),messages:string[]=[];let cash=0;
 const weekCandles:Record<string,Candle[]>={};
 for(const [index,a] of ASSETS.entries()){
  const pressure=newsPressure(f.news,a.id,week);next.sentiment[a.id]=pressure;
  let price=f.prices[a.id];const list:Candle[]=[];
  for(let d=0;d<7;d++){
   const day=(week-1)*7+d,open=price;
   const noise=(roll(seed,day*29+index+709)*2-1)*a.volatility*.39;
   // Public expectations shift drift; idiosyncratic shocks still permit reversals.
   price=cents(Math.min(1e10,Math.max(a.price*.005,open*Math.exp(noise+pressure/7))));
   const wick=a.volatility*(.05+roll(seed,day*37+index+821)*.35);
   list.push({day,open,close:price,high:cents(Math.max(open,price)*(1+wick)),low:Math.max(.01,cents(Math.min(open,price)*(1-wick))),volume:Math.round((12000+roll(seed,day*41+index)*60000)*(1+Math.abs(pressure)*12)),news:d===0?f.news.filter(n=>n.week===week-1&&a.id in n.impacts).map(n=>n.id):[]});
  }
  weekCandles[a.id]=list;next.prices[a.id]=price;next.candles[a.id]=[...f.candles[a.id],...list].slice(-364);next.series[a.id]=aggregateCandles(next.candles[a.id],7).map(c=>c.close).slice(-52);
 }
 // Test each day's adverse excursion; a later recovery cannot revive a liquidated position.
 next.positions=next.positions.filter(p=>{
  for(const c of weekCandles[p.asset]){const adverse=p.side==='long'?c.low:c.high;if(positionEquity(p,adverse)<=p.quantity*adverse*.005){next.realized-=p.margin;next.trades.unshift({week,asset:p.asset,kind:'周内强平',amount:p.margin,price:liquidationPrice(p),pnl:-p.margin});messages.push(p.asset+' '+(p.side==='long'?'多':'空')+'单周内触及强平线，逐仓保证金损失 ¥'+p.margin.toFixed(2));return false;}}
  const price=next.prices[p.asset];if(p.kind==='perpetual')p.funding+=p.quantity*price*(.0005+next.sentiment[p.asset]*.01)*(p.side==='long'?1:-1);
  const equity=positionEquity(p,price);if(equity<=p.quantity*price*.005){next.realized-=p.margin;messages.push(p.asset+'资金费结算后强平');return false;}
  if(p.kind==='delivery'&&week>=p.expiry){const fee=p.quantity*price*.001,payout=Math.max(0,equity-fee);cash+=payout;next.realized+=payout-p.margin;next.fees+=fee;next.trades.unshift({week,asset:p.asset,kind:'交割结算',amount:payout,price,pnl:payout-p.margin});messages.push(p.asset+'交割合约现金结算 ¥'+payout.toFixed(2));return false;}return true;
 });
 const k=next.pool.eth*next.pool.cash;next.pool.eth=Math.sqrt(k/next.prices.ETH);next.pool.cash=Math.sqrt(k*next.prices.ETH);
 if(week%2===0)next.news.unshift(publishNews(seed,week,next.news));next.news=next.news.slice(0,60);next.trades=next.trades.slice(0,100);
 return {finance:next,cash,messages};
}
export function swapQuote(f:Finance,direction:'buy'|'sell',amount:number){const p=f.pool,input=amount*.997;return direction==='buy'?p.eth*input/(p.cash+input):p.cash*input/(p.eth+input);}
