import type { AppLoopController } from './app-loop.ts';
import { createAppLoop } from './app-loop.ts';
import type { RendererSessionApi } from './live-renderer.ts';

export interface MinimalDocumentLike {
  getElementById(id: string): { innerHTML: string } | null;
}

export interface DomRendererController {
  mount(): string;
  start(prompt: string): Promise<string>;
}

export function createDomRenderer(sessionApi: RendererSessionApi, documentLike: MinimalDocumentLike): DomRendererController {
  const target = documentLike.getElementById('app');
  if (!target) {
    throw new Error('Missing #app mount target.');
  }

  const loop: AppLoopController = createAppLoop(sessionApi, target);

  return {
    mount() {
      return loop.getHtml();
    },

    start(prompt: string) {
      return loop.start(prompt);
    },
  };
}
