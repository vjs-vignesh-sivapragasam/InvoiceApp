import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import appSettings from '../appSettings.json';

const supabaseUrl = appSettings.Supabase.ProjectUrl;
const supabaseAnonKey = appSettings.Supabase.ApiKey;

// 🛡️ Resilience Layer: Custom Storage Adapter to handle native module failures gracefully
const memoryStorage = new Map<string, string>();

const resilientStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) return value;
      return memoryStorage.get(key) || null;
    } catch (e) {
      console.warn(`Supabase Storage: getItem failed for ${key}. Native module might be unavailable. Falling back to memory.`);
      return memoryStorage.get(key) || null;
    }
  },
  setItem: async (key: string, value: string) => {
    memoryStorage.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // Only warn if not in a web environment or during specific dev states where this is expected
      if (Platform.OS !== 'web') {
        console.warn(`Supabase Storage: setItem failed for ${key}. Persisting to memory only.`);
      }
    }
  },
  removeItem: async (key: string) => {
    memoryStorage.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      if (Platform.OS !== 'web') {
        console.warn(`Supabase Storage: removeItem failed for ${key}.`);
      }
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: resilientStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('🛡️ Supabase Initialized for:', supabaseUrl);
console.log('🔑 Key Type:', supabaseAnonKey.startsWith('sb_') ? 'Service/Proxy Key' : 'JWT Anon Key');

// 🚀 Startup Connection Check
(async () => {
  console.log('🧪 Diagnostic: Running startup connection test...');
  try {
    const { data, error } = await Promise.race([
      supabase.from('userroles').select('count'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMED_OUT')), 5000))
    ]) as any;

    if (error) {
      console.error('❌ Diagnostic Failed (Supabase):', error.message);
    } else {
      console.log('✅ Diagnostic Successful: Connection verified.');
    }
  } catch (e: any) {
    console.error('❌ Diagnostic Failed (Runtime/Timeout):', e.message);
  }
})();


export const db = {
  // Clients
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from('clientdetails')
        .select('*')
        .order('clientname', { ascending: true });
      if (error) { console.error('Supabase getAll (clients) error:', error); throw error; }
      return data;
    },
    async create(client: any) {
      const { data, error } = await supabase
        .from('clientdetails')
        .insert([client])
        .select();
      if (error) { console.error('Supabase create (client) error:', error); throw error; }
      return data[0];
    },
    async update(id: number, updates: any) {
      const { data, error } = await supabase
        .from('clientdetails')
        .update(updates)
        .eq('clientid', id)
        .select();
      if (error) { console.error('Supabase update (client) error:', error); throw error; }
      return data[0];
    }
  },

  // Products
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('productname', { ascending: true });
      if (error) { console.error('Supabase getAll (products) error:', error); throw error; }
      return data;
    },
    async create(product: any) {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
      if (error) { console.error('Supabase create (product) error:', error); throw error; }
      return data[0];
    },
    async update(id: number, updates: any) {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('productid', id)
        .select();
      if (error) { console.error('Supabase update (product) error:', error); throw error; }
      return data[0];
    }
  },

  // Transactions / Billing
  billing: {
    async getAll() {
      const { data, error } = await supabase
        .from('billingtransaction')
        .select('*, clientdetails(*), products(*)')
        .order('billdate', { ascending: false });
      if (error) { console.error('Supabase getAll (billing) error:', error); throw error; }
      return data;
    },
    async create(bill: any) {
      const { data, error } = await supabase
        .from('billingtransaction')
        .insert([bill])
        .select();
      if (error) { console.error('Supabase create (billing) error:', error); throw error; }
      return data[0];
    },
    async getDashboardStats() {
      const { data, error } = await supabase
        .from('billingtransaction')
        .select('totalamount, billdate');
      if (error) {
        console.error('Supabase getDashboardStats error:', error);
        throw error;
      }

      const totalRevenue = data.reduce((acc, curr) => acc + (curr.totalamount || 0), 0);
      const recentCount = data.length;

      return { totalRevenue, recentCount };
    }
  },

  // Bill Number Series
  billSeries: {
    async get(userId: number) {
      const { data, error } = await supabase
        .from('billseries')
        .select('*')
        .eq('userid', userId)
        .maybeSingle();
      if (error) { console.error('Supabase get (billSeries) error:', error); throw error; }
      return data;
    },
    async update(userId: number, updates: any) {
      const { data, error } = await supabase
        .from('billseries')
        .update(updates)
        .eq('userid', userId)
        .select();
      if (error) { console.error('Supabase update (billSeries) error:', error); throw error; }
      return data[0];
    },
    async upsert(userId: number, series: any) {
      const { data, error } = await supabase
        .from('billseries')
        .upsert({ userid: userId, ...series }, { onConflict: 'userid' })
        .select();
      if (error) { console.error('Supabase upsert (billSeries) error:', error); throw error; }
      return data[0];
    },
    async getNextBillNo(userId: number = 1) {
      const { data, error } = await supabase
        .from('billseries')
        .select('*')
        .eq('userid', userId)
        .maybeSingle();
      
      if (error || !data) return 'INV/2026/001';
      
      const nextCount = (data.currentcount || 0) + 1;
      return `${data.prefix}${data.delimiter}${data.startingnumber}${data.delimiter}${String(nextCount).padStart(3, '0')}`;
    },
    async incrementCount(userId: number = 1) {
      const { data: current } = await supabase.from('billseries').select('currentcount').eq('userid', userId).maybeSingle();
      const nextCount = (current?.currentcount || 0) + 1;
      await supabase.from('billseries').update({ currentcount: nextCount }).eq('userid', userId);
    }
  },

  // Inventory Details (Stock Movement Log)
  inventory: {
    async getAll() {
      const { data, error } = await supabase
        .from('inventorydetails')
        .select(`
          *,
          products (
            productid, productname, producttype, hsn, incase, pieces, sellingprice, isactive
          )
        `)
        .order('createddate', { ascending: false });
      if (error) { console.error('Supabase getAll (inventory) error:', error); throw error; }
      return data;
    },

    async getByProduct(productId: number) {
      const { data, error } = await supabase
        .from('inventorydetails')
        .select(`
          *,
          products (productid, productname, hsn, incase, pieces)
        `)
        .eq('productid', productId)
        .order('createddate', { ascending: false });
      if (error) { console.error('Supabase getByProduct (inventory) error:', error); throw error; }
      return data;
    },

    async logMovement(entry: {
      productid: number;
      movementtype: 'restock' | 'sale' | 'adjustment' | 'return';
      quantitymoved: number;
      previousstock: number;
      newstock: number;
      referenceno?: string;
      notes?: string;
    }) {
      const { data, error } = await supabase
        .from('inventorydetails')
        .insert([entry])
        .select();
      if (error) { console.error('Supabase logMovement (inventory) error:', error); throw error; }
      return data[0];
    }
  },

  // User Profile / Settings
  users: {
    async updateStatus(userId: number, isActive: boolean) {
      const { data, error } = await supabase
        .from('userlogindetails')
        .update({ isactive: isActive })
        .eq('userid', userId)
        .select();
      if (error) { console.error('Supabase updateStatus (users) error:', error); throw error; }
      return data[0];
    },
    async updateLoginScreenStatus(userId: number, isEnabled: boolean) {
      console.log(`Attempting to sync LoginScreenEnabled: ${isEnabled} for User: ${userId}`);
      const { data, error } = await supabase
        .from('userlogindetails')
        .update({ isloginscreenenabled: isEnabled })
        .eq('userid', userId)
        .select();

      if (error) {
        console.error('Supabase updateLoginScreenStatus error:', error);
        throw error;
      }

      const success = data && data.length > 0 && data[0].isloginscreenenabled === isEnabled;
      console.log('Supabase sync Success:', success ? 'SUCCESS' : 'FAILED (Row not found)');
      return data ? data[0] : null;
    },
    async login(identifier: string, password: string) {
      console.log('Login attempt for:', identifier);
      const { data, error } = await supabase
        .from('userlogindetails')
        .select('*')
        .or(`username.eq."${identifier}",emailid.eq."${identifier}"`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      return data;
    },
    async getProfile(userId: number) {
      console.log(`🔍 Supabase: Fetching profile for UserID: ${userId}`);
      try {
        const { data, error } = await Promise.race([
          supabase.from('userlogindetails').select('*').eq('userid', userId).maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('FETCH_TIMEOUT')), 5000))
        ]) as any;

        if (error) {
          console.error('❌ Supabase: getProfile error:', JSON.stringify(error, null, 2));
          throw error;
        }

        if (!data) {
          console.warn(`⚠️ Supabase: No profile found for UserID: ${userId}`);
        } else {
          console.log(`✅ Supabase: Profile fetched successfully for ${data.username}`);
        }
        return data;
      } catch (err: any) {
        console.error('💥 Supabase: getProfile runtime error:', err.message);
        throw err;
      }
    },
    async updateProfile(userId: number, updates: any) {
      console.log('Updating Profile in Supabase:', updates);
      const { data, error } = await supabase
        .from('userlogindetails')
        .update(updates)
        .eq('userid', userId)
        .select();
      if (error) { console.error('Supabase updateProfile (users) error:', error); throw error; }
      console.log('Supabase updateProfile Success:', data);
      return data[0];
    }
  },
  // System Health & Telemetry
  system: {
    async getHealthStatus() {
      const start = Date.now();
      try {
        const { data, error } = await supabase.from('userroles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        const latency = Date.now() - start;

        const [users, clients, products, bills, logs] = await Promise.all([
          supabase.from('userlogindetails').select('count', { count: 'exact', head: true }),
          supabase.from('clientdetails').select('count', { count: 'exact', head: true }),
          supabase.from('products').select('count', { count: 'exact', head: true }),
          supabase.from('billingtransaction').select('count', { count: 'exact', head: true }),
          supabase.from('inventorydetails').select('count', { count: 'exact', head: true }),
        ]);

        const totalRecords = (users.count || 0) + (clients.count || 0) + (products.count || 0) + (bills.count || 0) + (logs.count || 0);
        const estimatedBytes = totalRecords * 2048;
        const usedMB = (estimatedBytes / (1024 * 1024)).toFixed(2);

        return {
          connected: true,
          latency: `${latency}ms`,
          usedMB: parseFloat(usedMB),
          totalMB: 500,
          percentUsed: ((parseFloat(usedMB) / 500) * 100).toFixed(2)
        };
      } catch (err) {
        console.error('Database Healthcheck Failed:', err);
        return { connected: false, latency: '0ms', usedMB: 0, totalMB: 500, percentUsed: 0 };
      }
    }
  }
};
