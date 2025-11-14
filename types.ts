export interface ModelData {
  description: string;
  gender: string;
  age: number;
  expression: string;
  outfit: string;
  tones: string;
  isSensual: boolean;
  pose: string;
}

export interface SceneData {
  location: string;
  lighting: string;
  mood: string;
  details: string;
  shotType: string;
}

export interface ReferenceData {
  photo: File | null;
  usePhoto: boolean;
  useStyle: boolean;
  useComposition: boolean;
  keepOverlays: boolean;
}

export interface OverlayData {
  id: number;
  file: File | null;
  preview: string | null;
  x: number;
  y: number;
  scale: number;
}

export type CreationMode = 'auto' | 'manual';