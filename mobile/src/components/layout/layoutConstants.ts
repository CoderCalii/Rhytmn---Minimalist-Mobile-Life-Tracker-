import type { EdgeInsets } from 'react-native-safe-area-context';

export const NAV_HEIGHT = 64;
export const NAV_BOTTOM_OFFSET = 24;
export const FAB_SIZE = 64;
export const FAB_OFFSET = 72;
export const SCROLL_BOTTOM_PADDING = 128;

export const getNavBottomOffset = (insets: EdgeInsets) => insets.bottom + NAV_BOTTOM_OFFSET;
export const getFabBottomOffset = (insets: EdgeInsets) => getNavBottomOffset(insets) + FAB_OFFSET;
export const getScrollPaddingBottom = (insets: EdgeInsets) => insets.bottom + SCROLL_BOTTOM_PADDING;
