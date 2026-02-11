import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingInput, ApiResponse } from '../types';
import { API, ERRORS } from '../utils/constants';

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createBooking: (booking: BookingInput) => Promise<Booking | null>;
  updateBooking: (id: number, booking: BookingInput) => Promise<Booking | null>;
  deleteBooking: (id: number) => Promise<boolean>;
  getBookingById: (id: number) => Booking | undefined;
}

export function useBookings(year: number): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API.BOOKINGS}?year=${year}`);

      if (!response.ok) {
        throw new Error(ERRORS.LOAD_ERROR);
      }

      const data: ApiResponse<Booking[]> = await response.json();

      if (data.success && data.data) {
        setBookings(data.data);
      } else {
        throw new Error(data.error || ERRORS.LOAD_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (booking: BookingInput): Promise<Booking | null> => {
    try {
      const response = await fetch(API.BOOKINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        throw new Error(ERRORS.SAVE_ERROR);
      }

      const data: ApiResponse<Booking> = await response.json();

      if (data.success && data.data) {
        await fetchBookings();
        return data.data;
      } else {
        throw new Error(data.error || ERRORS.SAVE_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.SAVE_ERROR);
      return null;
    }
  };

  const updateBooking = async (id: number, booking: BookingInput): Promise<Booking | null> => {
    try {
      const response = await fetch(`${API.BOOKINGS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        throw new Error(ERRORS.SAVE_ERROR);
      }

      const data: ApiResponse<Booking> = await response.json();

      if (data.success && data.data) {
        await fetchBookings();
        return data.data;
      } else {
        throw new Error(data.error || ERRORS.SAVE_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.SAVE_ERROR);
      return null;
    }
  };

  const deleteBooking = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API.BOOKINGS}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(ERRORS.DELETE_ERROR);
      }

      const data: ApiResponse<null> = await response.json();

      if (data.success) {
        await fetchBookings();
        return true;
      } else {
        throw new Error(data.error || ERRORS.DELETE_ERROR);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ERRORS.DELETE_ERROR);
      return false;
    }
  };

  const getBookingById = (id: number): Booking | undefined => {
    return bookings.find(b => b.id === id);
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingById
  };
}

/**
 * Filtert Buchungen für ein bestimmtes Haus
 */
export function filterBookingsByHouse(bookings: Booking[], houseId: number): Booking[] {
  return bookings.filter(b => b.house_id === houseId);
}

/**
 * Prüft ob ein Datum von einer Buchung betroffen ist (Anreise, Abreise oder dazwischen)
 */
export function getBookingForDate(
  bookings: Booking[],
  date: Date,
  houseId: number
): { arrival: Booking | null; departure: Booking | null; staying: Booking | null } {
  const dateStr = date.toISOString().split('T')[0];
  const houseBookings = filterBookingsByHouse(bookings, houseId);

  let arrival: Booking | null = null;
  let departure: Booking | null = null;
  let staying: Booking | null = null;

  for (const booking of houseBookings) {
    const checkIn = booking.check_in;
    const checkOut = booking.check_out;

    if (checkIn === dateStr) {
      arrival = booking;
    }

    if (checkOut === dateStr) {
      departure = booking;
    }

    // Zwischen Anreise und Abreise (exklusiv)
    if (dateStr > checkIn && dateStr < checkOut) {
      staying = booking;
    }
  }

  return { arrival, departure, staying };
}
