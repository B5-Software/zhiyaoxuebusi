import type { RomanceId } from './types';
export type AtlasId = 'school' | 'university' | 'society';
export type DiseaseId = 'diabetes' | 'hemorrhage' | 'sudden' | 'stroke' | 'scoliosis' | 'infarction' | 'mitral' | 'kidneyCancer' | 'lungCancer' | 'ovarianCancer' | 'aml' | 'all';
export interface Condition { id: DiseaseId; stage: 'latent' | 'symptoms' | 'diagnosed' | 'stable' | 'progressing'; severity: number; since: number; treated: number; discovered: boolean; care?: boolean; review?: number; sessions?: number; remission?: number }
export interface Body {
  habits: { diet: number; sleep: number; movement: number; posture: number; smoke: number; strain: number };
  internal: { metabolic: number; vascular: number; cardiac: number; renal: number; respiratory: number; marrow: number; skeletal: number };
  conditions: Condition[]; emergency: DiseaseId | null; emergencyWeek: number;
  tests: { week: number; test: string; text: string; findings?: DiseaseId[]; confirmed?: DiseaseId[]; readings?: Record<string, number> }[]; notices: string[]; constitution: number; schoolWeeks: number;
}
export interface Position { id: number; asset: string; kind: 'perpetual' | 'delivery'; side: 'long' | 'short'; entry: number; quantity: number; margin: number; leverage: number; expiry: number; funding: number }
export interface Candle { day: number; open: number; high: number; low: number; close: number; volume: number; news: string[] }
export interface NewsItem { id: string; week: number; category: '经济' | '教育' | '医疗' | '劳动' | '市场'; title: string; text: string; impacts: Record<string, number>; duration: number; rent: number; wages: number }
export interface TradeRecord { week: number; asset: string; kind: string; amount: number; price: number; pnl: number }
export interface Finance { rebuiltBefore: number | null; candles: Record<string, Candle[]>; news: NewsItem[]; basis: Record<string, number>; trades: TradeRecord[]; sentiment: Record<string, number>; prices: Record<string, number>; series: Record<string, number[]>; holdings: Record<string, number>; positions: Position[]; nextId: number; pool: { eth: number; cash: number; supply: number; shares: number; deposited: number }; fees: number; realized: number }
export interface Child { id: string; name: string; gender: 'male' | 'female'; bornWeek: number; education: number; care: number; profile?: { enrolled: boolean; degree: boolean; credits: number; collegeWeeks: number; prestige: number; body: Body; technical: number; workWeeks: number } }
export interface LifeState {
  schema: 2; originWeek: number; active: boolean; stage: 'school' | 'university' | 'society'; atlas: AtlasId; region: string;
  baseAge: number; weeks: number; actions: number; used: string[]; generation: number;
  education: { enrolled: boolean; school: string; major: string; prestige: number; credits: number; gpa: number; degree: boolean; entered?: number };
  skills: { technical: number; communication: number; practical: number }; work: { job: string | null; experience: number; hours: number; missed: number; lastApplication: number; retired: boolean; partTime: boolean; wageFactor: number; delayed: boolean; arrearsWeeks: number; arrears: number; claimDue: number; pensionWeeks: number; paidWeeks: number };
  economy: { debt: number; income: number; expenses: number; rent: 'dorm' | 'shared' | 'apartment'; insurance: 'none' | 'basic' | 'commercial'; insuredSince: number; costIndex: number; rentIndex: number; shortfall: number; aidDue: number; aidCooldown: number; deductibleYear: number; deductibleSpent: number; excluded: DiseaseId[]; ledger: { week: number; label: string; amount: number }[] };
  family: { spouse: RomanceId | 'teacher' | null; proposed: boolean; affection: number; partnerConsent: boolean; pregnancy: { due: number; gender: 'male' | 'female'; name: string } | null; children: Child[]; lastCare: number; following: boolean; marriedWeek: number; partnerJob: string | null; partnerWorking: boolean; partnerWorkWeeks: number; partnerRetired: boolean; careShare: number; coParent: boolean; prenatal: number[] };
  body: Body; finance: Finance; claims: {kind:'tuition'|'insurance';due:number;amount:number}[];
  pending: string | null; seen: string[]; eventWeeks: Record<string,number>; memories: { week: number; title: string; text: string }[];
  game: { id: string; seed: number; week: number; answers: number[]; target: string } | null;
  scores: Record<string, number>; tasks: string[];
  death: { cause: string; age: number; week: number; settled: boolean } | null;
  ancestors: { name: string; age: number; cause: string; wealth: number; generation: number }[];
}
export type LifePanel = 'news' | 'overview' | 'atlas' | 'place' | 'work' | 'finance' | 'health' | 'family' | 'tasks' | 'journal' | 'game' | 'death' | 'guide';
