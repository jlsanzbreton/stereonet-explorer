import React from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../model/transforms';
import TrashIcon from '@/ui/icons/TrashIcon';
import {
  selectSelectedOrientationId,
  selectStructuralData,
  useStereonetStore,
} from '@/state/store';

const DataTable: React.FC = () => {
    const { t } = useTranslation();
    const data = useStereonetStore(selectStructuralData);
    const removeById = useStereonetStore(state => state.removeById);
    const selectedOrientationId = useStereonetStore(selectSelectedOrientationId);
    const setSelectedOrientationId = useStereonetStore(state => state.setSelectedOrientationId);
    const degreeSymbol = t('units.degree');
    return (
        <div className="bg-white p-4 rounded-lg shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{t('table.title')}</h3>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2">{t('table.headers.type')}</th>
                            <th scope="col" className="px-4 py-2">{t('table.headers.azimuth')}</th>
                            <th scope="col" className="px-4 py-2">{t('table.headers.inclination')}</th>
                            <th scope="col" className="px-4 py-2">{t('table.headers.latitude')}</th>
                            <th scope="col" className="px-4 py-2">{t('table.headers.longitude')}</th>
                            <th scope="col" className="px-4 py-2">{t('table.headers.layer')}</th>
                            <th scope="col" className="px-4 py-2 text-right">{t('table.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => {
                            const isSelected = selectedOrientationId !== null
                                && String(item.id) === String(selectedOrientationId);
                            const isLayerVisible = item.layerVisible !== false;
                            return (
                            <tr
                                key={item.id}
                                className={`border-b transition ${
                                    isSelected
                                        ? 'bg-blue-50 border-blue-200'
                                        : isLayerVisible
                                            ? 'bg-white hover:bg-gray-50'
                                            : 'bg-slate-100 text-slate-500'
                                }`}
                                onClick={() => setSelectedOrientationId(item.id)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedOrientationId(item.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isSelected}
                                aria-label={t('table.row.select', {
                                    type: item.type === 'plane' ? t('table.badge.plane') : t('table.badge.line'),
                                    azimuth: item.type === 'plane' ? item.dipDirection : item.trend,
                                    inclination: item.type === 'plane' ? item.dip : item.plunge,
                                })}
                            >
                                <td className="px-4 py-2 font-medium">
                                    <span
                                        className="px-2 py-1 rounded-full text-xs font-semibold"
                                        style={{
                                            backgroundColor: item.type === 'plane' ? `${COLORS.PLANE}30` : `${COLORS.LINE}30`,
                                            color: item.type === 'plane' ? COLORS.PLANE : COLORS.LINE
                                        }}
                                    >
                                        {item.type === 'plane' ? t('table.badge.plane') : t('table.badge.line')}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    {item.type === 'plane' ? item.dipDirection : item.trend}
                                    {degreeSymbol}
                                </td>
                                <td className="px-4 py-2">
                                    {item.type === 'plane' ? item.dip : item.plunge}
                                    {degreeSymbol}
                                </td>
                                <td className="px-4 py-2">
                                    {typeof item.latitude === 'number'
                                        ? item.latitude.toFixed(4)
                                        : t('table.value.missing')}
                                </td>
                                <td className="px-4 py-2">
                                    {typeof item.longitude === 'number'
                                        ? item.longitude.toFixed(4)
                                        : t('table.value.missing')}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="inline-flex items-center gap-2">
                                        <span
                                            className="h-3 w-3 rounded-full border border-slate-200"
                                            style={{
                                                backgroundColor: item.layerColor ?? '#94a3b8',
                                                opacity: item.layerOpacity ?? 1,
                                            }}
                                            aria-hidden
                                        />
                                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                            {item.layerName ?? t('table.value.unassigned')}
                                        </span>
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void removeById(item.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title={t('table.tooltip.remove')}
                                        aria-label={t('table.tooltip.remove')}
                                    >
                                        <TrashIcon />
                                    </button>
                                </td>
                            </tr>
                        );})}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>{t('table.empty.title')}</p>
                        <p className="text-sm">{t('table.empty.description')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
