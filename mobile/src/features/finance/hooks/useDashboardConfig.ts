import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DASHBOARD_CARD_ORDER } from '../constants';
import type { DashboardCardId, DashboardConfig } from '../types';
import { buildDefaultDashboardConfig, normalizeDashboardConfig, readDashboardConfig } from '../utils/financeDashboard';
import { shiftRange } from '../utils/financeRanges';

const useDashboardConfig = (dashboardKey: string) => {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => buildDefaultDashboardConfig());
  const readyRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    readDashboardConfig(dashboardKey).then((nextConfig) => {
      if (!isMounted) return;
      readyRef.current = true;
      setDashboardConfig(nextConfig);
    });
    return () => {
      isMounted = false;
    };
  }, [dashboardKey]);

  useEffect(() => {
    if (!readyRef.current) return;
    const persist = async () => {
      const normalized = normalizeDashboardConfig(dashboardConfig);
      try {
        await AsyncStorage.setItem(dashboardKey, JSON.stringify(normalized));
      } catch {
        // Ignore persistence failures.
      }
    };
    persist();
  }, [dashboardConfig, dashboardKey]);

  const handleCardPinToggle = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => {
      const pinned = new Set(prev.pinned);
      if (pinned.has(cardId)) {
        pinned.delete(cardId);
      } else {
        pinned.add(cardId);
      }
      return { ...prev, pinned: Array.from(pinned) };
    });
  };

  const handleCardHide = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => ({
      ...prev,
      hidden: Array.from(new Set([...prev.hidden, cardId]))
    }));
  };

  const handleCardShow = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => ({
      ...prev,
      hidden: prev.hidden.filter((item) => item !== cardId)
    }));
  };

  const handleCardDrop = (draggingCardId: DashboardCardId | null, targetId: DashboardCardId) => {
    if (!draggingCardId || draggingCardId === targetId) {
      return;
    }
    setDashboardConfig((prev) => {
      const nextOrder = prev.order.filter((item) => item !== draggingCardId);
      const targetIndex = nextOrder.indexOf(targetId);
      if (targetIndex === -1) return prev;
      nextOrder.splice(targetIndex, 0, draggingCardId);
      return { ...prev, order: nextOrder };
    });
  };

  const handleCardSwipe = (cardId: DashboardCardId, direction: 'next' | 'prev') => {
    setDashboardConfig((prev) => {
      const current = prev.ranges[cardId] ?? 'week';
      const next = shiftRange(current, direction);
      return { ...prev, ranges: { ...prev.ranges, [cardId]: next } };
    });
  };

  const orderedDashboardCards = useMemo(() => {
    const hidden = new Set(dashboardConfig.hidden);
    const pinnedSet = new Set(dashboardConfig.pinned);
    const baseOrder = dashboardConfig.order.filter((cardId) => !hidden.has(cardId));
    const pinned = dashboardConfig.pinned.filter((cardId) => !hidden.has(cardId));
    const rest = baseOrder.filter((cardId) => !pinnedSet.has(cardId));
    return [...pinned, ...rest];
  }, [dashboardConfig.hidden, dashboardConfig.order, dashboardConfig.pinned]);

  const hiddenCards = useMemo(() => {
    return dashboardConfig.hidden.filter((cardId) => DASHBOARD_CARD_ORDER.includes(cardId));
  }, [dashboardConfig.hidden]);

  return {
    dashboardConfig,
    orderedDashboardCards,
    hiddenCards,
    handleCardPinToggle,
    handleCardHide,
    handleCardShow,
    handleCardDrop,
    handleCardSwipe
  };
};

export default useDashboardConfig;
