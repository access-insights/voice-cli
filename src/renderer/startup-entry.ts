import { bootstrapBrowserRenderer } from './browser-bootstrap.ts';
import type { BindableDocumentLike } from './dom-bindings.ts';
import type { RendererSessionApi } from './live-renderer.ts';

export interface WindowLikeWithVoiceCli {
  voiceCli?: {
    session: RendererSessionApi;
  };
}

export function startRendererApp(windowLike: WindowLikeWithVoiceCli, documentLike: BindableDocumentLike) {
  const sessionApi = windowLike.voiceCli?.session;
  if (!sessionApi) {
    throw new Error('voiceCli session API is not available on window.');
  }

  return bootstrapBrowserRenderer({
    documentLike,
    sessionApi,
  });
}
