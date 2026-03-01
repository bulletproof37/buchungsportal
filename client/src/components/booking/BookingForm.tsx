import { useEffect } from 'react';
import { BookingInput, BookingStatus, House, ValidationError } from '../../types';
import { LABELS } from '../../utils/constants';
import { getFieldError } from '../../utils/validation';

interface BookingFormProps {
  formData: Partial<BookingInput>;
  houses: House[];
  errors: ValidationError[];
  onChange: (field: keyof BookingInput, value: string | number) => void;
  disabled?: boolean;
}

export default function BookingForm({
  formData,
  houses,
  errors,
  onChange,
  disabled = false
}: BookingFormProps) {
  // Automatisch Nachtpreis setzen wenn Haus gewählt wird
  useEffect(() => {
    if (formData.house_id && !formData.price_per_night) {
      const house = houses.find(h => h.id === formData.house_id);
      if (house) {
        onChange('price_per_night', house.price_per_night);
      }
    }
  }, [formData.house_id, formData.price_per_night, houses, onChange]);

  const inputClass = (field: string) => `
    input
    ${getFieldError(errors, field) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
  `;

  const selectClass = (field: string) => `
    select
    ${getFieldError(errors, field) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
  `;

  return (
    <div className="space-y-4">
      {/* Status (Reservierung/Buchung) */}
      <div>
        <label className="label">{LABELS.STATUS}</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="reservation"
              checked={formData.status === 'reservation'}
              onChange={(e) => onChange('status', e.target.value as BookingStatus)}
              disabled={disabled}
              className="w-4 h-4 text-reservation-dark focus:ring-reservation"
            />
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-reservation rounded"></span>
              <span>{LABELS.STATUS_RESERVATION}</span>
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="booking"
              checked={formData.status === 'booking'}
              onChange={(e) => onChange('status', e.target.value as BookingStatus)}
              disabled={disabled}
              className="w-4 h-4 text-booking-dark focus:ring-booking"
            />
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-booking rounded"></span>
              <span>{LABELS.STATUS_BOOKING}</span>
            </span>
          </label>
        </div>
        {getFieldError(errors, 'status') && (
          <p className="error-text">{getFieldError(errors, 'status')}</p>
        )}
      </div>

      {/* Ferienhaus */}
      <div>
        <label className="label">{LABELS.HOUSE} *</label>
        <select
          value={formData.house_id || ''}
          onChange={(e) => {
            const houseId = parseInt(e.target.value) || 0;
            onChange('house_id', houseId);
            // Nachtpreis vom Haus übernehmen
            const house = houses.find(h => h.id === houseId);
            if (house) {
              onChange('price_per_night', house.price_per_night);
            }
          }}
          disabled={disabled}
          className={selectClass('house_id')}
        >
          <option value="">Bitte wählen...</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name} ({house.price_per_night} € / Nacht)
            </option>
          ))}
        </select>
        {getFieldError(errors, 'house_id') && (
          <p className="error-text">{getFieldError(errors, 'house_id')}</p>
        )}
      </div>

      {/* Anreise / Abreise */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{LABELS.CHECK_IN} *</label>
          <input
            type="date"
            value={formData.check_in || ''}
            onChange={(e) => onChange('check_in', e.target.value)}
            disabled={disabled}
            className={inputClass('check_in')}
          />
          {getFieldError(errors, 'check_in') && (
            <p className="error-text">{getFieldError(errors, 'check_in')}</p>
          )}
        </div>
        <div>
          <label className="label">{LABELS.CHECK_OUT} *</label>
          <input
            type="date"
            value={formData.check_out || ''}
            onChange={(e) => onChange('check_out', e.target.value)}
            disabled={disabled}
            className={inputClass('check_out')}
          />
          {getFieldError(errors, 'check_out') && (
            <p className="error-text">{getFieldError(errors, 'check_out')}</p>
          )}
        </div>
      </div>

      <hr className="my-4" />

      {/* Gastdaten */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{LABELS.GUEST_FIRST_NAME}</label>
          <input
            type="text"
            value={formData.guest_first_name || ''}
            onChange={(e) => onChange('guest_first_name', e.target.value)}
            disabled={disabled}
            placeholder="Max"
            className={inputClass('guest_first_name')}
          />
          {getFieldError(errors, 'guest_first_name') && (
            <p className="error-text">{getFieldError(errors, 'guest_first_name')}</p>
          )}
        </div>
        <div>
          <label className="label">{LABELS.GUEST_LAST_NAME} *</label>
          <input
            type="text"
            value={formData.guest_last_name || ''}
            onChange={(e) => onChange('guest_last_name', e.target.value)}
            disabled={disabled}
            placeholder="Mustermann"
            className={inputClass('guest_last_name')}
          />
          {getFieldError(errors, 'guest_last_name') && (
            <p className="error-text">{getFieldError(errors, 'guest_last_name')}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">{LABELS.GUEST_PHONE}</label>
        <input
          type="tel"
          value={formData.guest_phone || ''}
          onChange={(e) => onChange('guest_phone', e.target.value)}
          disabled={disabled}
          placeholder="0123 456789"
          className={inputClass('guest_phone')}
        />
        {getFieldError(errors, 'guest_phone') && (
          <p className="error-text">{getFieldError(errors, 'guest_phone')}</p>
        )}
      </div>

      <div>
        <label className="label">{LABELS.GUEST_EMAIL}</label>
        <input
          type="email"
          value={formData.guest_email || ''}
          onChange={(e) => onChange('guest_email', e.target.value)}
          disabled={disabled}
          placeholder="max@example.com"
          className={inputClass('guest_email')}
        />
      </div>

      {/* Anschrift (aufklappbar) */}
      <details className="border rounded-lg p-3 bg-gray-50">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          Anschrift (optional)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">{LABELS.GUEST_STREET}</label>
            <input
              type="text"
              value={formData.guest_street || ''}
              onChange={(e) => onChange('guest_street', e.target.value)}
              disabled={disabled}
              placeholder="Musterstraße 123"
              className={inputClass('guest_street')}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{LABELS.GUEST_ZIP}</label>
              <input
                type="text"
                value={formData.guest_zip || ''}
                onChange={(e) => onChange('guest_zip', e.target.value)}
                disabled={disabled}
                placeholder="12345"
                className={inputClass('guest_zip')}
              />
            </div>
            <div className="col-span-2">
              <label className="label">{LABELS.GUEST_CITY}</label>
              <input
                type="text"
                value={formData.guest_city || ''}
                onChange={(e) => onChange('guest_city', e.target.value)}
                disabled={disabled}
                placeholder="Musterstadt"
                className={inputClass('guest_city')}
              />
            </div>
          </div>
        </div>
      </details>

      <hr className="my-4" />

      {/* Personen und Hunde */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{LABELS.GUEST_COUNT}</label>
          <input
            type="number"
            min="1"
            value={formData.guest_count || ''}
            onChange={(e) => onChange('guest_count', parseInt(e.target.value) || 0)}
            disabled={disabled}
            placeholder="2"
            className={inputClass('guest_count')}
          />
        </div>
        <div>
          <label className="label">{LABELS.DOG_COUNT}</label>
          <input
            type="number"
            min="0"
            value={formData.dog_count ?? 0}
            onChange={(e) => onChange('dog_count', parseInt(e.target.value) || 0)}
            disabled={disabled}
            className={inputClass('dog_count')}
          />
        </div>
      </div>

      {/* Nachtpreis (überschreibbar) */}
      <div>
        <label className="label">{LABELS.PRICE_PER_NIGHT} (überschreibbar für Sonderfälle)</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price_per_night || ''}
            onChange={(e) => onChange('price_per_night', parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={inputClass('price_per_night') + ' pr-8'}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
        </div>
      </div>

      {/* Notizen */}
      <div>
        <label className="label">{LABELS.NOTES}</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Zusätzliche Informationen..."
          className={inputClass('notes') + ' resize-none'}
        />
      </div>
    </div>
  );
}
