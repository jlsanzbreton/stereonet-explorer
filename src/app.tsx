import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputPanel from '@/features/stereonet/components/InputPanel';
import StereonetCanvas from '@/features/stereonet/components/StereonetCanvas';
import DataTable from '@/features/stereonet/components/DataTable';
import Toolbar from '@/features/stereonet/components/Toolbar';
import { useStereonetStore } from '@/state/store';
import TopNav from '@/ui/TopNav';
import MapView from '@/features/map/MapView';
import LayerManager from '@/features/layers/LayerManager';
import Viewport from '@/ui/Viewport';
import MobileTabs from '@/ui/MobileTabs';
import DesktopSplitPane from '@/ui/DesktopSplitPane';

const App: React.FC = () => {
    const { t } = useTranslation();
    const loadInitialData = useStereonetStore(state => state.loadInitialData);
    const isInitialized = useStereonetStore(state => state.isInitialized);
    const stereonetRef = useRef<SVGSVGElement | null>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<'stereonet' | 'map'>('stereonet');

    const mobileTabs = useMemo(
        () => [
            { id: 'stereonet', label: t('shell.tabs.stereonet') },
            { id: 'map', label: t('shell.tabs.map') },
        ],
        [t]
    );

    useEffect(() => {
        if (!isInitialized) {
            void loadInitialData();
        }
    }, [isInitialized, loadInitialData]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (activeMobileTab === 'map') {
            window.dispatchEvent(new Event('resize'));
        }
    }, [activeMobileTab]);

    const renderStereonetPane = () => (
        <div className="flex flex-col gap-4 pb-16 lg:pb-0">
            <InputPanel />
            <div className="flex min-h-[22rem] flex-col rounded-lg bg-white p-4 shadow-lg">
                <Toolbar stereonetRef={stereonetRef} />
                <div className="mt-4 flex-1">
                    <StereonetCanvas
                        ref={stereonetRef}
                        isVisible={activeMobileTab === 'stereonet'}
                    />
                </div>
            </div>
            <div className="lg:flex lg:flex-1">
                <DataTable />
            </div>
        </div>
    );

    const renderMapPane = () => (
        <div className="flex flex-col gap-4 pb-16 lg:pb-0">
            <div className="flex min-h-[22rem] flex-col rounded-lg bg-white p-4 shadow-lg lg:min-h-0 lg:flex-1">
                <MapView />
            </div>
            <LayerManager />
        </div>
    );

    return (
        <Viewport className="bg-gray-50 text-gray-800">
            <div className="flex min-h-[var(--app-100dvh,100dvh)] flex-col">
                <TopNav />
                <main className="flex-1 overflow-hidden">
                    <div className="mx-auto flex h-full max-w-screen-2xl flex-col">
                        <MobileTabs
                            tabs={mobileTabs}
                            activeTab={activeMobileTab}
                            onChange={setActiveMobileTab}
                            ariaLabel={t('shell.tabs.ariaLabel')}
                        />
                        <div className="flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
                            <DesktopSplitPane
                                activePane={activeMobileTab}
                                stereonetPane={renderStereonetPane()}
                                mapPane={renderMapPane()}
                            />
                        </div>
                    </div>
                </main>
                <footer className="border-t border-gray-200 bg-white/70 p-4 text-center text-sm text-gray-500 backdrop-blur">
                    <p>{t('footer.note')}</p>
                </footer>
            </div>
        </Viewport>
    );
};

export default App;
