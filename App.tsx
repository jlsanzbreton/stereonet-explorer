
import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import InputPanel from './components/InputPanel';
import Stereonet from './components/Stereonet';
import DataTable from './components/DataTable';
import Toolbar from './components/Toolbar';
import { StructuralData, ProjectionType, Plane, Line } from './types';
import { SAMPLE_DATA } from './constants';

const App: React.FC = () => {
    const [data, setData] = useState<StructuralData[]>(SAMPLE_DATA);
    const [projection, setProjection] = useState<ProjectionType>(ProjectionType.Schmidt);
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [showPoles, setShowPoles] = useState<boolean>(true);

    const handleAddData = useCallback((item: Omit<Plane, 'id' | 'type' | 'color'> | Omit<Line, 'id' | 'type' | 'color'>, type: 'plane' | 'line') => {
        const newItem = {
            ...item,
            id: uuidv4(),
            type,
        } as StructuralData;
        setData(prevData => [...prevData, newItem]);
    }, []);

    const handleRemoveData = useCallback((id: string) => {
        setData(prevData => prevData.filter(item => item.id !== id));
    }, []);

    const handleClearData = useCallback(() => {
        setData([]);
    }, []);

    const handleLoadSampleData = useCallback(() => {
        setData(SAMPLE_DATA);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 011.414-1.414zm10 0l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
                    <h1 className="text-2xl font-bold text-gray-700">Stereonet Explorer</h1>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
                <div className="w-full lg:w-80 flex-shrink-0">
                    <InputPanel onAddData={handleAddData} />
                </div>
                <div className="flex-grow flex flex-col bg-white rounded-lg shadow-lg p-4 min-h-[500px] lg:min-h-0">
                    <Toolbar
                        projection={projection}
                        setProjection={setProjection}
                        showGrid={showGrid}
                        setShowGrid={setShowGrid}
                        showPoles={showPoles}
                        setShowPoles={setShowPoles}
                        onClear={handleClearData}
                        onLoadSample={handleLoadSampleData}
                    />
                    <div className="flex-grow w-full h-full flex items-center justify-center">
                        <Stereonet data={data} projection={projection} showGrid={showGrid} showPoles={showPoles} />
                    </div>
                </div>
                 <div className="w-full lg:w-96 flex-shrink-0">
                     <DataTable data={data} onRemove={handleRemoveData} />
                </div>
            </main>
            <footer className="text-center p-4 text-sm text-gray-500">
                <p>Built for structural geology analysis. All projections are lower-hemisphere.</p>
            </footer>
        </div>
    );
};

export default App;
