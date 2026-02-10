import { Router } from 'express';
import { queryAll } from '../db/database.js';

const router = Router();

interface HouseStats {
  house_id: number;
  house_name: string;
  overnight_stays: number;
  booking_count: number;
  reservation_count: number;
  occupied_days: number;
  occupancy_rate: number;
  revenue: number;
}

interface BookingRow {
  id: number;
  status: string;
  check_in: string;
  check_out: string;
  total_price: number;
}

/**
 * GET /api/statistics
 * Gibt Statistiken für einen Zeitraum zurück
 */
router.get('/', (req, res) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Parameter "from" und "to" sind erforderlich'
      });
    }

    // Alle Häuser laden
    const houses = queryAll<{ id: number; name: string }>('SELECT id, name FROM houses ORDER BY sort_order');

    // Anzahl Tage im Zeitraum berechnen
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const houseStats: HouseStats[] = [];
    let totalOvernightStays = 0;
    let totalBookingCount = 0;
    let totalReservationCount = 0;
    let totalRevenue = 0;

    for (const house of houses) {
      // Buchungen im Zeitraum laden (inkl. überlappende)
      const bookings = queryAll<BookingRow>(`
        SELECT id, status, check_in, check_out, total_price
        FROM bookings
        WHERE house_id = ?
          AND check_in < ?
          AND check_out > ?
      `, [house.id, to, from]);

      let overnightStays = 0;
      let bookingCount = 0;
      let reservationCount = 0;
      let revenue = 0;
      const occupiedDates = new Set<string>();

      for (const booking of bookings) {
        // Nächte im Zeitraum berechnen
        const bookingStart = new Date(Math.max(new Date(booking.check_in).getTime(), fromDate.getTime()));
        const bookingEnd = new Date(Math.min(new Date(booking.check_out).getTime(), toDate.getTime()));
        const nights = Math.max(0, Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)));
        overnightStays += nights;

        // Status zählen
        if (booking.status === 'booking') {
          bookingCount++;
          revenue += booking.total_price;
        } else {
          reservationCount++;
        }

        // Belegte Tage sammeln (für Belegungsquote)
        const current = new Date(bookingStart);
        while (current < bookingEnd) {
          occupiedDates.add(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }

      const occupiedDays = occupiedDates.size;
      const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0;

      houseStats.push({
        house_id: house.id,
        house_name: house.name,
        overnight_stays: overnightStays,
        booking_count: bookingCount,
        reservation_count: reservationCount,
        occupied_days: occupiedDays,
        occupancy_rate: Math.round(occupancyRate * 10) / 10,
        revenue: revenue
      });

      totalOvernightStays += overnightStays;
      totalBookingCount += bookingCount;
      totalReservationCount += reservationCount;
      totalRevenue += revenue;
    }

    // Durchschnittliche Belegungsquote
    const avgOccupancy = houseStats.length > 0
      ? houseStats.reduce((sum, h) => sum + h.occupancy_rate, 0) / houseStats.length
      : 0;

    res.json({
      success: true,
      data: {
        from,
        to,
        houses: houseStats,
        total: {
          overnight_stays: totalOvernightStays,
          booking_count: totalBookingCount,
          reservation_count: totalReservationCount,
          occupancy_rate: Math.round(avgOccupancy * 10) / 10,
          revenue: totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Statistiken'
    });
  }
});

export default router;
