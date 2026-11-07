import { useMemo } from 'react';
import { useObjectLayout } from '../layout/useObjectLayout';
import { shutterLayout } from './shutterLayout';

export const useShutterLayout = () => {
  const { layout, save } = useObjectLayout('shutters');
  const effective = useMemo(() => shutterLayout(layout), [layout]);
  return { layout, effective, save };
};
