import type { RendererBootstrapController } from './bootstrap.ts';

export interface HtmlMountTarget {
  innerHTML: string;
}

export interface MountedRendererApp {
  mount(): void;
  rerender(): void;
}

export function createMountedRendererApp(target: HtmlMountTarget, controller: RendererBootstrapController): MountedRendererApp {
  return {
    mount() {
      target.innerHTML = controller.render();
    },

    rerender() {
      target.innerHTML = controller.render();
    },
  };
}
