import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Reservation, SaleItem } from '../../types';
import { ALLERGEN_ICONS } from '../../lib/allergens';
import { AlertTriangle, Calendar, Clock, User as UserIcon } from 'lucide-react';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DAY_COLORS: Record<string, string> = {
    'Lunes': 'bg-blue-50 border-blue-200 text-blue-800',
    'Martes': 'bg-green-50 border-green-200 text-green-800',
    'Miércoles': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    'Jueves': 'bg-orange-50 border-orange-200 text-orange-800',
    'Viernes': 'bg-red-50 border-red-200 text-red-800',
    'Sábado': 'bg-purple-50 border-purple-200 text-purple-800',
    'Domingo': 'bg-gray-50 border-gray-200 text-gray-800',
};

const DAY_HEADER_COLORS: Record<string, string> = {
    'Lunes': 'bg-blue-600',
    'Martes': 'bg-green-600',
    'Miércoles': 'bg-yellow-600',
    'Jueves': 'bg-orange-600',
    'Viernes': 'bg-red-600',
    'Sábado': 'bg-purple-600',
    'Domingo': 'bg-gray-600',
};

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

    const groupedItems = useMemo(() => {
        const groups: Record<string, SaleItem[]> = {};
        activeItems.forEach(item => {
            const date = new Date(item.sale_date);
            const dayName = DAYS_OF_WEEK[date.getDay()];
            if (!groups[dayName]) groups[dayName] = [];
            groups[dayName].push(item);
        });
        
        // Sort days logically (Lunes to Domingo)
        const sortedDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return sortedDays.filter(day => groups[day]).map(day => ({
            day,
            items: groups[day].sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
        }));
    }, [activeItems]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                Catálogo de Comidas para Llevar
            </h1>
            
            {groupedItems.map(({ day, items }) => (
                <div key={day} className="mb-12">
                    <div className={`inline-block px-6 py-2 rounded-t-xl text-white font-bold text-xl ${DAY_HEADER_COLORS[day]}`}>
                        {day}
                    </div>
                    <div className={`p-6 rounded-b-xl rounded-r-xl border-t-4 ${DAY_HEADER_COLORS[day].replace('bg-', 'border-')} ${DAY_COLORS[day].split(' ')[0]} border-2 shadow-sm`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map(item => {
                                const userReservation = reservations.find(r => r.sale_item_id === item.id && r.user_id === currentUser?.id);
                                return (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.name}</h3>
                                                <span className="bg-primary-100 text-primary-800 text-sm font-bold px-3 py-1 rounded-full">
                                                    {item.price.toFixed(2)} €
                                                </span>
                                            </div>
                                            
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                                {item.description}
                                            </p>

                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <UserIcon className="w-4 h-4 mr-2 text-primary-500" />
                                                    <span className="font-medium">Vendido por:</span>
                                                    <span className="ml-1 text-gray-900 dark:text-gray-200">{item.teacher_name || item.group_name || 'Profesor'}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                                                    <span>{item.sale_date}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-4 h-4 mr-2 text-primary-500" />
                                                    <span>{item.pickup_time} - {item.end_time}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium">Raciones disponibles:</span>
                                                    <span className="ml-1 font-bold text-primary-600">{item.rations}</span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alérgenos</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {item.allergens.length > 0 ? item.allergens.map(allergen => {
                                                        const Icon = ALLERGEN_ICONS[allergen] || AlertTriangle;
                                                        return (
                                                            <div key={allergen} className="group relative flex flex-col items-center" title={allergen}>
                                                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-primary-900 transition-colors">
                                                                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-600" />
                                                                </div>
                                                                <span className="text-[10px] mt-1 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{allergen}</span>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <span className="text-xs text-gray-400 italic">Sin alérgenos declarados</span>
                                                    )}
                                                </div>
                                            </div>

                                            {userReservation ? (
                                                <div className="w-full py-3 px-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-xl font-bold text-center border border-green-200 dark:border-green-800">
                                                    ✓ Reservado
                                                </div>
                                            ) : currentUser ? (
                                                <button 
                                                    onClick={() => handleReserve(item.id)}
                                                    disabled={isReserving === item.id}
                                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-lg shadow-primary-200 dark:shadow-none disabled:bg-gray-400"
                                                >
                                                    {isReserving === item.id ? 'Reservando...' : 'Reservar ahora'}
                                                </button>
                                            ) : (
                                                <div className="w-full py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-xl font-medium text-center border border-yellow-100 dark:border-yellow-800 text-sm">
                                                    Inicia sesión para reservar
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            {groupedItems.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No hay platos disponibles para reservar en este momento.</p>
                </div>
            )}
        </div>
    );
};
