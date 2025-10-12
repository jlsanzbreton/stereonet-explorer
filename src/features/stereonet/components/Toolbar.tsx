import React from 'react';
import { ProjectionType } from '../model/types';

interface ToolbarProps {
    projection: ProjectionType;
    setProjection: (p: ProjectionType) => void;
    showGrid: boolean;
    setShowGrid: (s: boolean) => void;
    showPoles: boolean;
    setShowPoles: (s: boolean) => void;
    onClear: () => void;
    onLoadSample: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ projection, setProjection, showGrid, setShowGrid, showPoles, setShowPoles, onClear, onLoadSample }) => {

    const ToggleButton: React.FC<{ label: string; value: string; current: string; onClick: (value: string) => void; }> = ({ label, value, current, onClick }) => (
        <button
            onClick={() => onClick(value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${current === value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
        <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
            <span>{label}</span>
        </label>
    );
    
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-2 border-b mb-4">
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">Projection:</span>
                <div className="flex items-center bg-gray-200 rounded-md">
                    <ToggleButton label="Equal-Area (Schmidt)" value={ProjectionType.Schmidt} current={projection} onClick={(v) => setProjection(v as ProjectionType)} />
                    <ToggleButton label="Equal-Angle (Wulff)" value={ProjectionType.Wulff} current={projection} onClick={(v) => setProjection(v as ProjectionType)} />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Checkbox label="Show Grid" checked={showGrid} onChange={setShowGrid}/>
                <Checkbox label="Show Poles" checked={showPoles} onChange={setShowPoles}/>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onLoadSample} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Load Sample</button>
                <button onClick={onClear} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Clear All</button>
            </div>
        </div>
    );
};

export default Toolbar;
