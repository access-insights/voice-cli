import { bootRenderer } from './boot-script.ts';
import type { BindableDocumentLike } from './dom-bindings.ts';
import type { WindowLikeWithVoiceCli } from './startup-entry.ts';

export function runPageScript(windowLike: WindowLikeWithVoiceCli, documentLike: BindableDocumentLike) {
  return bootRenderer(windowLike, documentLike);
}
