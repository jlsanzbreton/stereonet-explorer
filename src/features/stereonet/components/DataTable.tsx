import React from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../model/transforms';
import TrashIcon from '@/ui/icons/TrashIcon';
import { selectStructuralData, useStereonetStore } from '@/state/store';

const DataTable: React.FC = () => {
    const { t } = useTranslation();
    const data = useStereonetStore(selectStructuralData);
    const removeById = useStereonetStore(state => state.removeById);
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
                            <th scope="col" className="px-4 py-2 text-right">{t('table.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
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
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => { void removeById(item.id); }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title={t('table.tooltip.remove')}
                                        aria-label={t('table.tooltip.remove')}
                                    >
                                        <TrashIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
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
