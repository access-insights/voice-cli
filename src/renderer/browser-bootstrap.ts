import { createDomRenderer, type MinimalDocumentLike } from './dom-entry.ts';
import { bindSessionStartForm, type BindableDocumentLike } from './dom-bindings.ts';
import type { RendererSessionApi } from './live-renderer.ts';

export interface BrowserBootstrapOptions {
  documentLike: BindableDocumentLike;
  sessionApi: RendererSessionApi;
}

export interface BrowserBootstrapResult {
  mounted: boolean;
  bindingsApplied: boolean;
  initialHtml: string;
}

export function bootstrapBrowserRenderer(options: BrowserBootstrapOptions): BrowserBootstrapResult {
  const controller = createDomRenderer(options.sessionApi, options.documentLike as MinimalDocumentLike);
  const initialHtml = controller.mount();
  bindSessionStartForm(options.documentLike, controller);

  return {
    mounted: true,
    bindingsApplied: true,
    initialHtml,
  };
}
