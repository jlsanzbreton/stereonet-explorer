
export enum ProjectionType {
    Wulff = 'wulff',
    Schmidt = 'schmidt',
}

interface BaseData {
    id: string;
    type: 'plane' | 'line';
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
