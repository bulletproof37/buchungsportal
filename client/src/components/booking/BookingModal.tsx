import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingInput, House, ValidationError, Settings } from '../../types';
import { LABELS, DEFAULTS, API } from '../../utils/constants';
import { validateBooking, hasErrors } from '../../utils/validation';
import { toISODateString } from '../../utils/dateUtils';
import BookingForm from './BookingForm';
import PriceCalculation from './PriceCalculation';

interface BookingModalProps {
  isOpen: boolean;
  booking: Booking | null; // null = neue Buchung
  houses: House[];
  allBookings: Booking[];
  settings: Settings;
  onClose: () => void;
  onSave: (booking: BookingInput) => Promise<Booking | null>;
  onUpdate: (id: number, booking: BookingInput) => Promise<Booking | null>;
  onDelete: (id: number) => Promise<boolean>;
  preselectedHouseId?: number;
  preselectedDate?: Date;
}

export default function BookingModal({
  isOpen,
  booking,
  houses,
  allBookings,
  settings,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  preselectedHouseId,
  preselectedDate
}: BookingModalProps) {
  const [formData, setFormData] = useState<Partial<BookingInput>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!booking;

  // Formular initialisieren
  useEffect(() => {
    if (isOpen) {
      if (booking) {
        // Bestehende Buchung bearbeiten
        setFormData({
          house_id: booking.house_id,
          status: booking.status,
          check_in: booking.check_in,
          check_out: booking.check_out,
          guest_last_name: booking.guest_last_name,
          guest_first_name: booking.guest_first_name,
          guest_email: booking.guest_email || '',
          guest_phone: booking.guest_phone,
          guest_street: booking.guest_street || '',
          guest_zip: booking.guest_zip || '',
          guest_city: booking.guest_city || '',
          guest_count: booking.guest_count || undefined,
          dog_count: booking.dog_count,
          price_per_night: booking.price_per_night,
          notes: booking.notes || ''
        });
      } else {
        // Neue Buchung
        const house = preselectedHouseId ? houses.find(h => h.id === preselectedHouseId) : null;
        setFormData({
          house_id: preselectedHouseId || undefined,
          status: 'reservation',
          check_in: preselectedDate ? toISODateString(preselectedDate) : '',
          check_out: '',
          guest_last_name: '',
          guest_first_name: '',
          guest_email: '',
          guest_phone: '',
          guest_street: '',
          guest_zip: '',
          guest_city: '',
          guest_count: undefined,
          dog_count: DEFAULTS.DOG_COUNT,
          price_per_night: house?.price_per_night || 0,
          notes: ''
        });
      }
      setErrors([]);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, booking, preselectedHouseId, preselectedDate, houses]);

  const handleFieldChange = useCallback((field: keyof BookingInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Fehler für dieses Feld löschen
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const handleSave = async () => {
    // Validierung
    const validationErrors = validateBooking(
      formData,
      allBookings,
      booking?.id,
      settings.min_nights
    );

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    const bookingData: BookingInput = {
      house_id: formData.house_id!,
      status: formData.status!,
      check_in: formData.check_in!,
      check_out: formData.check_out!,
      guest_last_name: formData.guest_last_name!.trim(),
      guest_first_name: formData.guest_first_name!.trim(),
      guest_email: formData.guest_email?.trim() || undefined,
      guest_phone: formData.guest_phone!.trim(),
      guest_street: formData.guest_street?.trim() || undefined,
      guest_zip: formData.guest_zip?.trim() || undefined,
      guest_city: formData.guest_city?.trim() || undefined,
      guest_count: formData.guest_count || undefined,
      dog_count: formData.dog_count || 0,
      price_per_night: formData.price_per_night!,
      notes: formData.notes?.trim() || undefined
    };

    setSaving(true);
    try {
      let result: Booking | null;
      if (isEditing) {
        result = await onUpdate(booking!.id, bookingData);
      } else {
        result = await onSave(bookingData);
      }

      if (result) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      const success = await onDelete(booking.id);
      if (success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!booking) return;
    window.open(`${API.BOOKINGS}/${booking.id}/pdf`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Buchung bearbeiten' : 'Neue Buchung'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Formular (2/3) */}
            <div className="lg:col-span-2">
              <BookingForm
                formData={formData}
                houses={houses}
                errors={errors}
                onChange={handleFieldChange}
                disabled={saving}
              />
            </div>

            {/* Preisberechnung (1/3) */}
            <div className="lg:col-span-1">
              <PriceCalculation
                checkIn={formData.check_in}
                checkOut={formData.check_out}
                pricePerNight={formData.price_per_night || 0}
                dogCount={formData.dog_count || 0}
                surchargeFirstNight={settings.surcharge_first_night}
                pricePerDogNight={settings.price_per_dog_night}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <p className="text-red-600 text-sm">{LABELS.CONFIRM_DELETE_TEXT}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Nein
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-red-500 text-white hover:bg-red-600"
                  disabled={saving}
                >
                  {saving ? 'Wird gelöscht...' : 'Ja, löschen'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {isEditing && (
                  <>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn text-red-600 hover:bg-red-50"
                      disabled={saving}
                    >
                      {LABELS.DELETE}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="btn btn-secondary"
                      disabled={saving}
                    >
                      {LABELS.DOWNLOAD_PDF}
                    </button>
                  </>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  {LABELS.CANCEL}
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Wird gespeichert...' : LABELS.SAVE}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
