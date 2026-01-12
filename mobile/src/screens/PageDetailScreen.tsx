import { useContext, useState } from 'react';
import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import PageDetailView from '../features/page_detail/PageDetailView';
import { INITIAL_PAGES } from '../mockData';
import type { Block, Page } from '../types';
import { getTodoCompleted } from '../utils/todo';
import type { RootStackParamList } from '../navigation/types';

const PageDetailScreen = () => {
  const navigation = useContext(NavigationContext) as NativeStackNavigationProp<RootStackParamList> | null;
  const route = useContext(NavigationRouteContext) as RouteProp<RootStackParamList, 'PageDetail'> | undefined;
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);

  const pageId = route?.params?.pageId ?? null;
  const activePage = pageId ? pages.find((page) => page.id === pageId) : pages[0];

  const toggleTodo = (targetPageId: string, blockId: string) => {
    setPages((prev) => prev.map((page) => {
      if (page.id !== targetPageId) return page;
      return {
        ...page,
        blocks: page.blocks.map((block) => {
          if (block.id !== blockId || block.type !== 'todo') return block;
          const completed = getTodoCompleted(block.content);
          return {
            ...block,
            content: {
              ...block.content,
              completed: !completed,
              done: !completed
            }
          } as Block;
        })
      };
    }));
  };

  if (!activePage) {
    return null;
  }

  return (
    <PageDetailView
      page={activePage}
      onBack={() => navigation?.goBack?.()}
      onToggleTodo={toggleTodo}
    />
  );
};

export default PageDetailScreen;
