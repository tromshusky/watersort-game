/**
 * Root application module
 */
export type WaterSortApp = Toplevel<{
  prompt: "Write a PWA water sort app that composes StateModule, UIModule, GameModesModule, CareerModule, MultiplayerModule, and SocialModule strictly through their public APIs.";
  targetLanguage: "html";
  skeleton: PWASkeleton;
  modules: [
    UIModule,
    StateModule
  ];
}>;


type Color = unknown;
type Bottle = { capacity: number; contents: Color[] };
type GameState = { bottles: Bottle[] };
type Move = { from: number; to: number };
type Achievement = { id: string; name: string; unlocked: boolean; description?: string };
type MultiplayerResult = { playerName: string; moves: number; timeMs: number };


type UIModule = PromptModule<{

}>;

type BaseUIModule = PromptModule<{

}>;

type UICarrerModule = PromptModule<{
  modules: [BaseUIModule];
}>;

type UIMultiplayerModule = PromptModule<{
  modules: [BaseUIModule];
}>;


type LogicModule = PromptModule<{
  prompt: "generates and manipulate Water Sort game states. must output valid game logic, enforce rules, and ensure all moves follow puzzle constraints.";
  api: {
    generateLevel: (difficulty: number) => GameState;
    applyMove: (state: GameState, move: Move) => GameState;
    isSolved: (state: GameState) => boolean;
  };
  types: {
    Bottle: Bottle;
    GameState: GameState;
    Move: Move;
  };
}>;

type SolverModule = PromptModule<{
  prompt: "analyzes a Water Sort game state and produces an optimal sequence of moves that solves the puzzle.";
  api: {
    solve: (state: GameState) => Move[];
  };
}>;


type StateModule = PromptModule<{
  prompt: "orchestrates LogicModule and SolverModule into a cohesive game state service with internal current-state tracking.";
  api: {
    newGame: (difficulty: number) => GameState;
    getState: () => GameState;
    applyMove: (move: Move) => GameState;
    isSolved: () => boolean;
    solveCurrent: () => Move[];
  };
  types: {
    GameState: GameState;
    Move: Move;
  };
  modules: [LogicModule, SolverModule];
}>;


type GameModesModule = PromptModule<{
  prompt: "manages game modes (career, multiplayer) and delegates concrete behavior to other modules via their APIs.";
  api: {
    getAvailableModes: () => ("career" | "multiplayer")[];
    setMode: (mode: "career" | "multiplayer") => void;
    getCurrentMode: () => "career" | "multiplayer";
    startModeSession: (mode: "career" | "multiplayer", difficulty: number) => void;
  };
  modules: [StateModule];
}>;


type AchievementsModule = PromptModule<{
  prompt: "tracks and awards achievements in career mode based on player progress, difficulty, streaks, and performance.";
  api: {
    unlockAchievement: (id: string) => void;
    listAchievements: () => Array<Achievement>;
    isUnlocked: (id: string) => boolean;
  };
  types: {
    Achievement: Achievement;
  };
}>;

type CareerModule = PromptModule<{
  prompt: "implements career mode on top of StateModule and AchievementsModule: level progression, win recording, and achievement unlocking.";
  api: {
    startNextLevel: (difficulty: number) => void;
    completeCurrentLevel: (timeMs: number, moves: number) => void;
    getCareerProgress: () => {
      levelIndex: number;
      unlockedAchievements: string[];
    };
  };
  modules: [StateModule, AchievementsModule];
}>;


type MultiplayerModule = PromptModule<{
  prompt: "implements serverless multiplayer: generate solvable levels from a seed, create sharable URLs, coordinate start time and duration, and collect named results.";
  api: {
    createMatch: (seed: string, startTime: number, durationMs: number) => string;
    joinMatchFromURL: (url: string, playerName: string) => void;
    submitResult: (playerName: string, moves: number, timeMs: number) => void;
    getResults: () => Array<{ playerName: string; moves: number; timeMs: number }>;
  };
  types: {
    MultiplayerResult: MultiplayerResult;
  };
  modules: [StateModule];
}>;


type HelpFromFriendModule = PromptModule<{
  prompt: "implements 'get help from a friend': share the current level and accept a hashed solution to finish the current level.";
  api: {
    createHelpLinkForCurrentState: () => string;
    submitHashedSolutionForCurrentState: (hash: string) => boolean;
  };
  modules: [StateModule];
}>;

type SocialModule = PromptModule<{
  prompt: "coordinates social features such as 'get help from a friend' and sharing multiplayer results, using other modules only via their APIs.";
  api: {
    getHelpFromFriendLink: () => string;
    applyFriendSolution: (hash: string) => boolean;
    shareMultiplayerMatchURL: (url: string) => void;
  };
  modules: [HelpFromFriendModule, MultiplayerModule];
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


type PromptModule<T extends {
  prompt: string;
  api: Record<string, any>;
  types?: Record<string, any>;
  modules?: PromptModule<any>[];
}> = T;



type Toplevel<T extends {
  prompt: string;
  modules: PromptModule<any>[];
  targetLanguage: string;
  skeleton?: string;
  targetFilename?: string;
}> = T;
