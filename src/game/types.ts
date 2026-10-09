import type { LifeState } from './lifeTypes';
export type SubjectKey = 'chinese' | 'math' | 'english' | 'physics' | 'chemistry' | 'biology';
export type StatKey = 'energy' | 'mood' | 'stress' | 'health' | 'money' | 'autonomy';
export type RomanceId = 'su' | 'zhou' | 'zhixia' | 'xinghe' | 'tangtang';
export type CharacterId = RomanceId | 'mom' | 'teacher';
export type Scene = 'campus' | 'home' | 'city' | 'library' | 'laboratory' | 'arts' | 'park' | 'market' | 'university';
export type Phase = 'school' | 'exam' | 'application' | 'ending';
export type IconName = 'school' | 'book' | 'bag' | 'friends' | 'journal' | 'university' | 'home' | 'heart' | 'energy' | 'smile' | 'coin' | 'leaf' | 'trophy' | 'calendar' | 'food' | 'ball' | 'shop' | 'moon' | 'milk' | 'bread' | 'coffee' | 'notes' | 'tea' | 'letter' | 'compass' | 'briefcase' | 'market' | 'medical' | 'shield' | 'newspaper' | 'controller' | 'lab' | 'train' | 'clock';

export interface Effect {
  energy?: number;
  mood?: number;
  stress?: number;
  health?: number;
  money?: number;
  autonomy?: number;
  subjects?: Partial<Record<SubjectKey, number>>;
  relations?: Partial<Record<CharacterId, number>>;
  bonds?: Partial<Record<RomanceId, { trust?: number; affection?: number; understanding?: number }>>;
}

export interface Choice {
  text: string;
  effect: Effect;
  result: string;
}

export interface StoryEvent {
  id: string;
  title: string;
  chapter: string;
  minWeek: number;
  maxWeek: number;
  speaker: CharacterId;
  scene: Scene | 'classroom';
  placeId?: string;
  appointmentSource?: string;
  requires?: { eventId: string; choiceIndex?: number };
  storyline?: string;
  paragraphs: string[];
  choices: Choice[];
}

export interface GameAction {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  effect: Effect;
  category: 'study' | 'rest' | 'exercise' | 'social' | 'explore';
}

export interface University {
  id: string;
  name: string;
  short: string;
  type: '985' | '211' | '双一流' | '本科';
  level: '公办' | '民办' | '中外合作';
  city: string;
  majors: string[];
  description: string;
  threshold: number;
  rank?: number;
  rankYear?: number;
  color: string;
  source: string;
}

export type StartingStage = 'highschool' | 'university' | 'society' | 'retirement';

export interface GameState {
  version: 3;
  started: boolean;
  startStage: StartingStage;
  name: string;
  nameIsCustom: boolean;
  gender: 'male' | 'female';
  difficulty: 'gentle' | 'standard';
  targetSchool: string;
  week: number;
  actions: number;
  weeklyActions: string[];
  stats: Record<StatKey, number>;
  subjects: Record<SubjectKey, number>;
  relations: Record<CharacterId, number>;
  social: SocialState;
  romance: RomanceState;
  birthdayGifts: string[];
  graduate: GraduateState;
  life: LifeState;
  world: { scene: Scene; placeId: string; x: number; y: number };
  quests: QuestState;
  inventory: Record<string, number>;
  seenEvents: string[];
  history: { eventId: string; choiceIndex: number; week: number; result: string }[];
  actionLog: { week: number; text: string }[];
  pendingEvent: string | null;
  claimedWeeks: number[];
  counts: Record<GameAction['category'], number>;
  plan: string[];
  phase: Phase;
  wishes: { schoolId: string; major: string }[];
  examAnswers: number[];
  examScore: number | null;
  admittedId: string | null;
  admittedMajor: string | null;
  seed: number;
  updatedAt: string;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  musicVolume: number;
  effectsVolume: number;
  reducedMotion: boolean;
}

export interface Bond {
  trust: number;
  affection: number;
  understanding: number;
  route: 'open' | 'friendship' | 'dating';
  meetings: number;
  lastMeetWeek: number;
  lastGiftWeek: number;
}

export interface ChatMessage {
  id: string;
  character: CharacterId;
  side: 'incoming' | 'outgoing';
  text: string;
  week: number;
  read: boolean;
  scriptId?: string;
  topicId?: string;
}

export interface SocialState {
  bonds: Record<RomanceId, Bond>;
  messages: ChatMessage[];
  delivered: string[];
  replies: { scriptId: string; choiceIndex: number; week: number }[];
  partner: RomanceId | null;
  initiatives: { topicId: string; week: number }[];
}

