import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import appSettings from '../appSettings.json';

const supabaseUrl = appSettings.Supabase.ProjectUrl;
const supabaseAnonKey = appSettings.Supabase.ApiKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  // Clients
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from('clientdetails')
        .select('*')
        .order('clientname', { ascending: true });
      if (error) throw error;
      return data;
    },
    async create(client: any) {
      const { data, error } = await supabase
        .from('clientdetails')
        .insert([client])
        .select();
      if (error) throw error;
      return data[0];
    },
    async update(id: number, updates: any) {
      const { data, error } = await supabase
        .from('clientdetails')
        .update(updates)
        .eq('clientid', id)
        .select();
      if (error) throw error;
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
      if (error) throw error;
      return data;
    },
    async create(product: any) {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
      if (error) throw error;
      return data[0];
    },
    async update(id: number, updates: any) {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('productid', id)
        .select();
      if (error) throw error;
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
      if (error) throw error;
      return data;
    },
    async create(bill: any) {
      const { data, error } = await supabase
        .from('billingtransaction')
        .insert([bill])
        .select();
      if (error) throw error;
      return data[0];
    },
    async getDashboardStats() {
      const { data, error } = await supabase
        .from('billingtransaction')
        .select('totalamount, billdate');
      if (error) throw error;
      
      const totalRevenue = data.reduce((acc, curr) => acc + (curr.totalamount || 0), 0);
      const recentCount = data.length;
      
      return { totalRevenue, recentCount };
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
      return data[0];
    }
  }
};
