import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { PlusIcon, TrashIcon, PencilIcon } from '../../components/icons';
import { SaleItem } from '../../types';
import { AllergenSelector } from './RecipeForm'; // Importar desde RecipeForm

const SaleItemFormModal: React.FC<{ saleItem: SaleItem | null; onSave: (item: Partial<SaleItem>) => void; onClose: () => void; }> = ({ saleItem, onSave, onClose }) => {
    const { recipes } = useData();
    const [formState, setFormState] = useState({
        recipe_id: saleItem?.recipe_id || '',
        name: saleItem?.name || '',
        description: saleItem?.description || '',
        price: saleItem?.price || 0,
        rations: saleItem?.rations || 0,
        allergens: saleItem?.allergens || [],
        notes: saleItem?.notes || '',
        status: saleItem?.status || 'Preparacion',
        sale_date: saleItem?.sale_date || new Date().toISOString().split('T')[0],
        pickup_time: saleItem?.pickup_time || '14:00',
        end_time: saleItem?.end_time || '15:00',
    });

    const handleRecipeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const recipe = recipes.find(r => r.id === e.target.value);
        if (recipe) {
            setFormState(prev => ({
                ...prev,
                recipe_id: recipe.id,
                name: recipe.name,
                description: recipe.description,
                price: recipe.price,
                allergens: recipe.selected_allergens || []
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'price' || name === 'rations' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formState,
            workspace_id: 'workspace-1', // Placeholder
            created_at: new Date().toISOString()
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={saleItem ? 'Editar Plato' : 'Nuevo Plato'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Receta (Opcional)</label>
                    <select name="recipe_id" value={formState.recipe_id} onChange={handleRecipeChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Selecciona una receta...</option>
                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alérgenos</label>
                    <AllergenSelector selected={formState.allergens} onChange={(allergens: string[]) => setFormState(prev => ({ ...prev, allergens }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <select name="status" value={formState.status} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="Preparacion">En Preparación</option>
                        <option value="Activo">Activo (A la venta)</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Venta</label>
                        <input type="date" name="sale_date" value={formState.sale_date} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Recogida</label>
                        <input type="time" name="pickup_time" value={formState.pickup_time} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Fin</label>
                        <input type="time" name="end_time" value={formState.end_time} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                {/* ... rest of the form ... */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio (€)</label>
                        <input type="number" step="0.01" name="price" value={formState.price} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Raciones</label>
                        <input type="number" name="rations" value={formState.rations} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Cancelar</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

export const TakeawaySales: React.FC = () => {
    const { sale_items, setSaleItems } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);

    const handleSave = (itemData: Partial<SaleItem>) => {
        if (selectedItem) {
            setSaleItems(sale_items.map(i => i.id === selectedItem.id ? { ...selectedItem, ...itemData } as SaleItem : i));
        } else {
            const newItem: SaleItem = {
                ...itemData as SaleItem,
                id: `sale-item-${Date.now()}`,
            };
            setSaleItems([...sale_items, newItem]);
        }
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar este plato?")) {
            setSaleItems(sale_items.filter(i => i.id !== id));
        }
    };

    const preparingItems = sale_items.filter(item => item.status === 'Preparacion');
    const activeItems = sale_items.filter(item => item.status === 'Activo');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Ventas para Llevar</h1>
                <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 flex items-center">
                    <PlusIcon className="w-5 h-5 mr-1" /> Nuevo Plato
                </button>
            </div>

            <h2 className="text-xl font-semibold mb-4">En Preparación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {preparingItems.map(item => (
                    <Card key={item.id} title={item.name}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        <p className="font-bold text-lg">{item.price.toFixed(2)} €</p>
                        <p className="text-sm">Raciones: {item.rations}</p>
                        <p className="text-sm text-yellow-600">Estado: En Preparación</p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="text-primary-600 p-1"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 p-1"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </Card>
                ))}
                {preparingItems.length === 0 && <p className="text-gray-500">No hay platos en preparación.</p>}
            </div>

            <h2 className="text-xl font-semibold mb-4">A la Venta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeItems.map(item => (
                    <Card key={item.id} title={item.name}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        <p className="font-bold text-lg">{item.price.toFixed(2)} €</p>
                        <p className="text-sm">Raciones: {item.rations}</p>
                        <p className="text-sm">Fecha: {item.sale_date}</p>
                        <p className="text-sm">Recogida: {item.pickup_time} - {item.end_time}</p>
                        <p className="text-sm">Alérgenos: {item.allergens.join(', ')}</p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="text-primary-600 p-1"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 p-1"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </Card>
                ))}
                {activeItems.length === 0 && <p className="text-gray-500">No hay platos a la venta.</p>}
            </div>

            {isModalOpen && <SaleItemFormModal saleItem={selectedItem} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};
