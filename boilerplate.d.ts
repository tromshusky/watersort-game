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
export type PWASkeleton = `
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