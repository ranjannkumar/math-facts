import React, { useEffect } from 'react';
import QuizScreen from './QuizScreen.jsx';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const PreTestScreen = () => {
  const { isPretest, navigate, isQuittingRef } = useMathGamePick((ctx) => ({
    isPretest: Boolean(ctx.isPretest),
    navigate: ctx.navigate || (() => {}),
    isQuittingRef: ctx.isQuittingRef || { current: false },
  }));

  useEffect(() => {
    if (!isPretest) {
      if (isQuittingRef?.current) {
        navigate('/', { replace: true });
        return;
      }
      navigate('/levels', { replace: true });
    }
  }, [isPretest, navigate, isQuittingRef]);

  if (!isPretest) return null;

  return <QuizScreen />;
};

export default PreTestScreen;
