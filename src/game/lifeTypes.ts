import type { RomanceId } from './types';
export type AtlasId = 'school' | 'university' | 'society';
export type DiseaseId = 'diabetes' | 'hemorrhage' | 'sudden' | 'stroke' | 'scoliosis' | 'infarction' | 'mitral' | 'kidneyCancer' | 'lungCancer' | 'ovarianCancer' | 'aml' | 'all';
export interface Condition { id: DiseaseId; stage: 'latent' | 'symptoms' | 'diagnosed' | 'stable' | 'progressing'; severity: number; since: number; treated: number; discovered: boolean }
export interface Body {
  habits: { diet: number; sleep: number; movement: number; posture: number; smoke: number; strain: number };
  internal: { metabolic: number; vascular: number; cardiac: number; renal: number; respiratory: number; marrow: number; skeletal: number };
  conditions: Condition[]; emergency: DiseaseId | null; emergencyWeek: number;
  tests: { week: number; test: string; text: string }[]; notices: string[]; constitution: number; schoolWeeks: number;
}
export interface Position { id: number; asset: string; kind: 'perpetual' | 'delivery'; side: 'long' | 'short'; entry: number; quantity: number; margin: number; leverage: number; expiry: number; funding: number }
export interface Finance { prices: Record<string, number>; series: Record<string, number[]>; holdings: Record<string, number>; positions: Position[]; nextId: number; pool: { eth: number; cash: number; supply: number; shares: number; deposited: number }; fees: number; realized: number }
export interface Child { id: string; name: string; gender: 'male' | 'female'; bornWeek: number; education: number; care: number }
export interface LifeState {
  schema: 1; active: boolean; stage: 'university' | 'society'; atlas: AtlasId; region: string;
  baseAge: number; weeks: number; actions: number; used: string[]; generation: number;
  education: { enrolled: boolean; school: string; major: string; prestige: number; credits: number; gpa: number; degree: boolean };
  skills: { technical: number; communication: number; practical: number }; work: { job: string | null; experience: number; hours: number; missed: number; lastApplication: number; retired: boolean };
  economy: { debt: number; income: number; expenses: number; rent: 'dorm' | 'shared' | 'apartment'; insurance: 'none' | 'basic' | 'commercial'; insuredSince: number; ledger: { week: number; label: string; amount: number }[] };
  family: { spouse: RomanceId | 'teacher' | null; proposed: boolean; affection: number; partnerConsent: boolean; pregnancy: { due: number; gender: 'male' | 'female'; name: string } | null; children: Child[]; lastCare: number; following: boolean };
  body: Body; finance: Finance;
  pending: string | null; seen: string[]; memories: { week: number; title: string; text: string }[];
  game: { id: string; seed: number; week: number; answers: number[]; target: string } | null;
  scores: Record<string, number>; tasks: string[];
  death: { cause: string; age: number; week: number; settled: boolean } | null;
  ancestors: { name: string; age: number; cause: string; wealth: number; generation: number }[];
}
export type LifePanel = 'overview' | 'atlas' | 'place' | 'work' | 'finance' | 'health' | 'family' | 'tasks' | 'journal' | 'game' | 'death' | 'guide';
