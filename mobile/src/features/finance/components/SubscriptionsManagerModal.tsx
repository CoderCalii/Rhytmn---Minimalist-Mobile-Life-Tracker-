import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import type { FinanceAccount } from '../../../types';
import { sanitizeText } from '../../../utils/sanitize';
import { validateAmount } from '../utils/validateFinance';
import type { RecurrenceCadence, SubscriptionFormInput, SubscriptionItem } from '../types';

export type { SubscriptionFormInput, SubscriptionItem } from '../types';

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

const cadenceOptions: RecurrenceCadence[] = ['weekly', 'monthly', 'yearly'];

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
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (nextToast: { type: 'success' | 'error'; message: string }) => {
    setToast(nextToast);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2200);
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
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-black">Subscriptions</Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center">
              <X size={16} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="rounded-2xl bg-slate-50 p-4">
                <Text className="text-sm text-slate-400">Loading subscriptions...</Text>
              </View>
            ) : error ? (
              <View className="rounded-2xl bg-rose-50 p-4">
                <Text className="text-sm text-rose-500">{error}</Text>
              </View>
            ) : sortedSubscriptions.length === 0 ? (
              <View className="rounded-2xl bg-slate-50 p-4">
                <Text className="text-sm text-slate-400">No subscriptions yet.</Text>
              </View>
            ) : (
              <View>
                {sortedSubscriptions.map((subscription) => (
                  <Pressable
                    key={subscription.id}
                    onPress={() => handleSelectSubscription(subscription)}
                    className={`w-full rounded-2xl p-3 mb-3 ${
                      editingId === subscription.id ? 'bg-white border border-black/80' : 'bg-slate-50'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-slate-900">{subscription.name}</Text>
                      <Text className="font-semibold text-slate-900">{formatAmount(subscription.amount, currencyCode)}</Text>
                    </View>
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-xs text-slate-400">{subscription.cadence}</Text>
                      <Text className="text-xs text-slate-400">{formatDueDate(subscription.nextDueDate)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            <View className="mt-6">
              <TextInput
                placeholder="Subscription name"
                value={name}
                onChangeText={(value) => setName(sanitizeText(value))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold"
              />
              <TextInput
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold"
              />

              <View className="mt-3">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cadence</Text>
                <View className="flex-row flex-wrap mt-2">
                  {cadenceOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setCadence(option)}
                      className={`px-3 py-1 rounded-full mr-2 mb-2 ${cadence === option ? 'bg-black' : 'bg-slate-50'}`}
                    >
                      <Text className={`text-[10px] font-bold uppercase tracking-widest ${cadence === option ? 'text-white' : 'text-slate-400'}`}>
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                placeholder="Next due date (YYYY-MM-DD)"
                value={nextDueDate}
                onChangeText={setNextDueDate}
                className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold"
              />

              <View className="mt-3">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</Text>
                <View className="flex-row flex-wrap mt-2">
                  <Pressable
                    onPress={() => setAccountId('')}
                    className={`px-3 py-1 rounded-full mr-2 mb-2 ${accountId === '' ? 'bg-black' : 'bg-slate-50'}`}
                  >
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${accountId === '' ? 'text-white' : 'text-slate-400'}`}>
                      No account
                    </Text>
                  </Pressable>
                  {accounts.map((account) => (
                    <Pressable
                      key={account.id}
                      onPress={() => setAccountId(account.id)}
                      className={`px-3 py-1 rounded-full mr-2 mb-2 ${accountId === account.id ? 'bg-black' : 'bg-slate-50'}`}
                    >
                      <Text className={`text-[10px] font-bold uppercase tracking-widest ${accountId === account.id ? 'text-white' : 'text-slate-400'}`}>
                        {account.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                placeholder="Reminder days (optional)"
                value={reminderDays}
                onChangeText={setReminderDays}
                keyboardType="numeric"
                className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold"
              />

              {formError ? (
                <Text className="mt-2 text-xs font-semibold text-rose-500">{formError}</Text>
              ) : null}
              {toast ? (
                <View className={`mt-2 rounded-2xl px-4 py-2 ${toast.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <Text className={`text-center text-xs font-semibold ${toast.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {toast.message}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                className="mt-3 w-full rounded-2xl bg-black py-3"
              >
                <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
                  {isSaving ? 'Saving...' : editingId ? 'Update Subscription' : 'Add Subscription'}
                </Text>
              </Pressable>

              {editingId ? (
                <View className="flex-row mt-3">
                  <Pressable
                    onPress={resetForm}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 mr-2"
                  >
                    <Text className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleDelete}
                    disabled={isSaving}
                    className="flex-1 rounded-2xl border border-rose-200 py-3"
                  >
                    <Text className="text-center text-xs font-bold uppercase tracking-widest text-rose-600">Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionsManagerModal;
