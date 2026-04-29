import { PromptModule, PWASkeleton, Toplevel } from "./boilerplate";

export type WaterSortApp = Toplevel<{
  prompt: "Write a Water Sort PWA. Use the APIs of the provided modules to compose the software";
  targetLanguage: "html";
  skeleton: PWASkeleton;
  modules: [
    UIModule,
    StateModule,
  ];
}>;


type Color = string;

type Bottle = { capacity: number; contents: Color[] };
type PuzzleState = { bottles: Bottle[] };
type Move = { from: number; to: number };

type Achievement = {
  id: string;
  name: string;
  description?: string;
};

type MultiplayerResult = {
  playerName: string;
  completedLevels: number;
};

type AppState = {
  puzzleState: PuzzleState;
  achievements: Record<string, boolean>;
  career: {
    levelIndex: number;
    unlockedAchievements: string[];
  };
  multiplayer: {
    matches: any[];
    results: MultiplayerResult[];
  };
  currentMode: "career" | "multiplayer";
};


type GameviewUIModule = PromptModule<{
  prompt: "";
  api: {
    renderPuzzle: () => void;
    bindInteractions: () => void;
    showSolved: () => void;
  };
  modules: [StateModule];
}>;

type UICareerModule = PromptModule<{
  prompt: "";
  api: {
    renderCareermodeUI: () => void;
    showProgress: () => void;
    showAchievements: () => void;
  };
  modules: [GameviewUIModule, CareerModule, AchievementsModule];
}>;

type UIMultiplayerModule = PromptModule<{
  prompt: "";
  api: {
    renderMultiplayerScreen: () => void;
    showMatchURL: (url: string) => void;
    showResults: (results: MultiplayerResult[]) => void;
  };
  modules: [GameviewUIModule, MultiplayerModule];
}>;

type HelpMeModule = PromptModule<{
  prompt: "";
  api: {
    getHelpFromFriendLink: () => string;
    applyFriendSolution: (hash: string) => boolean;
  };
  modules: [StateModule, SolverModule];
}>;

type UIModule = PromptModule<{
  prompt: "";
  api: {
    init: () => void;
    renderCurrentMode: () => void;
  };
  modules: [
    UICareerModule,
    UIMultiplayerModule,
    GameviewUIModule,
    HelpMeModule,
    GameModesModule
  ];
}>;


type LogicModule = PromptModule<{
  prompt: "";
  api: {
    generateLevel: (difficulty: number) => PuzzleState;
    applyMove: (state: PuzzleState, move: Move) => PuzzleState;
    isSolved: (state: PuzzleState) => boolean;
  };
  types: { Bottle: Bottle; GameState: PuzzleState; Move: Move };
}>;

type SolverModule = PromptModule<{
  prompt: "";
  api: {
    solve: (state: PuzzleState) => Move[];
  };
  types: { GameState: PuzzleState; Move: Move };
}>;

type AchievementsModule = PromptModule<{
  prompt: "";
  api: {
    listAll: () => Achievement[];
    checkUnlocks: (state: AppState) => string[]; // returns newly unlocked IDs
  };
  types: { Achievement: Achievement };
}>;

type CareerModule = PromptModule<{
  prompt: "";
  api: {
    computeNextLevel: (currentLevel: number) => number;
    computeProgress: (state: AppState) => {
      levelIndex: number;
      unlockedAchievements: string[];
    };
    evaluateCompletion: (timeMs: number, moves: number) => {
      achievementsToUnlock: string[];
    };
  };
  modules: [AchievementsModule];
}>;

type MultiplayerModule = PromptModule<{
  prompt: "";
  api: {
    createMatchURL: (seed: string, startTimestamp: number, durationMinutes: number) => string;
    parseMatchURL: (url: string) => { seed: string; startTimestamp: number; durationMinutes: number };
    evaluateResult: (moves: number, timeMs: number) => MultiplayerResult;
  };
  types: { MultiplayerResult: MultiplayerResult };
}>;

type GameModesModule = PromptModule<{
  prompt: "";
  api: {
    getAvailableModes: () => ("career" | "multiplayer")[];
    setMode: (mode: "career" | "multiplayer") => void;
    getCurrentMode: () => "career" | "multiplayer";
  };
  modules: [StateModule];
}>;


type StateModule = PromptModule<{
  prompt: "";
  api: {
    getState: () => AppState;
    setState: (newState: AppState) => void;

    // convenience helpers
    newGame: (difficulty: number) => PuzzleState;
    applyMove: (move: Move) => PuzzleState;
    isSolved: () => boolean;
    solveCurrent: () => Move[];
  };
  types: {
    AppState: AppState;
    PuzzleState: PuzzleState;
    Move: Move;
  };
  modules: [LogicModule, SolverModule, AchievementsModule, CareerModule, MultiplayerModule];
}>;
