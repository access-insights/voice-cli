import type { DomRendererController, MinimalDocumentLike } from './dom-entry.ts';

export interface BindableElement {
  addEventListener(event: string, handler: (event: { preventDefault(): void }) => void): void;
  value?: string;
}

export interface BindableDocumentLike extends MinimalDocumentLike {
  getElementById(id: string): ({ innerHTML: string } & Partial<BindableElement>) | null;
}

export function bindSessionStartForm(documentLike: BindableDocumentLike, controller: DomRendererController): void {
  const form = documentLike.getElementById('session-start-form');
  const promptInput = documentLike.getElementById('session-start-prompt');

  if (!form || typeof form.addEventListener !== 'function') {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = typeof promptInput?.value === 'string' && promptInput.value.length > 0
      ? promptInput.value
      : 'Summarize the current project state.';
    await controller.start(prompt);
  });
}
