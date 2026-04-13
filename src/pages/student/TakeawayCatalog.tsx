import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Reservation } from '../../types';
import { ALLERGEN_ICONS } from '../../lib/allergens';
import { AlertTriangle } from 'lucide-react';

export const TakeawayCatalog: React.FC = () => {
    const { sale_items, reservations, setReservations } = useData();
    const { currentUser } = useAuth();
    const [isReserving, setIsReserving] = useState<string | null>(null);

    const handleReserve = (saleItemId: string) => {
        if (!currentUser) return;
        setIsReserving(saleItemId);
        
        const newReservation: Reservation = {
            id: `res-${Date.now()}`,
            sale_item_id: saleItemId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            quantity: 1,
            created_at: new Date().toISOString()
        };
        
        setReservations([...reservations, newReservation]);
        setIsReserving(null);
    };

    const activeItems = sale_items.filter(item => item.status === 'Activo' && item.rations > 0);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Catálogo de Comidas para Llevar</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeItems.map(item => {
                    const userReservation = reservations.find(r => r.sale_item_id === item.id && r.user_id === currentUser?.id);
                    return (
                        <Card key={item.id} title={item.name}>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                            <p className="font-bold text-lg">{item.price.toFixed(2)} €</p>
                            <p className="text-sm">Raciones disponibles: {item.rations}</p>
                            <p className="text-sm font-semibold">Fecha: {item.sale_date}</p>
                            <p className="text-sm font-semibold">Recogida: {item.pickup_time} - {item.end_time}</p>
                            <div className="text-sm mt-2">
                                <p className="font-semibold">Alérgenos:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {item.allergens.map(allergen => {
                                        const Icon = ALLERGEN_ICONS[allergen] || AlertTriangle;
                                        return (
                                            <div key={allergen} className="flex flex-col items-center" title={allergen}>
                                                <Icon className="w-6 h-6" />
                                                <span className="text-[10px]">{allergen}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {userReservation ? (
                                <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm text-center">
                                    Reservado
                                </div>
                            ) : currentUser ? (
                                <button 
                                    onClick={() => handleReserve(item.id)}
                                    disabled={isReserving === item.id}
                                    className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                                >
                                    {isReserving === item.id ? 'Reservando...' : 'Reservar'}
                                </button>
                            ) : (
                                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm text-center">
                                    Inicia sesión para reservar
                                </div>
                            )}
                        </Card>
                    );
                })}
                {activeItems.length === 0 && (
                    <p className="text-gray-500">No hay platos disponibles para reservar en este momento.</p>
                )}
            </div>
        </div>
    );
};
