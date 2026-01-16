import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import FinanceCaptureModal from '../features/finance/capture/FinanceCaptureModal';
import FinanceView from '../features/finance/FinanceView';
import { useSettings } from '../hooks/useSettings';
import FloatingLayout from '../components/layout/FloatingLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFabBottomOffset } from '../components/layout/layoutConstants';

const FinanceScreen = () => {
  const { currencyCode } = useSettings();
  const [showCapture, setShowCapture] = useState(false);
  const [showFabActions, setShowFabActions] = useState(false);
  const [captureType, setCaptureType] = useState<'income' | 'transfer' | 'goal' | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const insets = useSafeAreaInsets();
  const actionBottom = useMemo(() => getFabBottomOffset(insets) + 56, [insets]);

  return (
    <FloatingLayout
      showFAB
      fabAction={() => {
        setCaptureType(null);
        setShowCapture(true);
      }}
      fabLongPressAction={() => setShowFabActions(true)}
      fabIcon={<Plus size={24} color="#ffffff" />}
    >
      <View className="flex-1">
        <FinanceView refreshToken={refreshToken} currencyCode={currencyCode} />
        {showFabActions && (
          <View className="absolute inset-0 z-50">
            <Pressable className="absolute inset-0" onPress={() => setShowFabActions(false)} />
            <View
              className="absolute w-48 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl gap-1"
              style={{ left: '50%', marginLeft: -96, bottom: actionBottom }}
            >
              <Pressable
                onPress={() => {
                  setShowFabActions(false);
                  setCaptureType('income');
                  setShowCapture(true);
                }}
                className="w-full rounded-2xl px-3 py-2"
              >
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                  <Text className="text-xs font-bold uppercase tracking-widest text-slate-600">Add income</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowFabActions(false);
                  setCaptureType('transfer');
                  setShowCapture(true);
                }}
                className="w-full rounded-2xl px-3 py-2"
              >
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                  <Text className="text-xs font-bold uppercase tracking-widest text-slate-600">Add transfer</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowFabActions(false);
                  setCaptureType('goal');
                  setShowCapture(true);
                }}
                className="w-full rounded-2xl px-3 py-2"
              >
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-purple-500 mr-2" />
                  <Text className="text-xs font-bold uppercase tracking-widest text-slate-600">Add goal</Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}
        {showCapture && (
          <FinanceCaptureModal
            onClose={() => {
              setShowCapture(false);
              setCaptureType(null);
            }}
            initialType={captureType}
            currencyCode={currencyCode}
            onSaved={() => {
              setRefreshToken((token) => token + 1);
              setShowCapture(false);
              setCaptureType(null);
            }}
          />
        )}
      </View>
    </FloatingLayout>
  );
};

export default FinanceScreen;
