import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlusIcon from '@/ui/icons/PlusIcon';
import CsvDrop from '@/features/import/CsvDrop';
import {
  selectDefaultLayerId,
  selectLayers,
  useStereonetStore,
} from '@/state/store';

const InputPanel: React.FC = () => {
    const { t } = useTranslation();
    const addPlane = useStereonetStore(state => state.addPlane);
    const addLine = useStereonetStore(state => state.addLine);
    const ensureDefaultLayers = useStereonetStore(state => state.ensureDefaultLayers);
    const layers = useStereonetStore(selectLayers);
    const defaultLayerId = useStereonetStore(selectDefaultLayerId);
    const [planeDipDir, setPlaneDipDir] = useState<number>(45);
    const [planeDip, setPlaneDip] = useState<number>(30);
    const [lineTrend, setLineTrend] = useState<number>(120);
    const [linePlunge, setLinePlunge] = useState<number>(25);
    const [planeLatitude, setPlaneLatitude] = useState<string>('');
    const [planeLongitude, setPlaneLongitude] = useState<string>('');
    const [lineLatitude, setLineLatitude] = useState<string>('');
    const [lineLongitude, setLineLongitude] = useState<string>('');
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

    useEffect(() => {
        void ensureDefaultLayers();
    }, [ensureDefaultLayers]);

    useEffect(() => {
        if (selectedLayerId === null && typeof defaultLayerId === 'number') {
            setSelectedLayerId(defaultLayerId);
        }
    }, [defaultLayerId, selectedLayerId]);

    const availableLayers = useMemo(() => layers, [layers]);

    const parseCoordinate = (value: string, min: number, max: number): number | null => {
        if (value.trim() === '') {
            return null;
        }
        const num = Number.parseFloat(value);
        if (!Number.isFinite(num)) {
            return null;
        }
        return Math.max(min, Math.min(max, num));
    };

    const handleAddPlane = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPlane({
            dipDirection: planeDipDir,
            dip: planeDip,
            latitude: parseCoordinate(planeLatitude, -90, 90),
            longitude: parseCoordinate(planeLongitude, -180, 180),
            layerId: selectedLayerId ?? defaultLayerId ?? undefined,
        });
        setPlaneLatitude('');
        setPlaneLongitude('');
    };

    const handleAddLine = async (e: React.FormEvent) => {
        e.preventDefault();
        await addLine({
            trend: lineTrend,
            plunge: linePlunge,
            latitude: parseCoordinate(lineLatitude, -90, 90),
            longitude: parseCoordinate(lineLongitude, -180, 180),
            layerId: selectedLayerId ?? defaultLayerId ?? undefined,
        });
        setLineLatitude('');
        setLineLongitude('');
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
                <div className="flex items-center space-x-2">
                    <label htmlFor="plane-latitude" className="w-28 font-medium text-sm">
                        {t('labels.latitude')}
                    </label>
                    <input
                        id="plane-latitude"
                        type="number"
                        value={planeLatitude}
                        onChange={e => setPlaneLatitude(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="-90"
                        max="90"
                        step="0.0001"
                        placeholder={t('input.coordinates.placeholder')}
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="plane-longitude" className="w-28 font-medium text-sm">
                        {t('labels.longitude')}
                    </label>
                    <input
                        id="plane-longitude"
                        type="number"
                        value={planeLongitude}
                        onChange={e => setPlaneLongitude(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="-180"
                        max="180"
                        step="0.0001"
                        placeholder={t('input.coordinates.placeholder')}
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
                <div className="flex items-center space-x-2">
                    <label htmlFor="line-latitude" className="w-28 font-medium text-sm">
                        {t('labels.latitude')}
                    </label>
                    <input
                        id="line-latitude"
                        type="number"
                        value={lineLatitude}
                        onChange={e => setLineLatitude(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="-90"
                        max="90"
                        step="0.0001"
                        placeholder={t('input.coordinates.placeholder')}
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="line-longitude" className="w-28 font-medium text-sm">
                        {t('labels.longitude')}
                    </label>
                    <input
                        id="line-longitude"
                        type="number"
                        value={lineLongitude}
                        onChange={e => setLineLongitude(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        min="-180"
                        max="180"
                        step="0.0001"
                        placeholder={t('input.coordinates.placeholder')}
                    />
                    <span className="text-gray-500">{t('units.degree')}</span>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 transition duration-200">
                    <PlusIcon />
                    {t('input.line.submit')}
                </button>
            </form>
            <div className="border-t pt-4">
                <label htmlFor="orientation-layer" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('input.layer.label')}
                </label>
                <select
                    id="orientation-layer"
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedLayerId ?? ''}
                    onChange={(event) => {
                        const value = event.target.value;
                        setSelectedLayerId(value === '' ? null : Number.parseInt(value, 10));
                    }}
                >
                    <option value="">
                        {t('input.layer.placeholder')}
                    </option>
                    {availableLayers.map(layer => (
                        <option key={layer.id} value={layer.id}>
                            {layer.name}
                        </option>
                    ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                    {t('input.layer.helper')}
                </p>
            </div>
            <div className="border-t pt-4">
                <CsvDrop />
            </div>
        </div>
    );
};

export default InputPanel;
