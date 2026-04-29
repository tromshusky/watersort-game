import { PromptModule, Toplevel } from "./boilerplate";

export type WaterSortApp = Toplevel<{
  prompt: "Build a Water sort game as a serverless PWA.";
  targetLanguage: "html";
  skeleton: PWASkeleton;
  modules: [
    UIModule,
    StateModule
  ];
}>;

type Color = string;

type Bottle = { capacity: number; contents: Color[] };
type PuzzleState = { bottles: Bottle[] };
type Move = { from: number; to: number };

type Difficulty = "easy" | "medium" | "hard";

type Achievement = {
  id: string;
  name: string;
  description?: string;
};

type MultiplayerResult = {
  playerName: string;
  completedLevels: number;
};

type MultiplayerMatchStatus = "pending" | "active" | "finished";

type MultiplayerMatchConfig = {
  durationMinutes: 1 | 3 | 5 | 10;
  difficulty: Difficulty;
};

type MultiplayerMatchInfo = {
  url: string;
  seed: string;
  startTimestamp: number;
  durationMinutes: number;
  difficulty: Difficulty;
  status: MultiplayerMatchStatus;
};

type GameMode = "career" | "multiplayer";

type AppState = {
  puzzleState: PuzzleState;
  moveHistory: Move[];
  currentSeed?: string;
  currentDifficulty: Difficulty;
  achievements: Record<string, boolean>;
  career: {
    levelIndex: number;
    unlockedAchievements: string[];
  };
  multiplayer: {
    matches: MultiplayerMatchInfo[];
    currentMatch?: MultiplayerMatchInfo;
    results: MultiplayerResult[];
  };
  currentMode: GameMode;
};

type GameviewUIModule = PromptModule<{
  prompt: "Render the puzzle, bind interactions, and provide reset and undo controls.";
  api: {
    renderPuzzle: () => void;
    bindInteractions: () => void;
    bindReset: () => void;
    bindUndo: () => void;
    showSolved: () => void;
  };
  modules: [GameControllerModule];
}>;

type UICareerModule = PromptModule<{
  prompt: "Render the career mode interface, progress, and achievements.";
  api: {
    renderCareermodeUI: () => void;
    showProgress: () => void;
    showAchievements: () => void;
  };
  modules: [GameviewUIModule, CareerModule, AchievementsModule, GameControllerModule];
}>;

type UIMultiplayerSettingsModule = PromptModule<{
  prompt: "Render multiplayer configuration options and trigger match creation.";
  api: {
    renderSettings: () => void;
    onCreateMatchRequested: () => void;
  };
  modules: [MultiplayerModule, GameControllerModule];
}>;

type UIMultiplayerLoadingModule = PromptModule<{
  prompt: "Render a waiting screen for multiplayer matches and update countdown.";
  api: {
    renderLoadingScreen: () => void;
    updateCountdown: () => void;
  };
  modules: [GameControllerModule];
}>;

type UIMultiplayerModule = PromptModule<{
  prompt: "Render multiplayer mode, show match links, and display results.";
  api: {
    renderMultiplayerScreen: () => void;
    showMatchURL: (url: string) => void;
    showResults: (results: MultiplayerResult[]) => void;
  };
  modules: [
    GameviewUIModule,
    MultiplayerModule,
    GameControllerModule,
    UIMultiplayerSettingsModule,
    UIMultiplayerLoadingModule
  ];
}>;

type HelpMeModule = PromptModule<{
  prompt: "Generate a helper link and apply an externally provided solution.";
  api: {
    getHelpFromFriendLink: () => string;
    applyFriendSolution: (hash: string) => boolean;
  };
  modules: [GameControllerModule, SolverModule];
}>;

type UIModule = PromptModule<{
  prompt: "Initialize the UI and delegate rendering to the active mode.";
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
  prompt: "Generate deterministic levels, apply moves, and detect solved states.";
  api: {
    generateLevel: (difficulty: Difficulty, seed?: string) => PuzzleState;
    applyMove: (state: PuzzleState, move: Move) => PuzzleState;
    isSolved: (state: PuzzleState) => boolean;
  };
  types: { Bottle: Bottle; GameState: PuzzleState; Move: Move; Difficulty: Difficulty };
}>;

