import { startRendererApp, type WindowLikeWithVoiceCli } from './startup-entry.ts';
import type { BindableDocumentLike } from './dom-bindings.ts';

export function bootRenderer(windowLike: WindowLikeWithVoiceCli, documentLike: BindableDocumentLike) {
  return startRendererApp(windowLike, documentLike);
}
