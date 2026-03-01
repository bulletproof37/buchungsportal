import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Settings } from '../../types';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof Settings, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const ok = await updateSettings(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
    } else {
      setError('Fehler beim Speichern der Einstellungen');
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Lade Einstellungen...</div>;
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Einstellungen</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Firmendaten */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Firmendaten</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Firmenname</label>
              <input
                type="text"
                className={inputClass}
                value={form.company_name}
                onChange={e => handleChange('company_name', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Straße</label>
              <input
                type="text"
                className={inputClass}
                value={form.company_address}
                onChange={e => handleChange('company_address', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>PLZ</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.company_zip}
                  onChange={e => handleChange('company_zip', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Ort</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.company_city}
                  onChange={e => handleChange('company_city', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Telefon</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.company_phone}
                  onChange={e => handleChange('company_phone', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Mobil</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.company_mobile}
                  onChange={e => handleChange('company_mobile', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>E-Mail</label>
              <input
                type="email"
                className={inputClass}
                value={form.company_email}
                onChange={e => handleChange('company_email', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Standardwerte */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Standardwerte</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Aufpreis erste Nacht (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.surcharge_first_night}
                onChange={e => handleChange('surcharge_first_night', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelClass}>Preis pro Hund/Nacht (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.price_per_dog_night}
                onChange={e => handleChange('price_per_dog_night', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelClass}>Mindestaufenthalt (Nächte)</label>
              <input
                type="number"
                step="1"
                min="1"
                className={inputClass}
                value={form.min_nights}
                onChange={e => handleChange('min_nights', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-green-600 text-sm font-medium">Einstellungen gespeichert.</span>
            )}
            {error && (
              <span className="text-red-500 text-sm">{error}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
