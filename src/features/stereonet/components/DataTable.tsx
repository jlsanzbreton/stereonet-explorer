import React from 'react';
import { StructuralData } from '../model/types';
import { COLORS } from '../model/transforms';
import TrashIcon from '@/ui/icons/TrashIcon';

interface DataTableProps {
    data: StructuralData[];
    onRemove: (id: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onRemove }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Structural Data</h3>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2">Type</th>
                            <th scope="col" className="px-4 py-2">Azimuth</th>
                            <th scope="col" className="px-4 py-2">Inclination</th>
                            <th scope="col" className="px-4 py-2"></th>
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
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{item.type === 'plane' ? item.dipDirection : item.trend}°</td>
                                <td className="px-4 py-2">{item.type === 'plane' ? item.dip : item.plunge}°</td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title="Remove item"
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
                        <p>No data added yet.</p>
                        <p className="text-sm">Use the panel on the left to add planes and lines.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