export interface ProactiveTopic {
  id: string;
  character: CharacterId;
  label: string;
  text: string;
  response: string;
  effect: Effect;
  minWeek: number;
  minTrust?: number;
  datingOnly?: boolean;
  invitePlace?: string;
  weekly?: boolean;
}

export interface QuestState {
  claimed: string[];
  tracked: string[];
  visitedPlaces: string[];
  projects: Record<string, ProjectProgress>;
}

export interface ProjectProgress {
  startedWeek: number;
  stage: number;
  stageStartedWeeks: number[];
  contributions: { week: number; stage: number }[];
  completedWeek: number | null;
  claimed: boolean;
}

export interface LongProject {
  id: string;
  title: string;
  description: string;
  placeId: string;
  character: CharacterId;
  actionId: string;
  minTrust?: number;
  datingOnly?: boolean;
  stages: { title: string; description: string; weeks: number; work: number; objective: QuestObjective }[];
  reward: Effect;
}

export interface QuestTarget {
  panel?: Exclude<Panel, null>;
  placeId?: string;
  character?: CharacterId;
}

export interface QuestObjective {
  text: string;
  goal: number;
  eventIds?: string[];
  progress: (game: GameState) => number;
  target: QuestTarget;
}

export interface QuestDefinition {
  id: string;
  kind: 'main' | 'side' | 'character';
  chain: string;
  title: string;
  description: string;
  minWeek: number;
  requires?: string;
  character?: CharacterId;
  objectives: QuestObjective[];
  reward: Effect;
}

export interface MessageChoice extends Choice {
  route?: 'dating' | 'friendship';
}

export interface MessageScript {
  id: string;
  character: CharacterId;
  text: string;
  minWeek: number;
  choices: MessageChoice[];
  requires?: string;
  minTrust?: number;
  minAffection?: number;
  datingOnly?: boolean;
  romantic?: boolean;
  invitePlace?: string;
}

export interface SaveSlot {
  savedAt: string;
  game: GameState;
}

export type Panel = 'graduate-romance' | 'about' | 'play-reminder' | 'age' | 'romance' | 'romance-story' | 'start' | 'menu' | 'settings' | 'saves' | 'help' | 'world-map' | 'quests' | 'messages' | 'location' | 'study' | 'bag' | 'relations' | 'journal' | 'universities' | 'schedule' | 'achievements' | 'profile' | 'week' | 'exam' | 'result' | 'ending' | 'event' | 'new-confirm' | null;

export type GraduateOperation = 'reunion' | 'meet' | 'talk' | 'confess' | 'date' | 'hand' | 'hug' | 'kiss' | 'birthday' | 'breakup' | 'chapter-0' | 'chapter-1' | 'chapter-2' | 'chapter-3' | 'chapter-4' | 'chapter-5';
export interface GraduateMemory { id: string; operation: GraduateOperation; month: number; choice: number; title: string; result: string }
export interface GraduateState {
  unlocked: boolean; month: number; actions: number; trust: number; affection: number; understanding: number;
  status: 'friendship' | 'dating' | 'broken'; partner: 'teacher' | null; sinceMonth: number; lastConfessMonth: number; lastBreakupMonth: number;
  meetMonths: number[]; contactMonths: number[]; giftMonths: number[]; dateMonths: number[]; touchMonths: number[];
  touchAllowed: boolean; following: boolean; pending: GraduateOperation | null; memories: GraduateMemory[];
}

export type ViewerAge = 'unknown' | 'minor' | 'adult';
export interface Audience { age: ViewerAge; skipPrivate: boolean }
export interface RomanceMemory { id: string; character: RomanceId; week: number; title: string; result: string; skipped?: boolean }
export interface RomanceBond {
  status: 'normal' | 'cooling' | 'broken'; sinceWeek: number; episode: number;
  meetWeeks: number[]; lastConfessWeek: number; lastTouchWeek: number;
  lastDateWeek: number; lastHomeWeek: number; lastTalkWeek: number;
  boundaries: { publicAffection: boolean; homeVisits: boolean; touch: boolean };
  handmade: { startedWeek: number; weeks: number[]; gifted: boolean } | null;
}
export interface RomanceState {
  bonds: Record<RomanceId, RomanceBond>;
  memories: RomanceMemory[];
  active: { id: string; character: RomanceId; week: number } | null;
  escort: RomanceId | null; visitor: RomanceId | null;
  cancelledAppointments: string[];
  attention: { school: number; family: number; rumor: number; lastConcernWeek: number; queued: 'school' | 'family' | 'rumor' | null };
}
