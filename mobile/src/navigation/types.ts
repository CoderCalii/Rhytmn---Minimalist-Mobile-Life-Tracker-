export type RootStackParamList = {
  Tabs: { screen?: keyof TabParamList } | undefined;
  PageDetail: { pageId?: string } | undefined;
  ArchivedTasks: undefined;
};

export type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  Habits: undefined;
  Finance: undefined;
  Settings: undefined;
};
