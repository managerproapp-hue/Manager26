import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    deleteDoc, 
    query, 
    where,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
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

    // Helper to sync collection
    useEffect(() => {
        const collections: any[] = [
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

        const unsubscribes = collections.map(col => {
            return onSnapshot(collection(db, col.name), (snapshot: any) => {
                const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
                col.setter(data as any);
            }, (error: any) => {
                console.error(`Error fetching ${col.name}:`, error);
                if (error.message?.includes('insufficient permissions')) {
                    console.warn(`Permission denied for ${col.name}. This is expected if you are not an admin.`);
                }
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    // Generic update function
    const updateCollection = async (collectionName: string, data: any[] | ((prev: any[]) => any[]), currentState: any[]) => {
        const newData = typeof data === 'function' ? data(currentState) : data;
        
        // This is a simplified sync. In a real app, you'd handle individual adds/updates/deletes.
        // For this app, we'll compare and apply changes.
        const batch = writeBatch(db);
        
        // Find deleted
        const currentIds = new Set(currentState.map(item => item.id));
        const newIds = new Set(newData.map(item => item.id));
        
        currentState.forEach(item => {
            if (!newIds.has(item.id)) {
                batch.delete(doc(db, collectionName, item.id));
            }
        });
        
        // Add/Update
        newData.forEach(item => {
            const { id, ...rest } = item;
            const docRef = doc(db, collectionName, id);
            batch.set(docRef, rest, { merge: true });
        });
        
        await batch.commit();
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
        const batch = writeBatch(db);
        Object.keys(data).forEach(key => {
            const items = data[key];
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const { id, ...rest } = item;
                    if (id) {
                        batch.set(doc(db, key, id), rest);
                    }
                });
            }
        });
        await batch.commit();
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