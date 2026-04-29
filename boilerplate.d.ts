type PromptModuleConfig = {
  prompt: string;
  api?: Record<string, any>;
  types?: Record<string, any>;
  modules?: PromptModule<any>[];
};

export type PromptModule<T extends PromptModuleConfig> = T;

type ToplevelConfig = {
  prompt: string;
  modules: PromptModule<any>[];
  targetLanguage: string;
  skeleton?: string;
  targetFilename?: string;
};

export type Toplevel<T extends ToplevelConfig> = T;