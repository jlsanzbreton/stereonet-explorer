import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlusIcon from '@/ui/icons/PlusIcon';
import CsvDrop from '@/features/import/CsvDrop';
import { useStereonetStore } from '@/state/store';

const InputPanel: React.FC = () => {
    const { t } = useTranslation();
    const addPlane = useStereonetStore(state => state.addPlane);
    const addLine = useStereonetStore(state => state.addLine);
    const [planeDipDir, setPlaneDipDir] = useState<number>(45);
    const [planeDip, setPlaneDip] = useState<number>(30);
    const [lineTrend, setLineTrend] = useState<number>(120);
    const [linePlunge, setLinePlunge] = useState<number>(25);

    const handleAddPlane = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPlane({ dipDirection: planeDipDir, dip: planeDip });
    };

    const handleAddLine = async (e: React.FormEvent) => {
        e.preventDefault();
        await addLine({ trend: lineTrend, plunge: linePlunge });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg space-y-6">
            <form onSubmit={handleAddPlane} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('input.plane.title')}</h3>
                <div className="flex items-center space-x-2">
                    <label htmlFor="dipDir" className="w-28 font-medium text-sm">{t('labels.dipDirection')}</label>
                    <input
                        id="dipDir"
                        type="number"
                        value={planeDipDir}
                        onChange={e => setPlaneDipDir(Math.max(0, Math.min(360, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="360"
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="dip" className="w-28 font-medium text-sm">{t('labels.dip')}</label>
                    <input
                        id="dip"
                        type="number"
                        value={planeDip}
                        onChange={e => setPlaneDip(Math.max(0, Math.min(90, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="90"
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200">
                    <PlusIcon />
                    {t('input.plane.submit')}
                </button>
            </form>
            <form onSubmit={handleAddLine} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('input.line.title')}</h3>
                <div className="flex items-center space-x-2">
                    <label htmlFor="trend" className="w-28 font-medium text-sm">{t('labels.trend')}</label>
                    <input
                        id="trend"
                        type="number"
                        value={lineTrend}
                        onChange={e => setLineTrend(Math.max(0, Math.min(360, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="360"
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="plunge" className="w-28 font-medium text-sm">{t('labels.plunge')}</label>
                    <input
                        id="plunge"
                        type="number"
                        value={linePlunge}
                        onChange={e => setLinePlunge(Math.max(0, Math.min(90, parseInt(e.target.value, 10))))}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="0" max="90"
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 transition duration-200">
                    <PlusIcon />
                    {t('input.line.submit')}
                </button>
            </form>
            <div className="border-t pt-4">
                <CsvDrop />
            </div>
        </div>
    );
};

export default InputPanel;
