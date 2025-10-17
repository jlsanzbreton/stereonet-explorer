export type LayerKind = 'stereonet' | 'map' | 'analysis';

export interface LayerMetadata {
  description?: string;
  tags?: string[];
  // TODO(rfc-2025-11): extend with dataset provenance and collaboration metadata.
}

export interface LayerStyle {
  color: string;
  opacity: number;
}

export interface Layer {
  id: number;
  name: string;
  kind: LayerKind;
  color: string;
  opacity: number;
  visible: boolean;
  createdAt: number;
  metadata?: LayerMetadata;
}

export const DEFAULT_LAYER_COLOR = '#2563eb';
export const DEFAULT_LAYER_OPACITY = 1;
