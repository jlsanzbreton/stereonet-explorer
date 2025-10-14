import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import InputPanel from '@/features/stereonet/components/InputPanel';
import StereonetCanvas from '@/features/stereonet/components/StereonetCanvas';
import DataTable from '@/features/stereonet/components/DataTable';
import Toolbar from '@/features/stereonet/components/Toolbar';
import { StructuralData, ProjectionType, Plane, Line } from '@/features/stereonet/model/types';
import { SAMPLE_DATA } from '@/features/stereonet/model/transforms';
import TopNav from '@/ui/TopNav';

const App: React.FC = () => {
    const { t } = useTranslation();
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
            <TopNav />

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
                        <StereonetCanvas data={data} projection={projection} showGrid={showGrid} showPoles={showPoles} />
                    </div>
                </div>
                <div className="w-full lg:w-96 flex-shrink-0">
                    <DataTable data={data} onRemove={handleRemoveData} />
                </div>
            </main>
            <footer className="text-center p-4 text-sm text-gray-500">
                <p>{t('footer.note')}</p>
            </footer>
        </div>
    );
};

export default App;
