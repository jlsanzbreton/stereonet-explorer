
import { StructuralData } from './types';
import { v4 as uuidv4 } from 'uuid';

export const COLORS = {
    PLANE: '#e63946',
    LINE: '#457b9d',
    POLE: '#1d3557',
    GRID_MAJOR: '#cccccc',
    GRID_MINOR: '#e0e0e0',
};

export const SAMPLE_DATA: StructuralData[] = [
    { id: uuidv4(), type: 'plane', dipDirection: 45, dip: 35 },
    { id: uuidv4(), type: 'line', trend: 120, plunge: 25 },
    { id: uuidv4(), type: 'plane', dipDirection: 310, dip: 60 },
    { id: uuidv4(), type: 'plane', dipDirection: 180, dip: 90 }, // Vertical plane
    { id: uuidv4(), type: 'line', trend: 270, plunge: 0 }, // Horizontal line
];
