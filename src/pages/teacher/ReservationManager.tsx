import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Mail, Phone, AlertTriangle, MessageSquare } from 'lucide-react';

export const ReservationManager: React.FC = () => {
    const { sale_items, reservations } = useData();
    const { currentUser } = useAuth();

    // Filter items to show only those belonging to the current teacher, unless admin
    const isTeacherAdmin = currentUser?.role === 'admin';
    const displayItems = isTeacherAdmin 
        ? sale_items 
        : sale_items.filter(item => item.teacher_name === currentUser?.name || item.group_name === currentUser?.name);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Gestión de Reservas</h1>
            <div className="space-y-6">
                {displayItems.map(item => {
                    const itemReservations = reservations.filter(r => r.sale_item_id === item.id);
                    
                    return (
                        <Card key={item.id} title={`${item.name} (${itemReservations.length} reservas)`}>
                            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                <p><strong>Vendido por:</strong> {item.teacher_name || item.group_name || 'Profesor'}</p>
                                <p><strong>Fecha de venta:</strong> {item.sale_date} ({item.pickup_time} - {item.end_time})</p>
                            </div>
                            
                            {itemReservations.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3">Cliente</th>
                                                <th className="px-4 py-3">Contacto</th>
                                                <th className="px-4 py-3">Detalles</th>
                                                <th className="px-4 py-3 text-center">Cantidad</th>
                                                <th className="px-4 py-3">Fecha Reserva</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemReservations.map(res => (
                                                <tr key={res.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        {res.user_name}
                                                    </td>
                                                    <td className="px-4 py-3 space-y-1">
                                                        {res.phone && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                                <Phone className="w-3 h-3 mr-1" /> {res.phone}
                                                            </div>
                                                        )}
                                                        {res.email && (
                                                            <div className="flex items-center text-green-600 dark:text-green-400 text-xs" title="Correo de confirmación enviado">
                                                                <Mail className="w-3 h-3 mr-1" /> {res.email} (Enviado)
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 space-y-1">
                                                        {res.allergens && res.allergens.length > 0 && (
                                                            <div className="flex items-start text-red-600 dark:text-red-400 text-xs">
                                                                <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                                <span>Alergias: {res.allergens.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {res.notes && (
                                                            <div className="flex items-start text-gray-500 dark:text-gray-400 text-xs italic">
                                                                <MessageSquare className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                                <span>{res.notes}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-primary-600">
                                                        {res.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                        {new Date(res.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No hay reservas para este plato todavía.</p>
                            )}
                        </Card>
                    );
                })}
                {displayItems.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <p className="text-gray-500 text-lg">No tienes platos registrados con reservas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
