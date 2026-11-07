import { useMemo } from 'react';
import { useObjectLayout } from '../layout/useObjectLayout';
import { lightLayout } from './lightLayout';

export const useLightLayout = () => {
  const { layout, save } = useObjectLayout('lights');
  const effective = useMemo(() => lightLayout(layout), [layout]);
  return { layout, effective, save };
};
