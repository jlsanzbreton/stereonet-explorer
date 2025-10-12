
import React, { useState } from 'react';
import { Plane, Line } from '../types';
import PlusIcon from './icons/PlusIcon';

interface InputPanelProps {
    onAddData: (item: Omit<Plane, 'id' | 'type' | 'color'> | Omit<Line, 'id' | 'type' | 'color'>, type: 'plane' | 'line') => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onAddData }) => {
    const [planeDipDir, setPlaneDipDir] = useState<number>(45);
    const [planeDip, setPlaneDip] = useState<number>(30);
    const [lineTrend, setLineTrend] = useState<number>(120);
    const [linePlunge, setLinePlunge] = useState<number>(25);

    const handleAddPlane = (e: React.FormEvent) => {
        e.preventDefault();
        onAddData({ dipDirection: planeDipDir, dip: planeDip }, 'plane');
    };

    const handleAddLine = (e: React.FormEvent) => {
        e.preventDefault();
        onAddData({ trend: lineTrend, plunge: linePlunge }, 'line');
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg space-y-6">
            <form onSubmit={handleAddPlane} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Add Plane</h3>
                <div className="flex items-center space-x-2">
                    <label htmlFor="dipDir" className="w-28 font-medium text-sm">Dip Direction</label>
                    <input
                        id="dipDir"
                        type="number"
                        value={planeDipDir}
                        onChange={e => setPlaneDipDir(Math.max(0, Math.min(360, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="360"
                    />
                    <span className="text-gray-500">°</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="dip" className="w-28 font-medium text-sm">Dip</label>
                    <input
                        id="dip"
                        type="number"
                        value={planeDip}
                        onChange={e => setPlaneDip(Math.max(0, Math.min(90, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="90"
                    />
                    <span className="text-gray-500">°</span>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200">
                    <PlusIcon />
                    Add Plane
                </button>
            </form>
            <form onSubmit={handleAddLine} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Add Line</h3>
                <div className="flex items-center space-x-2">
                    <label htmlFor="trend" className="w-28 font-medium text-sm">Trend</label>
                    <input
                        id="trend"
                        type="number"
                        value={lineTrend}
                        onChange={e => setLineTrend(Math.max(0, Math.min(360, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="360"
                    />
                    <span className="text-gray-500">°</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="plunge" className="w-28 font-medium text-sm">Plunge</label>
                    <input
                        id="plunge"
                        type="number"
                        value={linePlunge}
                        onChange={e => setLinePlunge(Math.max(0, Math.min(90, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="90"
                    />
                    <span className="text-gray-500">°</span>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 transition duration-200">
                     <PlusIcon />
                    Add Line
                </button>
            </form>
        </div>
    );
};

export default InputPanel;