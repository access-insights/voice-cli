import type { RendererSessionApi } from './live-renderer.ts';
import { createRendererBootstrap } from './bootstrap.ts';
import { createMountedRendererApp, type HtmlMountTarget } from './mounted-app.ts';

export interface AppLoopController {
  start(prompt: string): Promise<string>;
  getHtml(): string;
}

export function createAppLoop(sessionApi: RendererSessionApi, target: HtmlMountTarget): AppLoopController {
  const bootstrap = createRendererBootstrap(sessionApi);
  const mounted = createMountedRendererApp(target, bootstrap);
  bootstrap.subscribe();
  mounted.mount();

  return {
    async start(prompt: string) {
      if ('start' in sessionApi && typeof (sessionApi as RendererSessionApi & { start?: (prompt: string) => Promise<unknown> }).start === 'function') {
        await (sessionApi as RendererSessionApi & { start: (prompt: string) => Promise<unknown> }).start(prompt);
      }
      mounted.rerender();
      return target.innerHTML;
    },

    getHtml() {
      return target.innerHTML;
    },
  };
}
