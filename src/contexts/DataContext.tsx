import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { initialData } from '../services/dataService';
import { demoData } from '../services/demoDataService';
import { 
    User, Product, Supplier, Event, Order, Incident, 
    TrainingCycle, Module, Group, Assignment, Recipe, StockItem, Sale, Message,
    Classroom, ClassroomProduct, ClassroomSupplier, ClassroomEvent, ClassroomOrder,
    ServiceGroup, Service
} from '../types';

export interface DataContextType {
    users: User[];
    products: Product[];
    suppliers: Supplier[];
    events: Event[];
    orders: Order[];
    incidents: Incident[];
    trainingCycles: TrainingCycle[];
    modules: Module[];
    groups: Group[];
    assignments: Assignment[];
    recipes: Recipe[];
    sales: Sale[];
    miniEconomatoStock: StockItem[];
    messages: Message[];
    classrooms: Classroom[];
    classroomProducts: ClassroomProduct[];
    classroomSuppliers: ClassroomSupplier[];
    classroomEvents: ClassroomEvent[];
    classroomOrders: ClassroomOrder[];
    serviceGroups: ServiceGroup[];
    services: Service[];
    setUsers: (data: User[] | ((prev: User[]) => User[])) => void;
    setProducts: (data: Product[] | ((prev: Product[]) => Product[])) => void;
    setSuppliers: (data: Supplier[] | ((prev: Supplier[]) => Supplier[])) => void;
    setEvents: (data: Event[] | ((prev: Event[]) => Event[])) => void;
    setOrders: (data: Order[] | ((prev: Order[]) => Order[])) => void;
    setIncidents: (data: Incident[] | ((prev: Incident[]) => Incident[])) => void;
    setTrainingCycles: (data: TrainingCycle[] | ((prev: TrainingCycle[]) => TrainingCycle[])) => void;
    setModules: (data: Module[] | ((prev: Module[]) => Module[])) => void;
    setGroups: (data: Group[] | ((prev: Group[]) => Group[])) => void;
    setAssignments: (data: Assignment[] | ((prev: Assignment[]) => Assignment[])) => void;
    setRecipes: (data: Recipe[] | ((prev: Recipe[]) => Recipe[])) => void;
    setSales: (data: Sale[] | ((prev: Sale[]) => Sale[])) => void;
    setMiniEconomatoStock: (data: StockItem[] | ((prev: StockItem[]) => StockItem[])) => void;
    setMessages: (data: Message[] | ((prev: Message[]) => Message[])) => void;
    setClassrooms: (data: Classroom[] | ((prev: Classroom[]) => Classroom[])) => void;
    setClassroomProducts: (data: ClassroomProduct[] | ((prev: ClassroomProduct[]) => ClassroomProduct[])) => void;
    setClassroomSuppliers: (data: ClassroomSupplier[] | ((prev: ClassroomSupplier[]) => ClassroomSupplier[])) => void;
    setClassroomEvents: (data: ClassroomEvent[] | ((prev: ClassroomEvent[]) => ClassroomEvent[])) => void;
    setClassroomOrders: (data: ClassroomOrder[] | ((prev: ClassroomOrder[]) => ClassroomOrder[])) => void;
    setServiceGroups: (data: ServiceGroup[] | ((prev: ServiceGroup[]) => ServiceGroup[])) => void;
    setServices: (data: Service[] | ((prev: Service[]) => Service[])) => void;
    loadDemoData: () => Promise<void>;
    seedInitialData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsersState] = useState<User[]>([]);
    const [products, setProductsState] = useState<Product[]>([]);
    const [suppliers, setSuppliersState] = useState<Supplier[]>([]);
    const [events, setEventsState] = useState<Event[]>([]);
    const [orders, setOrdersState] = useState<Order[]>([]);
    const [incidents, setIncidentsState] = useState<Incident[]>([]);
    const [trainingCycles, setTrainingCyclesState] = useState<TrainingCycle[]>([]);
    const [modules, setModulesState] = useState<Module[]>([]);
    const [groups, setGroupsState] = useState<Group[]>([]);
    const [assignments, setAssignmentsState] = useState<Assignment[]>([]);
    const [recipes, setRecipesState] = useState<Recipe[]>([]);
    const [sales, setSalesState] = useState<Sale[]>([]);
    const [miniEconomatoStock, setMiniEconomatoStockState] = useState<StockItem[]>([]);
    const [messages, setMessagesState] = useState<Message[]>([]);
    const [classrooms, setClassroomsState] = useState<Classroom[]>([]);
    const [classroomProducts, setClassroomProductsState] = useState<ClassroomProduct[]>([]);
    const [classroomSuppliers, setClassroomSuppliersState] = useState<ClassroomSupplier[]>([]);
    const [classroomEvents, setClassroomEventsState] = useState<ClassroomEvent[]>([]);
    const [classroomOrders, setClassroomOrdersState] = useState<ClassroomOrder[]>([]);
    const [serviceGroups, setServiceGroupsState] = useState<ServiceGroup[]>([]);
    const [services, setServicesState] = useState<Service[]>([]);
    const { currentUser } = useAuth();

    // Helper to sync collection with Supabase
    useEffect(() => {
        if (!currentUser) {
            console.log('DataProvider - No user, skipping listeners');
            return;
        }

        const collections: { name: string, setter: (data: any) => void }[] = [
            { name: 'users', setter: setUsersState },
            { name: 'products', setter: setProductsState },
            { name: 'suppliers', setter: setSuppliersState },
            { name: 'events', setter: setEventsState },
            { name: 'orders', setter: setOrdersState },
            { name: 'incidents', setter: setIncidentsState },
            { name: 'trainingCycles', setter: setTrainingCyclesState },
            { name: 'modules', setter: setModulesState },
            { name: 'groups', setter: setGroupsState },
            { name: 'assignments', setter: setAssignmentsState },
            { name: 'recipes', setter: setRecipesState },
            { name: 'sales', setter: setSalesState },
            { name: 'miniEconomatoStock', setter: setMiniEconomatoStockState },
            { name: 'messages', setter: setMessagesState },
            { name: 'classrooms', setter: setClassroomsState },
            { name: 'classroomProducts', setter: setClassroomProductsState },
            { name: 'classroomSuppliers', setter: setClassroomSuppliersState },
            { name: 'classroomEvents', setter: setClassroomEventsState },
            { name: 'classroomOrders', setter: setClassroomOrdersState },
            { name: 'serviceGroups', setter: setServiceGroupsState },
            { name: 'services', setter: setServicesState },
        ];

        const fetchData = async () => {
            for (const col of collections) {
                const { data, error } = await supabase.from(col.name).select('*');
                if (error) {
                    console.error(`Error fetching ${col.name}:`, error);
                } else {
                    col.setter(data);
                }
            }
        };

        fetchData();

        // Realtime subscriptions
        const channels = collections.map(col => {
            return supabase
                .channel(`public:${col.name}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: col.name }, (payload) => {
                    console.log(`Change received for ${col.name}:`, payload);
                    fetchData(); // Simple refresh for now
                })
                .subscribe();
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [currentUser]);

    // Generic update function for Supabase
    const updateCollection = async (collectionName: string, data: any[] | ((prev: any[]) => any[]), currentState: any[]) => {
        const newData = typeof data === 'function' ? data(currentState) : data;
        
        // Find deleted
        const newIds = new Set(newData.map(item => item.id));
        const deletedIds = currentState.filter(item => !newIds.has(item.id)).map(item => item.id);
        
        if (deletedIds.length > 0) {
            await supabase.from(collectionName).delete().in('id', deletedIds);
        }
        
        // Upsert new/updated
        if (newData.length > 0) {
            const { error } = await supabase.from(collectionName).upsert(newData);
            if (error) console.error(`Error upserting to ${collectionName}:`, error);
        }
    };

    const setUsers = (data: any) => updateCollection('users', data, users);
    const setProducts = (data: any) => updateCollection('products', data, products);
    const setSuppliers = (data: any) => updateCollection('suppliers', data, suppliers);
    const setEvents = (data: any) => updateCollection('events', data, events);
    const setOrders = (data: any) => updateCollection('orders', data, orders);
    const setIncidents = (data: any) => updateCollection('incidents', data, incidents);
    const setTrainingCycles = (data: any) => updateCollection('trainingCycles', data, trainingCycles);
    const setModules = (data: any) => updateCollection('modules', data, modules);
    const setGroups = (data: any) => updateCollection('groups', data, groups);
    const setAssignments = (data: any) => updateCollection('assignments', data, assignments);
    const setRecipes = (data: any) => updateCollection('recipes', data, recipes);
    const setSales = (data: any) => updateCollection('sales', data, sales);
    const setMiniEconomatoStock = (data: any) => updateCollection('miniEconomatoStock', data, miniEconomatoStock);
    const setMessages = (data: any) => updateCollection('messages', data, messages);
    const setClassrooms = (data: any) => updateCollection('classrooms', data, classrooms);
    const setClassroomProducts = (data: any) => updateCollection('classroomProducts', data, classroomProducts);
    const setClassroomSuppliers = (data: any) => updateCollection('classroomSuppliers', data, classroomSuppliers);
    const setClassroomEvents = (data: any) => updateCollection('classroomEvents', data, classroomEvents);
    const setClassroomOrders = (data: any) => updateCollection('classroomOrders', data, classroomOrders);
    const setServiceGroups = (data: any) => updateCollection('serviceGroups', data, serviceGroups);
    const setServices = (data: any) => updateCollection('services', data, services);

    const seedData = async (data: any) => {
        for (const key of Object.keys(data)) {
            const items = data[key];
            if (Array.isArray(items) && items.length > 0) {
                const { error } = await supabase.from(key).upsert(items);
                if (error) console.error(`Error seeding ${key}:`, error);
            }
        }
    };

    const loadDemoData = () => seedData(demoData);
    const seedInitialData = () => seedData(initialData);

    const value: DataContextType = useMemo(() => ({
        users, products, suppliers, events, orders, incidents, 
        trainingCycles, modules, groups, assignments, recipes, sales, miniEconomatoStock, messages,
        classrooms, classroomProducts, classroomSuppliers, classroomEvents, classroomOrders,
        serviceGroups, services,
        setUsers, setProducts, setSuppliers, setEvents, setOrders, setIncidents,
        setTrainingCycles, setModules, setGroups, setAssignments, setRecipes, setSales,
        setMiniEconomatoStock, setMessages, setClassrooms, setClassroomProducts,
        setClassroomSuppliers, setClassroomEvents, setClassroomOrders,
        setServiceGroups, setServices,
        loadDemoData, seedInitialData
    }), [
        users, products, suppliers, events, orders, incidents, 
        trainingCycles, modules, groups, assignments, recipes, sales, miniEconomatoStock, messages,
        classrooms, classroomProducts, classroomSuppliers, classroomEvents, classroomOrders,
        serviceGroups, services
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
