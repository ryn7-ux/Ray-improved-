import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldCheck, Key, CheckCircle2, XCircle, Loader2, Download, Upload, DatabaseBackup } from 'lucide-react';
import { useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Every lifehub_ key the app currently writes to localStorage. Kept in one place so
// Clear Data and Export/Import can never drift out of sync with what App.tsx actually stores.
const ALL_DATA_KEYS = [
  'lifehub_transactions',
  'lifehub_buckets',
  'lifehub_loans',
  'lifehub_repayments',
  'lifehub_foods',
  'lifehub_favorite_meals',
  'lifehub_workouts',
  'lifehub_notes',
  'lifehub_workout_plan',
  'lifehub_weights',
  'lifehub_sleeps',
  'lifehub_waters',
  'lifehub_profile',
  'lifehub_theme',
  'lifehub_welcome_seen_v4',
  'lifehub_ai_provider',
  'lifehub_gemini_api_key',
  'lifehub_gemini_model',
  'lifehub_openai_api_key',
  'lifehub_openai_model',
  'lifehub_anthropic_api_key',
  'lifehub_anthropic_model'
];

export function SettingsView({ onReplayWelcome }: { onReplayWelcome?: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [aiProvider, setAiProvider] = useLocalStorage<string>('lifehub_ai_provider', 'gemini');
  const [geminiKey, setGeminiKey] = useLocalStorage<string>('lifehub_gemini_api_key', '');
  const [geminiModel, setGeminiModel] = useLocalStorage<string>('lifehub_gemini_model', 'gemini-2.5-flash');

  const [openAiKey, setOpenAiKey] = useLocalStorage<string>('lifehub_openai_api_key', '');
  const [openAiModel, setOpenAiModel] = useLocalStorage<string>('lifehub_openai_model', 'gpt-4o-mini');

  const [anthropicKey, setAnthropicKey] = useLocalStorage<string>('lifehub_anthropic_api_key', '');
  const [anthropicModel, setAnthropicModel] = useLocalStorage<string>('lifehub_anthropic_model', 'claude-3-5-haiku-20241022');

  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateKey = useCallback(async (provider: string, key: string, model: string) => {
    if (!key) {
      setValidationStatus('idle');
      setValidationError('');
      return;
    }
    setIsValidating(true);
    setValidationStatus('idle');
    setValidationError('');
    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key, model })
      });
      const data = await res.json();
      if (data.valid) {
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
        setValidationError(data.error || 'Invalid API Key or Model.');
      }
    } catch (e) {
      setValidationStatus('invalid');
      setValidationError('Network error or server unreachable.');
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Effect to re-validate when provider, key, or model changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (aiProvider === 'gemini') validateKey('gemini', geminiKey, geminiModel);
      else if (aiProvider === 'openai') validateKey('openai', openAiKey, openAiModel);
      else if (aiProvider === 'anthropic') validateKey('anthropic', anthropicKey, anthropicModel);
    }, 1000);
    return () => clearTimeout(timer);
  }, [aiProvider, geminiKey, geminiModel, openAiKey, openAiModel, anthropicKey, anthropicModel, validateKey]);

  const handleClearData = () => {
    if (isConfirming) {
      ALL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
      // Reload page to reset state
      window.location.reload();
    } else {
      setIsConfirming(true);
    }
  };

  const handleExportData = () => {
    const backup: Record<string, unknown> = { _exportedAt: new Date().toISOString(), _app: 'RYN HUB' };
    ALL_DATA_KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          backup[key] = JSON.parse(raw);
        } catch {
          backup[key] = raw;
        }
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rynhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportStatus(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const keysFound = ALL_DATA_KEYS.filter(key => key in parsed);

        if (keysFound.length === 0) {
          setImportStatus('This file doesn\'t look like a RYN HUB backup — no matching data found.');
          return;
        }

        if (!confirm(`This will overwrite your current data with the ${keysFound.length} section(s) found in this backup. Continue?`)) {
          return;
        }

        keysFound.forEach(key => {
          localStorage.setItem(key, JSON.stringify(parsed[key]));
        });

        setImportStatus('Backup restored. Reloading...');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        setImportStatus('Could not read that file. Make sure it\'s a valid RYN HUB backup JSON.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1">Manage your application data and preferences.</p>
      </div>

      <div className="surface-panel p-6 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-emerald-400" /> AI Configuration
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            To use the AI-powered features, choose your preferred AI provider and enter its API key.
            It will be saved securely in your browser's local storage and used directly for requests.
          </p>

          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            {aiProvider === 'gemini' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">Gemini Model</label>
                  <input
                    type="text"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    placeholder="e.g. gemini-2.5-flash or gemini-2.5-pro"
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">Gemini API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-10 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-500 animate-spin" />
                    ) : validationStatus === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : validationStatus === 'invalid' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google AI Studio</a>.
                </p>
                {validationStatus === 'invalid' && (
                  <p className="text-xs text-rose-500 mt-2">{validationError || 'Invalid API Key or Model.'}</p>
                )}
              </div>
            )}

            {aiProvider === 'openai' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">OpenAI Model</label>
                  <input
                    type="text"
                    value={openAiModel}
                    onChange={(e) => setOpenAiModel(e.target.value)}
                    placeholder="e.g. gpt-4o-mini or gpt-4-turbo"
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-10 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-500 animate-spin" />
                    ) : validationStatus === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : validationStatus === 'invalid' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Get an API key from your <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">OpenAI Dashboard</a>.
                </p>
                {validationStatus === 'invalid' && (
                  <p className="text-xs text-rose-500 mt-2">{validationError || 'Invalid API Key or Model.'}</p>
                )}
              </div>
            )}

            {aiProvider === 'anthropic' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">Anthropic Model</label>
                  <input
                    type="text"
                    value={anthropicModel}
                    onChange={(e) => setAnthropicModel(e.target.value)}
                    placeholder="e.g. claude-3-5-sonnet-20241022"
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">Anthropic API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-10 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-500 animate-spin" />
                    ) : validationStatus === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : validationStatus === 'invalid' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Get an API key from your <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Anthropic Console</a>.
                </p>
                {validationStatus === 'invalid' && (
                  <p className="text-xs text-rose-500 mt-2">{validationError || 'Invalid API Key or Model.'}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Data Privacy & Storage
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            All your data is stored locally in your browser's <strong className="text-zinc-800 dark:text-zinc-200">Local Storage</strong>.
            It never leaves your device and is not stored on any external servers. This means your data is completely private.
          </p>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
            <DatabaseBackup className="w-5 h-5 text-emerald-400" /> Backup & Restore
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Since everything lives only in this browser, it's worth keeping a backup. Export a copy of all your data as a
            file you can save anywhere, and restore it here later — on this device or a new one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-600/30 transition-colors font-bold text-xs uppercase tracking-wider"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors font-bold text-xs uppercase tracking-wider"
            >
              <Upload className="w-4 h-4" /> Import Backup
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importStatus && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">{importStatus}</p>
          )}
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
          <h3 className="font-display text-lg font-semibold text-rose-500 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium text-sm">Clear All Application Data</p>
              <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1">
                This action is irreversible. It will delete all your transactions, diet logs, fitness logs, and profile settings.
                Consider exporting a backup above first.
              </p>
            </div>

            <button
              onClick={handleClearData}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                isConfirming
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                  : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-rose-400'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {isConfirming ? 'Are you sure?' : 'Clear Data'}
            </button>
          </div>
          {isConfirming && (
            <p className="text-rose-400 text-xs mt-3 animate-in slide-in-from-top-2">
              Click again to permanently delete all data. The application will reload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
