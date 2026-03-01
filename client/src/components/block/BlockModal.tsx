import { useState, useEffect } from 'react';
import { Block, BlockInput, House } from '../../types';

interface BlockModalProps {
  isOpen: boolean;
  block: Block | null; // null = neue Sperrzeit
  houses: House[];
  onClose: () => void;
  onSave: (input: BlockInput) => Promise<Block | null>;
  onUpdate: (id: number, input: BlockInput) => Promise<Block | null>;
  onDelete: (id: number) => Promise<boolean>;
  preselectedHouseId?: number;
  preselectedDate?: Date;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fügt n Tage zu einem ISO-Datum hinzu (n kann negativ sein) */
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return toISO(date);
}

function formatDE(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function BlockModal({
  isOpen,
  block,
  houses,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  preselectedHouseId,
  preselectedDate
}: BlockModalProps) {
  const [houseId, setHouseId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  // dateToDisplay ist inklusiv (letzter gesperrter Tag), in der DB wird +1 Tag gespeichert
  const [dateToDisplay, setDateToDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const isEditing = !!block;

  useEffect(() => {
    if (isOpen) {
      if (block) {
        setHouseId(block.house_id);
        setDateFrom(block.date_from);
        // date_to in DB ist exklusiv → anzeigen als inklusiv (−1 Tag)
        setDateToDisplay(addDays(block.date_to, -1));
        setDescription(block.description);
      } else {
        setHouseId(preselectedHouseId ?? '');
        const from = preselectedDate ? toISO(preselectedDate) : '';
        setDateFrom(from);
        // Standard: gleicher Tag (1 Tag gesperrt)
        setDateToDisplay(from);
        setDescription('');
      }
      setErrors([]);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, block, preselectedHouseId, preselectedDate]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!houseId) errs.push('Bitte ein Ferienhaus auswählen.');
    if (!dateFrom) errs.push('Bitte ein Startdatum angeben.');
    if (!dateToDisplay) errs.push('Bitte ein Enddatum angeben.');
    if (dateFrom && dateToDisplay && dateToDisplay < dateFrom) {
      errs.push('Das Enddatum darf nicht vor dem Startdatum liegen.');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const input: BlockInput = {
      house_id: Number(houseId),
      date_from: dateFrom,
      // Inklusives Bis-Datum → exklusiv speichern (+1 Tag)
      date_to: addDays(dateToDisplay, 1),
      description: description.trim()
    };

    setSaving(true);
    try {
      let result: Block | null;
      if (isEditing) {
        result = await onUpdate(block!.id, input);
      } else {
        result = await onSave(input);
      }
      if (result) onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;
    setSaving(true);
    try {
      const ok = await onDelete(block.id);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const daysBlocked = dateFrom && dateToDisplay && dateToDisplay >= dateFrom
    ? Math.round((new Date(dateToDisplay).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-red-700">
            {isEditing ? 'Sperrzeit bearbeiten' : 'Neuer gesperrter Zeitraum'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Ferienhaus – nur wenn kein Haus vorausgewählt (Header-Button) oder beim Bearbeiten */}
          {(!preselectedHouseId || isEditing) && (
            <div>
              <label className={labelClass}>Ferienhaus *</label>
              <select
                className={inputClass}
                value={houseId}
                onChange={e => setHouseId(e.target.value ? Number(e.target.value) : '')}
                disabled={saving}
              >
                <option value="">— Bitte wählen —</option>
                {houses.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Zeitraum */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Von *</label>
              <input
                type="date"
                className={inputClass}
                value={dateFrom}
                onChange={e => {
                  setDateFrom(e.target.value);
                  // Bis-Datum auf Von setzen wenn noch leer oder davor liegt
                  if (e.target.value && (!dateToDisplay || dateToDisplay < e.target.value)) {
                    setDateToDisplay(e.target.value);
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
                value={dateToDisplay}
                min={dateFrom}
                onChange={e => setDateToDisplay(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {daysBlocked > 0 && (
            <p className="text-xs text-gray-500">
              Gesperrt: {formatDE(dateFrom)} – {formatDE(dateToDisplay)}
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
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Fehler */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              {errors.map((e, i) => (
                <p key={i} className="text-red-600 text-sm">{e}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <p className="text-red-600 text-sm">Sperrzeit wirklich löschen?</p>
              <div className="flex space-x-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary" disabled={saving}>Nein</button>
                <button onClick={handleDelete} className="btn bg-red-500 text-white hover:bg-red-600" disabled={saving}>
                  {saving ? 'Wird gelöscht...' : 'Ja, löschen'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                {isEditing && (
                  <button onClick={() => setShowDeleteConfirm(true)} className="btn text-red-600 hover:bg-red-50" disabled={saving}>
                    Löschen
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button onClick={onClose} className="btn btn-secondary" disabled={saving}>Abbrechen</button>
                <button
                  onClick={handleSave}
                  className="btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
