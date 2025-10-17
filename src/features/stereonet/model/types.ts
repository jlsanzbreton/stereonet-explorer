
export enum ProjectionType {
    Wulff = 'wulff',
    Schmidt = 'schmidt',
}

interface BaseData {
    id: number | string;
    type: 'plane' | 'line';
    latitude?: number | null;
    longitude?: number | null;
    layerId?: number | null;
    layerName?: string;
    layerColor?: string;
    layerOpacity?: number;
    layerVisible?: boolean;
    notes?: string | null;
    createdAt?: number;
}

export interface Plane extends BaseData {
    type: 'plane';
    dipDirection: number;
    dip: number;
}

export interface Line extends BaseData {
    type: 'line';
    trend: number;
    plunge: number;
}

export type StructuralData = Plane | Line;

export interface Point {
    x: number;
    y: number;
}
