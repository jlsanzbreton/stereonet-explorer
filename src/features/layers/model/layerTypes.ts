export type LayerKind = 'stereonet' | 'map' | 'analysis';

export interface LayerStyle {
  color: string;
  opacity: number;
  visible: boolean;
}

export interface LayerMetadata {
  description?: string;
  tags?: string[];
  // TODO(rfc-2025-11): extend with dataset provenance and collaboration metadata.
}

export interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  style: LayerStyle;
  metadata?: LayerMetadata;
}

export const DEFAULT_LAYER_STYLE: LayerStyle = {
  color: '#2563eb',
  opacity: 1,
  visible: true,
};
