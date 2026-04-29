import { PromptModule, Toplevel } from "./boilerplate";

export type WaterSortApp = Toplevel<{
  prompt: "Build a Water sort game as a serverless PWA. Use the APIs of the provided modules to compose the software.";
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
  prompt: "Implement a generic game‑view UI layer. It should render the current game state, bind user interactions, and display a solved/completed state. Use only the APIs of the StateModule.";
  api: {
    renderPuzzle: () => void;
    bindInteractions: () => void;
    showSolved: () => void;
  };
  modules: [StateModule];
}>;

type UICareerModule = PromptModule<{
  prompt: "Implement a UI layer for a progression‑based game mode. It should render the mode’s interface, show progress, and display earned achievements. Use only the APIs of GameviewUIModule, CareerModule, and AchievementsModule.";
  api: {
    renderCareermodeUI: () => void;
    showProgress: () => void;
    showAchievements: () => void;
  };
  modules: [GameviewUIModule, CareerModule, AchievementsModule];
}>;

type UIMultiplayerModule = PromptModule<{
  prompt: `
  Implement a UI layer for a multiplayer or competitive mode. It should render the mode’s interface, show match/join links, and display results.
  Use only the APIs of the listed modules.
  
  A multiplayer match link can be generated via button and is set with a starttime 20 seconds in the future.
  It should provide different options for game duration 1min, 3min, 5min, 10min, and different difficulties`;
  api: {
    renderMultiplayerScreen: () => void;
    showMatchURL: (url: string) => void;
    showResults: (results: MultiplayerResult[]) => void;
  };
  modules: [GameviewUIModule, MultiplayerModule];
}>;

type HelpMeModule = PromptModule<{
  prompt: "Implement a helper/assist module. It should generate a shareable link that allows another player to assist, and apply an externally provided solution. Use only the APIs of the listed modules.";
  api: {
    getHelpFromFriendLink: () => string;
    applyFriendSolution: (hash: string) => boolean;
  };
  modules: [StateModule, SolverModule];
}>;

type UIModule = PromptModule<{
  prompt: "Implement the root UI controller. It initializes the UI, determines which mode is active, and delegates rendering to the appropriate sub‑UI modules. Use only the APIs of the listed modules.";
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
  prompt: "Implement the core game logic. It should generate new game states, apply player actions, and determine whether the game is completed. Use only the provided types.";
  api: {
    generateLevel: (difficulty: number) => PuzzleState;
    applyMove: (state: PuzzleState, move: Move) => PuzzleState;
    isSolved: (state: PuzzleState) => boolean;
  };
  types: { Bottle: Bottle; GameState: PuzzleState; Move: Move };
}>;

type SolverModule = PromptModule<{
  prompt: "Implement a solver for the game. Given a game state, compute a sequence of actions that leads to a completed/solved state. Use only the provided types.";
  api: {
    solve: (state: PuzzleState) => Move[];
  };
  types: { GameState: PuzzleState; Move: Move };
}>;

type AchievementsModule = PromptModule<{
  prompt: "Implement a generic achievements system. It should list all achievements and determine which ones unlock based on the current application state.";
  api: {
    listAll: () => Achievement[];
    checkUnlocks: (state: AppState) => string[];
  };
  types: {
    Achievement: Achievement;
    AmountAllAchievements: 100;
  };
}>;

type CareerModule = PromptModule<{
  prompt: "Implement a progression system for a long‑term game mode. It should compute the next stage, evaluate progress, and determine which achievements unlock after completing a level or challenge. Use only the AchievementsModule API.";
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
  prompt: "Implement multiplayer/competitive logic. It should create and parse match URLs or tokens, and evaluate results for competitive scoring. Use only the provided types.";
  api: {
    createMatchURL: (seed: string, startTimestamp: number, durationMinutes: number) => string;
    parseMatchURL: (url: string) => { seed: string; startTimestamp: number; durationMinutes: number };
    evaluateResult: (moves: number, timeMs: number) => MultiplayerResult;
  };
  types: {
    MultiplayerResult: MultiplayerResult;
  };
}>;

type GameModesModule = PromptModule<{
  prompt: "Implement a mode manager for switching between different game modes. It should list available modes, allow switching, and report the currently active mode. Use only the StateModule API.";
  api: {
    getAvailableModes: () => ("career" | "multiplayer")[];
    setMode: (mode: "career" | "multiplayer") => void;
    getCurrentMode: () => "career" | "multiplayer";
  };
  modules: [StateModule];
}>;


type StateModule = PromptModule<{
  prompt: "Implement the central state manager. It stores the full application state, provides methods to update it, and exposes helpers for creating new games, applying actions, checking completion, and invoking the solver. Use only the APIs of LogicModule, SolverModule, AchievementsModule, CareerModule, and MultiplayerModule.";
  stateful: true;
  api: {
    getState: () => AppState;
    setState: (newState: AppState) => void;

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
