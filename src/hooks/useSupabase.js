import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseQuery(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (query = {}) => {
    setLoading(true);
    setError(null);
    try {
      let supabaseQuery = supabase.from(table).select(query.select || '*');

      if (query.filters) {
        query.filters.forEach((filter) => {
          supabaseQuery = supabaseQuery[filter.method](filter.field, filter.value);
        });
      }

      if (query.order) {
        supabaseQuery = supabaseQuery.order(query.order.field, { ascending: query.order.ascending });
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      const { data, error: supabaseError } = await supabaseQuery;
      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const fetchOne = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const insert = useCallback(async (record) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const update = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const remove = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error: supabaseError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (supabaseError) throw supabaseError;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  return { fetchAll, fetchOne, insert, update, remove, loading, error };
}