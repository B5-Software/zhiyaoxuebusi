export type SubjectKey = 'chinese' | 'math' | 'english' | 'physics' | 'chemistry' | 'biology';
export type StatKey = 'energy' | 'mood' | 'stress' | 'health' | 'money' | 'autonomy';
export type RomanceId = 'su' | 'zhou' | 'zhixia' | 'xinghe' | 'tangtang';
export type CharacterId = RomanceId | 'mom' | 'teacher';
export type Scene = 'campus' | 'home' | 'city' | 'library' | 'laboratory' | 'arts' | 'park' | 'market' | 'university';
export type Phase = 'school' | 'exam' | 'application' | 'ending';
export type IconName = 'school' | 'book' | 'bag' | 'friends' | 'journal' | 'university' | 'home' | 'heart' | 'energy' | 'smile' | 'coin' | 'leaf' | 'trophy' | 'calendar' | 'food' | 'ball' | 'shop' | 'moon' | 'milk' | 'bread' | 'coffee' | 'notes' | 'tea' | 'letter';

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

export interface GameState {
  version: 2;
  started: boolean;
  name: string;
  nameIsCustom: boolean;
  difficulty: 'gentle' | 'standard';
  targetSchool: string;
  week: number;
  actions: number;
  weeklyActions: string[];
  stats: Record<StatKey, number>;
  subjects: Record<SubjectKey, number>;
  relations: Record<CharacterId, number>;
  social: SocialState;
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

export type Panel = 'start' | 'menu' | 'settings' | 'saves' | 'help' | 'world-map' | 'quests' | 'messages' | 'location' | 'study' | 'bag' | 'relations' | 'journal' | 'universities' | 'schedule' | 'achievements' | 'profile' | 'week' | 'exam' | 'result' | 'ending' | 'event' | 'new-confirm' | null;
