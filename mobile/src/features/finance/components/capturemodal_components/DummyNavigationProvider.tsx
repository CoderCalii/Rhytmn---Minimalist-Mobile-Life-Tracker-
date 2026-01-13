import { useMemo, useEffect, useRef, Component, createContext, type ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import { NavigationContext as RNNavigationContext } from '@react-navigation/native';

// Create our own NavigationStateContext since it's not exported from @react-navigation
// This is what react-native-css-interop accesses when stringifying components
const NavigationStateContext = createContext<any>(undefined);

// Error Boundary to catch navigation context errors
class NavigationErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NavigationErrorBoundary] Caught error:', error);
    console.error('[NavigationErrorBoundary] Error info:', errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return children anyway - we'll provide a dummy context
      return this.props.children;
    }
    return this.props.children;
  }
}

// Create a stable dummy navigation context provider for modals
// We ALWAYS provide our own context in modals to prevent context loss during re-renders
export const DummyNavigationProvider = ({ children }: { children: ReactNode }) => {
  const navigationContextRef = useRef<any>(null);
  const stateContextRef = useRef<any>(null);
  
  // Create navigation context immediately, not in useMemo
  if (!navigationContextRef.current) {
    console.log('[DummyNavigationProvider] Creating stable dummy navigation context (immediate)');
    navigationContextRef.current = {
      isFocused: () => true,
      addListener: () => () => {},
      removeListener: () => {},
      canGoBack: () => false,
      dispatch: () => {},
      getParent: () => undefined,
      getState: () => ({ routes: [], index: 0 }),
      goBack: () => {},
      navigate: () => {},
      reset: () => {},
      setOptions: () => {},
      setParams: () => {},
      getId: () => undefined,
      isReady: () => true,
      getRootState: () => ({ routes: [], index: 0 }),
    } as any;
  }
  
  // Create navigation state context immediately
  // This is what react-native-css-interop accesses when stringifying (calls getKey())
  if (!stateContextRef.current) {
    console.log('[DummyNavigationProvider] Creating stable dummy navigation state context (immediate)');
    stateContextRef.current = {
      key: 'dummy-navigation-state',
      getKey: () => 'dummy-navigation-state',
      getState: () => ({ routes: [], index: 0 }),
      getIsInitial: () => false,
    } as any;
  }
  
  const dummyNavigationContext = navigationContextRef.current;
  const dummyStateContext = stateContextRef.current;

  useEffect(() => {
    console.log('[DummyNavigationProvider] Mounted');
    console.log('[DummyNavigationProvider] Navigation context exists:', !!dummyNavigationContext);
    console.log('[DummyNavigationProvider] State context exists:', !!dummyStateContext);
    return () => {
      console.log('[DummyNavigationProvider] Unmounted');
    };
  }, []);

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    if (error.message?.includes('navigation context') || 
        error.message?.includes('NavigationContainer') ||
        error.message?.includes('NavigationStateContext')) {
      console.error('[DummyNavigationProvider] Navigation context error in boundary:', error);
      console.error('[DummyNavigationProvider] Error stack:', error.stack);
      console.error('[DummyNavigationProvider] Component stack:', errorInfo.componentStack);
    }
  };

  return (
    <NavigationErrorBoundary onError={handleError}>
      <RNNavigationContext.Provider value={dummyNavigationContext}>
        <NavigationStateContext.Provider value={dummyStateContext}>
          {children}
        </NavigationStateContext.Provider>
      </RNNavigationContext.Provider>
    </NavigationErrorBoundary>
  );
};