type SolverModule = PromptModule<{
  prompt: "Compute a sequence of moves that solves a puzzle.";
  api: {
    solve: (state: PuzzleState) => Move[];
  };
  types: { GameState: PuzzleState; Move: Move };
}>;

type AchievementsModule = PromptModule<{
  prompt: "List achievements and determine which unlock based on state.";
  api: {
    listAll: () => Achievement[];
    checkUnlocks: (state: AppState) => string[];
  };
  types: {
    Achievement: Achievement;
    AmountAllAchievements: 100;
    AppState: AppState;
  };
}>;

type CareerModule = PromptModule<{
  prompt: "Compute next career level, progress, and achievement unlocks.";
  api: {
    computeNextLevel: (currentLevel: number) => number;
    computeProgress: (state: AppState) => {
      levelIndex: number;
      unlockedAchievements: string[];
    };
    evaluateCompletion: (timeMs: number, moves: number) => {
      achievementIdsToUnlock: string[];
    };
  };
  modules: [AchievementsModule];
}>;

type MultiplayerModule = PromptModule<{
  prompt: "Create and parse deterministic multiplayer match URLs and evaluate results.";
  api: {
    createMatchURL: (seed: string, startTimestamp: number, durationMinutes: number, difficulty: Difficulty) => string;
    parseMatchURL: (url: string) => { seed: string; startTimestamp: number; durationMinutes: number; difficulty: Difficulty };
    evaluateResult: (playerName: string, moves: number, timeMs: number) => MultiplayerResult;
  };
  types: {
    MultiplayerResult: MultiplayerResult;
    Difficulty: Difficulty;
  };
}>;

type GameModesModule = PromptModule<{
  prompt: "Manage available modes and switch between them.";
  api: {
    getAvailableModes: () => GameMode[];
    setMode: (mode: GameMode) => void;
    getCurrentMode: () => GameMode;
  };
  modules: [StateModule];
}>;

type GameControllerModule = PromptModule<{
  prompt: "Coordinate logic and state: start games, apply moves, undo, reset, solve, and manage multiplayer matches.";
  api: {
    getCurrentPuzzle: () => PuzzleState;
    startCareerLevel: (levelIndex: number, difficulty: Difficulty) => PuzzleState;
    startNextCareerLevel: () => PuzzleState;
    startNewMultiplayerMatch: (config: MultiplayerMatchConfig) => MultiplayerMatchInfo;
    joinMultiplayerMatchFromURL: (url: string) => MultiplayerMatchInfo;
    applyMoveToCurrentPuzzle: (move: Move) => { state: PuzzleState; solved: boolean };
    undoLastMove: () => PuzzleState;
    resetCurrentPuzzle: () => PuzzleState;
    isCurrentPuzzleSolved: () => boolean;
    solveCurrentPuzzle: () => Move[];
    getMoveHistory: () => Move[];
    getCurrentMatchInfo: () => MultiplayerMatchInfo | undefined;
  };
  modules: [StateModule, LogicModule, SolverModule, MultiplayerModule, CareerModule, AchievementsModule];
}>;

type StateModule = PromptModule<{
  prompt: "Store and retrieve application state without implementing game logic.";
  stateful: true;
  api: {
    getState: () => AppState;
    setState: (newState: AppState) => void;
    updateState: (updater: (prev: AppState) => AppState) => void;
    initializeDefaultState: () => void;
  };
  types: {
    AppState: AppState;
    PuzzleState: PuzzleState;
    Move: Move;
    Difficulty: Difficulty;
    GameMode: GameMode;
    MultiplayerMatchInfo: MultiplayerMatchInfo;
  };
  modules: [];
}>;

type PWASkeleton = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="manifest" href="manifest.webmanifest" />
  </head>
  <body>
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js");
      }
    </script>
  </body>
</html>
`;
