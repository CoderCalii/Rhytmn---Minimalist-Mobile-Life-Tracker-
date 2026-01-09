import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { FinanceAccount } from '../../../types';
import { sanitizeText } from '../../../utils/sanitize';
import { validateAmount } from '../utils/validateFinance';

type RecurrenceCadence = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string | null;
  accountId: string | null;
  reminderDays: number | null;
  active: boolean;
}

export interface SubscriptionFormInput {
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string;
  accountId: string | null;
  reminderDays: number | null;
}

interface SubscriptionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscriptionItem[];
  accounts: FinanceAccount[];
  currencyCode?: 'USD' | 'PHP';
  loading: boolean;
  error?: string | null;
  onCreate: (input: SubscriptionFormInput) => Promise<string | null>;
  onUpdate: (id: string, input: SubscriptionFormInput) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

const formatAmount = (value: number, currencyCode: 'USD' | 'PHP') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const formatDueDate = (value?: string | null) => {
  if (!value) return 'No date';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'No date';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const SubscriptionsManagerModal = ({
  isOpen,
  onClose,
  subscriptions,
  accounts,
  currencyCode = 'USD',
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete
}: SubscriptionsManagerModalProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState<RecurrenceCadence>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      const aDate = a.nextDueDate ? new Date(`${a.nextDueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.nextDueDate ? new Date(`${b.nextDueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  }, [subscriptions]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (nextToast: { type: 'success' | 'error'; message: string }) => {
    setToast(nextToast);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2200);
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCadence('monthly');
    setNextDueDate('');
    setAccountId('');
    setReminderDays('');
    setEditingId(null);
  };

  const handleSelectSubscription = (subscription: SubscriptionItem) => {
    setEditingId(subscription.id);
    setName(subscription.name);
    setAmount(subscription.amount ? String(subscription.amount) : '');
    setCadence(subscription.cadence);
    setNextDueDate(subscription.nextDueDate ?? '');
    setAccountId(subscription.accountId ?? '');
    setReminderDays(subscription.reminderDays !== null ? String(subscription.reminderDays) : '');
    setFormError(null);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    const safeName = sanitizeText(name).trim();
    if (!safeName) {
      setFormError('Enter a subscription name.');
      return;
    }

    const amountValue = Number(amount);
    try {
      validateAmount(amountValue);
    } catch {
      setFormError('Enter a valid amount.');
      return;
    }

    if (!nextDueDate) {
      setFormError('Pick the next due date.');
      return;
    }

    const reminderValue = reminderDays.trim() === '' ? null : Number(reminderDays);
    if (reminderValue !== null && (!Number.isInteger(reminderValue) || reminderValue < 0)) {
      setFormError('Reminder days must be 0 or more.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: safeName,
      amount: amountValue,
      cadence,
      nextDueDate,
      accountId: accountId || null,
      reminderDays: reminderValue
    };

    const saveError = editingId
      ? await onUpdate(editingId, payload)
      : await onCreate(payload);

    setIsSaving(false);

    if (saveError) {
      setFormError(saveError);
      return;
    }

    showToast({ type: 'success', message: editingId ? 'Subscription updated.' : 'Subscription added.' });
    resetForm();
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setFormError(null);

    const deleteError = await onDelete(editingId);
    setIsSaving(false);

    if (deleteError) {
      setFormError(deleteError);
      return;
    }

    showToast({ type: 'success', message: 'Subscription removed.' });
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black">Subscriptions</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading subscriptions...</div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{error}</div>
          ) : sortedSubscriptions.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">No subscriptions yet.</div>
          ) : (
            <div className="space-y-3">
              {sortedSubscriptions.map((subscription) => (
                <button
                  key={subscription.id}
                  type="button"
                  onClick={() => handleSelectSubscription(subscription)}
                  className={`w-full rounded-2xl p-3 text-left text-sm transition ${
                    editingId === subscription.id
                      ? 'bg-white shadow-sm ring-2 ring-black/80'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{subscription.name}</span>
                    <span className="font-semibold text-slate-900">{formatAmount(subscription.amount, currencyCode)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{subscription.cadence}</span>
                    <span>{formatDueDate(subscription.nextDueDate)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Subscription name"
            value={name}
            onChange={(event) => setName(sanitizeText(event.target.value))}
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          <input
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={cadence}
              onChange={(event) => setCadence(event.target.value as RecurrenceCadence)}
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
          >
            <option value="">No account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Reminder days (optional)"
            type="number"
            value={reminderDays}
            onChange={(event) => setReminderDays(event.target.value)}
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          {formError && <p className="text-xs font-semibold text-rose-500">{formError}</p>}
          {toast && (
            <div
              className={`rounded-2xl px-4 py-2 text-center text-xs font-semibold ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {toast.message}
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : (editingId ? 'Update Subscription' : 'Add Subscription')}
          </button>
          {editingId && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 rounded-2xl border border-rose-200 py-3 text-xs font-bold uppercase tracking-widest text-rose-600 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsManagerModal;
