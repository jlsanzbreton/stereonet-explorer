import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectionType } from '../model/types';
import { useStereonetStore } from '@/state/store';

const Toolbar: React.FC = () => {
    const { t } = useTranslation();
    const projection = useStereonetStore(state => state.projection);
    const setProjection = useStereonetStore(state => state.setOrientationProjection);
    const showGrid = useStereonetStore(state => state.showGrid);
    const setShowGrid = useStereonetStore(state => state.setShowGrid);
    const showPoles = useStereonetStore(state => state.showPoles);
    const setShowPoles = useStereonetStore(state => state.setShowPoles);
    const clearAll = useStereonetStore(state => state.clearAll);
    const loadSample = useStereonetStore(state => state.loadSample);

    const handleProjectionChange = (value: ProjectionType) => {
        setProjection(value);
    };

    const handleLoadSample = () => {
        void loadSample({ force: true });
    };

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
                <span className="text-sm font-semibold">{t('toolbar.projection.label')}</span>
                <div className="flex items-center bg-gray-200 rounded-md">
                    <ToggleButton label={t('toolbar.projection.equalArea')} value={ProjectionType.Schmidt} current={projection} onClick={(v) => handleProjectionChange(v as ProjectionType)} />
                    <ToggleButton label={t('toolbar.projection.equalAngle')} value={ProjectionType.Wulff} current={projection} onClick={(v) => handleProjectionChange(v as ProjectionType)} />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Checkbox label={t('toolbar.options.showGrid')} checked={showGrid} onChange={setShowGrid}/>
                <Checkbox label={t('toolbar.options.showPoles')} checked={showPoles} onChange={setShowPoles}/>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleLoadSample} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">{t('toolbar.actions.loadSample')}</button>
                <button onClick={() => { void clearAll(); }} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">{t('toolbar.actions.clearAll')}</button>
            </div>
        </div>
    );
};

export default Toolbar;
