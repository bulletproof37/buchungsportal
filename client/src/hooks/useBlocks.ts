import { useState, useEffect, useCallback } from 'react';
import { Block, BlockInput, ApiResponse } from '../types';
import { API } from '../utils/constants';

export function useBlocks(year: number) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API.BLOCKS}?year=${year}`);
      if (!res.ok) throw new Error('Fehler beim Laden der Sperrzeiten');
      const data: ApiResponse<Block[]> = await res.json();
      if (data.success && data.data) {
        setBlocks(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = useCallback(async (input: BlockInput): Promise<Block | null> => {
    try {
      const res = await fetch(API.BLOCKS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data: ApiResponse<Block> = await res.json();
      if (data.success && data.data) {
        setBlocks(prev => [...prev, data.data!]);
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const updateBlock = useCallback(async (id: number, input: BlockInput): Promise<Block | null> => {
    try {
      const res = await fetch(`${API.BLOCKS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data: ApiResponse<Block> = await res.json();
      if (data.success && data.data) {
        setBlocks(prev => prev.map(b => b.id === id ? data.data! : b));
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const deleteBlock = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API.BLOCKS}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBlocks(prev => prev.filter(b => b.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { blocks, loading, error, createBlock, updateBlock, deleteBlock, refetch: fetchBlocks };
}
