import type { DetailRequestResult } from '../session/detail-requests.ts';

export interface DetailViewState {
  selectedDetail: DetailRequestResult | null;
}

export function createEmptyDetailState(): DetailViewState {
  return {
    selectedDetail: null,
  };
}
