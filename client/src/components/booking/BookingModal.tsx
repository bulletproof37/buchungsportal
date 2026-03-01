import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingInput, House, ValidationError, Settings, Block, BlockInput } from '../../types';
import { LABELS, DEFAULTS, API } from '../../utils/constants';
import { validateBooking, hasErrors } from '../../utils/validation';
import { toISODateString } from '../../utils/dateUtils';
import BookingForm from './BookingForm';
import PriceCalculation from './PriceCalculation';

type Mode = 'reservation' | 'booking' | 'block';

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatDE(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

interface BookingModalProps {
  isOpen: boolean;
  booking: Booking | null;
  houses: House[];
  allBookings: Booking[];
  blocks: Block[];
  settings: Settings;
  onClose: () => void;
  onSave: (booking: BookingInput) => Promise<Booking | null>;
  onUpdate: (id: number, booking: BookingInput) => Promise<Booking | null>;
  onDelete: (id: number) => Promise<boolean>;
  onSaveBlock?: (input: BlockInput) => Promise<Block | null>;
  preselectedHouseId?: number;
  preselectedDate?: Date;
  preselectedStatus?: 'booking' | 'reservation';
}

export default function BookingModal({
  isOpen,
  booking,
  houses,
  allBookings,
  blocks,
  settings,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  onSaveBlock,
  preselectedHouseId,
  preselectedDate,
  preselectedStatus
}: BookingModalProps) {
  const [mode, setMode] = useState<Mode>(preselectedStatus ?? 'reservation');
  const [formData, setFormData] = useState<Partial<BookingInput>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Block-spezifische Felder
  const [blockDateFrom, setBlockDateFrom] = useState('');
  const [blockDateToDisplay, setBlockDateToDisplay] = useState('');
  const [blockDescription, setBlockDescription] = useState('');
  const [blockErrors, setBlockErrors] = useState<string[]>([]);

  const isEditing = !!booking;

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        setMode(booking.status as Mode);
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
        const initialMode = preselectedStatus ?? 'reservation';
        setMode(initialMode);
        const house = preselectedHouseId ? houses.find(h => h.id === preselectedHouseId) : null;
        setFormData({
          house_id: preselectedHouseId || undefined,
          status: initialMode,
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
        const from = preselectedDate ? toISODateString(preselectedDate) : '';
        setBlockDateFrom(from);
        setBlockDateToDisplay(from);
        setBlockDescription('');
      }
      setErrors([]);
      setBlockErrors([]);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, booking, preselectedHouseId, preselectedDate, preselectedStatus, houses]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode !== 'block') {
      setFormData(prev => ({ ...prev, status: newMode }));
    }
    setErrors([]);
    setBlockErrors([]);
  };

  const handleFieldChange = useCallback((field: keyof BookingInput, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'check_in' && typeof value === 'string' && value && !prev.check_out) {
        const [y, m, d] = value.split('-').map(Number);
        const checkOut = new Date(y, m - 1, d + 2);
        updated.check_out = toISODateString(checkOut);
      }
      return updated;
    });
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const handleSave = async () => {
    if (mode === 'block') {
      const errs: string[] = [];
      if (!formData.house_id) errs.push('Bitte ein Ferienhaus auswählen.');
      if (!blockDateFrom) errs.push('Bitte ein Startdatum angeben.');
      if (!blockDateToDisplay) errs.push('Bitte ein Enddatum angeben.');
      if (blockDateFrom && blockDateToDisplay && blockDateToDisplay < blockDateFrom) {
        errs.push('Das Enddatum darf nicht vor dem Startdatum liegen.');
      }
      setBlockErrors(errs);
      if (errs.length > 0) return;

      const input: BlockInput = {
        house_id: Number(formData.house_id),
        date_from: blockDateFrom,
        date_to: addDays(blockDateToDisplay, 1),
        description: blockDescription.trim()
      };
      setSaving(true);
      try {
        const result = await onSaveBlock?.(input);
        if (result) onClose();
      } finally {
        setSaving(false);
      }
      return;
    }

    const validationErrors = validateBooking(
      formData,
      allBookings,
      booking?.id,
      settings.min_nights,
      blocks
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
      guest_first_name: formData.guest_first_name?.trim() || '',
      guest_email: formData.guest_email?.trim() || undefined,
      guest_phone: formData.guest_phone?.trim() || '',
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
      if (result) onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    setSaving(true);
    try {
      const success = await onDelete(booking.id);
      if (success) onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!booking) return;
    window.open(`${API.BOOKINGS}/${booking.id}/pdf`, '_blank');
  };

  if (!isOpen) return null;

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const daysBlocked = blockDateFrom && blockDateToDisplay && blockDateToDisplay >= blockDateFrom
    ? Math.round((new Date(blockDateToDisplay).getTime() - new Date(blockDateFrom).getTime()) / 86400000) + 1
    : 0;

  const modalTitle = isEditing
    ? 'Buchung bearbeiten'
    : mode === 'block'
      ? 'Neuer gesperrter Zeitraum'
      : 'Neuer Eintrag';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Typ-Tabs (nur für neue Einträge) */}
        {!isEditing && (
          <div className="px-4 pt-3">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleModeChange('reservation')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'reservation'
                    ? 'bg-reservation text-gray-800 font-medium shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reservierung
              </button>
              <button
                onClick={() => handleModeChange('booking')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'booking'
                    ? 'bg-booking text-white font-medium shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Buchung
              </button>
              <button
                onClick={() => handleModeChange('block')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'block'
                    ? 'bg-block-period text-gray-800 font-medium shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Zeitraum sperren
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'block' ? (
            /* Sperr-Formular */
            <div className="space-y-4 max-w-md">
              {/* Ferienhaus – nur wenn kein Haus vorausgewählt */}
              {!preselectedHouseId && (
                <div>
                  <label className={labelClass}>Ferienhaus *</label>
                  <select
                    className={inputClass}
                    value={formData.house_id || ''}
                    onChange={e => setFormData(prev => ({ ...prev, house_id: e.target.value ? Number(e.target.value) : undefined }))}
                    disabled={saving}
                  >
                    <option value="">— Bitte wählen —</option>
                    {houses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Von / Bis */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Von *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={blockDateFrom}
                    onChange={e => {
                      setBlockDateFrom(e.target.value);
                      if (e.target.value && (!blockDateToDisplay || blockDateToDisplay < e.target.value)) {
                        setBlockDateToDisplay(e.target.value);
                      }
                    }}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className={labelClass}>Bis *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={blockDateToDisplay}
                    min={blockDateFrom}
                    onChange={e => setBlockDateToDisplay(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              {daysBlocked > 0 && (
                <p className="text-xs text-gray-500">
                  Gesperrt: {formatDE(blockDateFrom)} – {formatDE(blockDateToDisplay)}
                  {' '}({daysBlocked === 1 ? '1 Tag' : `${daysBlocked} Tage`})
                </p>
              )}

              {/* Beschreibung */}
              <div>
                <label className={labelClass}>Beschreibung</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="z.B. Renovierung, Eigennutzung..."
                  value={blockDescription}
                  onChange={e => setBlockDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              {blockErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  {blockErrors.map((e, i) => (
                    <p key={i} className="text-red-600 text-sm">{e}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Buchungs-Formular */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <BookingForm
                  formData={formData}
                  houses={houses}
                  errors={errors}
                  onChange={handleFieldChange}
                  disabled={saving}
                />
              </div>
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
          )}
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
                  className={`btn disabled:opacity-50 ${
                    mode === 'block'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'btn-primary'
                  }`}
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
