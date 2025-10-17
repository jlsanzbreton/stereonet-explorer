import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputPanel from '@/features/stereonet/components/InputPanel';
import StereonetCanvas from '@/features/stereonet/components/StereonetCanvas';
import DataTable from '@/features/stereonet/components/DataTable';
import Toolbar from '@/features/stereonet/components/Toolbar';
import { useStereonetStore } from '@/state/store';
import TopNav from '@/ui/TopNav';
import MapView from '@/features/map/MapView';

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
            <main className="flex-grow p-4">
                <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-[22rem,minmax(0,1fr),24rem]">
                    <aside className="flex flex-col gap-4">
                        <InputPanel />
                    </aside>
                    <section className="flex flex-col gap-4">
                        <div className="flex flex-col rounded-lg bg-white p-4 shadow-lg min-h-[420px]">
                            <Toolbar stereonetRef={stereonetRef} />
                            <div className="flex-grow">
                                <StereonetCanvas ref={stereonetRef} />
                            </div>
                        </div>
                    </section>
                    <aside className="flex flex-col gap-4">
                        <div className="rounded-lg bg-white p-4 shadow-lg">
                            <MapView />
                        </div>
                        <DataTable />
                    </aside>
                </div>
            </main>
            <footer className="text-center p-4 text-sm text-gray-500">
                <p>{t('footer.note')}</p>
            </footer>
        </div>
    );
};

export default App;
