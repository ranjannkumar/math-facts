import React, { useContext, useEffect } from 'react';
import { MathGameContext } from '../App.jsx';
import QuizScreen from './QuizScreen.jsx';

const PreTestScreen = () => {
  const { isPretest, navigate } = useContext(MathGameContext);

  useEffect(() => {
    if (!isPretest) {
      navigate('/levels', { replace: true });
    }
  }, [isPretest, navigate]);

  if (!isPretest) return null;

  return <QuizScreen />;
};

export default PreTestScreen;
