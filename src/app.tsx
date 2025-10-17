import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputPanel from '@/features/stereonet/components/InputPanel';
import StereonetCanvas from '@/features/stereonet/components/StereonetCanvas';
import DataTable from '@/features/stereonet/components/DataTable';
import Toolbar from '@/features/stereonet/components/Toolbar';
import { useStereonetStore } from '@/state/store';
import TopNav from '@/ui/TopNav';

const App: React.FC = () => {
    const { t } = useTranslation();
    const loadInitialData = useStereonetStore(state => state.loadInitialData);
    const isInitialized = useStereonetStore(state => state.isInitialized);
    const stereonetRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!isInitialized) {
            void loadInitialData();
        }
    }, [isInitialized, loadInitialData]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
            <TopNav />
            <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
                <div className="w-full lg:w-80 flex-shrink-0">
                    <InputPanel />
                </div>
                <div className="flex-grow flex flex-col bg-white rounded-lg shadow-lg p-4 min-h-[500px] lg:min-h-0">
                    <Toolbar stereonetRef={stereonetRef} />
                    <div className="flex-grow w-full h-full flex items-center justify-center">
                        <StereonetCanvas ref={stereonetRef} />
                    </div>
                </div>
                <div className="w-full lg:w-96 flex-shrink-0">
                    <DataTable />
                </div>
            </main>
            <footer className="text-center p-4 text-sm text-gray-500">
                <p>{t('footer.note')}</p>
            </footer>
        </div>
    );
};

export default App;
