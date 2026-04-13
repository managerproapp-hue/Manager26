import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { PlusIcon, TrashIcon, PencilIcon } from '../../components/icons';
import { SaleItem } from '../../types';

const SaleItemFormModal: React.FC<{ saleItem: SaleItem | null; onSave: (item: Partial<SaleItem>) => void; onClose: () => void; }> = ({ saleItem, onSave, onClose }) => {
    const [formState, setFormState] = useState({
        name: saleItem?.name || '',
        description: saleItem?.description || '',
        price: saleItem?.price || 0,
        rations: saleItem?.rations || 0,
        allergens: saleItem?.allergens.join(', ') || '',
        notes: saleItem?.notes || '',
        status: saleItem?.status || 'Activo',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'price' || name === 'rations' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formState,
            allergens: formState.allergens.split(',').map(a => a.trim()).filter(a => a !== ''),
            workspace_id: 'workspace-1', // Placeholder
            created_at: new Date().toISOString()
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={saleItem ? 'Editar Plato' : 'Nuevo Plato'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    <textarea name="description" value={formState.description} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alérgenos (separados por coma)</label>
                    <input type="text" name="allergens" value={formState.allergens} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas Adicionales</label>
                    <textarea name="notes" value={formState.notes} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Ventas para Llevar</h1>
                <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 flex items-center">
                    <PlusIcon className="w-5 h-5 mr-1" /> Nuevo Plato
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sale_items.map(item => (
                    <Card key={item.id} title={item.name}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        <p className="font-bold text-lg">{item.price.toFixed(2)} €</p>
                        <p className="text-sm">Raciones: {item.rations}</p>
                        <p className="text-sm">Alérgenos: {item.allergens.join(', ')}</p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="text-primary-600 p-1"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 p-1"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && <SaleItemFormModal saleItem={selectedItem} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};
