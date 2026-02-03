import React, { useContext, useEffect } from 'react';
import { MathGameContext } from '../App.jsx';
import QuizScreen from './QuizScreen.jsx';

const PreTestScreen = () => {
  const { isPretest, navigate, isQuittingRef } = useContext(MathGameContext);

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
