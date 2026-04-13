import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Card } from '../../components/Card';

export const ReservationManager: React.FC = () => {
    const { sale_items, reservations } = useData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Gestión de Reservas</h1>
            <div className="space-y-6">
                {sale_items.map(item => {
                    const itemReservations = reservations.filter(r => r.sale_item_id === item.id);
                    
                    return (
                        <Card key={item.id} title={`${item.name} (${itemReservations.length} reservas)`}>
                            {itemReservations.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Estudiante</th>
                                            <th className="px-4 py-2 text-left">Cantidad</th>
                                            <th className="px-4 py-2 text-left">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemReservations.map(res => (
                                            <tr key={res.id} className="border-b dark:border-gray-700">
                                                <td className="px-4 py-2">{res.user_name}</td>
                                                <td className="px-4 py-2">{res.quantity}</td>
                                                <td className="px-4 py-2">{new Date(res.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500">No hay reservas para este plato.</p>
                            )}
                        </Card>
                    );
                })}
                {sale_items.length === 0 && (
                    <p className="text-gray-500">No hay platos registrados.</p>
                )}
            </div>
        </div>
    );
};
