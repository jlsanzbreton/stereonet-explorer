import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputPanel from '@/features/stereonet/components/InputPanel';
import StereonetCanvas from '@/features/stereonet/components/StereonetCanvas';
import DataTable from '@/features/stereonet/components/DataTable';
import Toolbar from '@/features/stereonet/components/Toolbar';
import { useStereonetStore } from '@/state/store';
import TopNav from '@/ui/TopNav';
import MapView from '@/features/map/MapView';
import LayerManager from '@/features/layers/LayerManager';

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
                <div className="mx-auto grid w-full max-w-screen-2xl gap-4 lg:grid-cols-[minmax(20rem,24rem),minmax(0,1fr)] 2xl:grid-cols-[minmax(20rem,24rem),minmax(0,1fr),minmax(18rem,24rem)]">
                    <aside className="flex flex-col gap-4">
                        <InputPanel />
                    </aside>
                    <section className="flex flex-col gap-4">
                        <div className="flex min-h-[420px] flex-col rounded-lg bg-white p-4 shadow-lg">
                            <Toolbar stereonetRef={stereonetRef} />
                            <div className="flex-grow">
                                <StereonetCanvas ref={stereonetRef} />
                            </div>
                        </div>
                    </section>
                    <aside className="flex flex-col gap-4 2xl:col-auto xl:col-span-2 xl:flex-row xl:items-start xl:gap-4 2xl:flex-col">
                        <div className="w-full xl:max-w-sm 2xl:max-w-none">
                            <LayerManager />
                        </div>
                        <div className="flex w-full flex-col gap-4 xl:flex-1 2xl:w-full">
                            <div className="rounded-lg bg-white p-4 shadow-lg">
                                <MapView />
                            </div>
                            <DataTable />
                        </div>
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
