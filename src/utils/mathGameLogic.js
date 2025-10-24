// src/utils/mathGameLogic.js

// ---------- Visual helpers (used by TablePicker) ----------
export const tableBgColors = [
  'bg-yellow-300 border-yellow-400',
  'bg-pink-300 border-pink-400',
  'bg-green-300 border-green-400',
  'bg-orange-300 border-orange-400',
  'bg-purple-300 border-purple-400',
  'bg-amber-300 border-amber-400',
  'bg-lime-300 border-lime-500',
  'bg-blue-300 border-blue-500',
  'bg-rose-300 border-rose-400',
  'bg-cyan-300 border-cyan-400',
  'bg-teal-300 border-teal-400',
  'bg-indigo-300 border-indigo-400',
];

export const showShootingStars = () => {
  // console.log('🎆 Shooting stars function called!');
  const leftStarSpeeds = [550, 500, 450, 575, 525];
  const rightStarSpeeds = [550, 500, 450, 575, 525];
  const starColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd700', '#96ceb4'];

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.background = starColors[i];
      star.style.filter = `drop-shadow(0 0 15px ${starColors[i]})`;
      star.style.left = '20px';
      star.style.bottom = '20px';
      const speed = leftStarSpeeds[i];
      const duration = 3;
      const customAnimation = `
        @keyframes customShootLeft${i} {
          0% { transform: translate(0, 0) rotate(45deg); opacity: 1; }
          14% { transform: translate(${speed}px, -${speed / 2}px) rotate(45deg); opacity: 1; }
          100% { transform: translate(${speed}px, -${speed / 3}px) rotate(45deg); opacity: 0; }
        }
      `;
      const style = document.createElement('style');
      style.textContent = customAnimation;
      document.head.appendChild(style);
      star.style.animation = `customShootLeft${i} ${duration}s ease-out forwards`;
      const randomDelay = Math.random() * 0.2;
      star.style.animationDelay = i * 0.15 + randomDelay + 's';
      document.body.appendChild(star);
      setTimeout(() => {
        star.parentNode && star.parentNode.removeChild(star);
        style.parentNode && style.parentNode.removeChild(style);
      }, (duration + 1) * 1000);
    }, i * 80);
  }

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.background = starColors[i];
      star.style.filter = `drop-shadow(0 0 15px ${starColors[i]})`;
      star.style.right = '20px';
      star.style.bottom = '20px';
      const speed = rightStarSpeeds[i];
      const duration = 3;
      const customAnimation = `
        @keyframes customShootRight${i} {
          0% { transform: translate(0, 0) rotate(-45deg); opacity: 1; }
          14% { transform: translate(-${speed}px, -${speed / 2}px) rotate(-45deg); opacity: 1; }
          100% { transform: translate(-${speed}px, -${speed / 3}px) rotate(-45deg); opacity: 0; }
        }
      `;
      const style = document.createElement('style');
      style.textContent = customAnimation;
      document.head.appendChild(style);
      star.style.animation = `customShootRight${i} ${duration}s ease-out forwards`;
      const randomDelay = Math.random() * 0.2;
      star.style.animationDelay = i * 0.15 + randomDelay + 's';
      document.body.appendChild(star);
      setTimeout(() => {
        star.parentNode && star.parentNode.removeChild(star);
        style.parentNode && style.parentNode.removeChild(style);
      }, (duration + 1) * 1000);
    }, i * 80);
  }
};

export const clearShootingStars = () =>
  document.querySelectorAll('.shooting-star').forEach((star) => star.remove());

// ---------- Theme config & age → theme mapping (KEEP) ----------
export const themeConfigs = {
  animals: {
    bg: 'from-green-300 via-yellow-200 to-green-500',
    image: '/animals.jpg',
    tableEmojis: ['🐶', '🐱', '🦁', '🐯', '🐵', '🐸', '🐧', '🐼', '🐨', '🦊', '🐻', '🐰'],
    tableNames: [
      'Dog', 'Cat', 'Lion', 'Tiger', 'Monkey', 'Frog', 'Penguin', 'Panda', 'Koala', 'Fox', 'Bear', 'Rabbit'
    ],
    tableColors: [
      'bg-green-400 border-green-600', 'bg-yellow-300 border-yellow-500', 'bg-orange-300 border-orange-500',
      'bg-pink-300 border-pink-500', 'bg-blue-300 border-blue-500', 'bg-purple-300 border-purple-500',
      'bg-gray-300 border-gray-500', 'bg-red-300 border-red-500', 'bg-teal-300 border-teal-600',
      'bg-lime-300 border-lime-500', 'bg-amber-300 border-amber-500', 'bg-cyan-300 border-cyan-500'
    ],
  },
  candyland: {
    bg: 'from-pink-200 via-yellow-100 to-pink-400',
    image: '/candyland.jpg',
    tableEmojis: ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁', '🍰', '🍦', '🥧', '🍮', '🍯', '🍨'],
    tableNames: [
      'Candy', 'Lollipop', 'Chocolate', 'Donut', 'Cookie', 'Cupcake', 'Cake', 'Ice Cream', 'Pie', 'Pudding', 'Honey', 'Gelato'
    ],
    tableColors: [
      'bg-pink-300 border-pink-500', 'bg-yellow-200 border-yellow-400', 'bg-orange-200 border-orange-400',
      'bg-purple-200 border-purple-400', 'bg-blue-200 border-blue-400', 'bg-green-200 border-green-400',
      'bg-red-200 border-red-400', 'bg-amber-200 border-amber-400', 'bg-lime-200 border-lime-400',
      'bg-cyan-200 border-cyan-400', 'bg-fuchsia-200 border-fuchsia-400', 'bg-rose-200 border-rose-400'
    ],
  },
  fairytales: {
    bg: 'from-pink-300 via-purple-200 to-blue-200',
    image: '/fairytales.jpg',
    tableEmojis: ['🧚', '🦄', '🐉', '👸', '🧙', '🧞', '🧜', '🦸', '🧝', '🧟', '🧚', '🦄'],
    tableNames: [
      'Fairy', 'Unicorn', 'Dragon', 'Princess', 'Wizard', 'Genie', 'Mermaid', 'Hero', 'Elf', 'Zombie', 'Sprite', 'Pegasus'
    ],
    tableColors: [
      'bg-pink-400 border-pink-600', 'bg-purple-300 border-purple-500', 'bg-blue-300 border-blue-500',
      'bg-yellow-300 border-yellow-500', 'bg-green-300 border-green-500', 'bg-red-300 border-red-500',
      'bg-orange-300 border-orange-500', 'bg-cyan-300 border-cyan-500', 'bg-lime-300 border-lime-500',
      'bg-amber-300 border-amber-500', 'bg-fuchsia-300 border-fuchsia-500', 'bg-rose-300 border-rose-400'
    ],
  },
  farm: {
    bg: 'from-yellow-200 via-green-200 to-yellow-400',
    image: '/farm.jpg',
    tableEmojis: ['🐮', '🐷', '🐔', '🐴', '🐑', '🦆', '🦃', '🐐', '🐓', '🐇', '🐕', '🐈'],
    tableNames: ['Cow', 'Pig', 'Chicken', 'Horse', 'Sheep', 'Duck', 'Turkey', 'Goat', 'Rooster', 'Rabbit', 'Dog', 'Cat'],
    tableColors: [
      'bg-yellow-300 border-yellow-500', 'bg-green-300 border-green-500', 'bg-orange-300 border-orange-500',
      'bg-pink-300 border-pink-500', 'bg-blue-300 border-blue-500', 'bg-purple-300 border-purple-500',
      'bg-gray-300 border-gray-500', 'bg-red-300 border-red-500', 'bg-teal-300 border-teal-600',
      'bg-lime-300 border-lime-500', 'bg-amber-300 border-amber-500', 'bg-cyan-300 border-cyan-500'
    ],
  },
  dinosaurs: {
    bg: 'from-green-400 via-yellow-200 to-green-700',
    image: '/dinosaur.jpg',
    tableEmojis: ['🦕', '🦖', '🐊', '🐢', '🦎', '🐍', '🦦', '🦥', '🦨', '🦡', '🦔', '🦋'],
    tableNames: [
      'Brontosaurus', 'T-Rex', 'Crocodile', 'Turtle', 'Lizard', 'Snake', 'Otter', 'Sloth', 'Skunk', 'Badger', 'Hedgehog', 'Butterfly'
    ],
    tableColors: [
      'bg-green-500 border-green-700', 'bg-yellow-400 border-yellow-600', 'bg-orange-400 border-orange-600',
      'bg-pink-400 border-pink-600', 'bg-blue-400 border-blue-600', 'bg-purple-400 border-purple-600',
      'bg-gray-400 border-gray-600', 'bg-red-400 border-red-600', 'bg-teal-400 border-teal-600',
      'bg-lime-400 border-lime-600', 'bg-amber-400 border-amber-600', 'bg-cyan-400 border-cyan-600'
    ],
  },
  underwater: {
    bg: 'from-blue-200 via-cyan-200 to-blue-400',
    image: '/underwater.jpg',
    tableEmojis: ['🐠', '🐟', '🐬', '🐳', '🦈', '🦑', '🐙', '🦀', '🦐', '🦞', '🐡', '🐚'],
    tableNames: ['Fish', 'Goldfish', 'Dolphin', 'Whale', 'Shark', 'Squid', 'Octopus', 'Crab', 'Shrimp', 'Lobster', 'Puffer', 'Shell'],
    tableColors: [
      'bg-blue-300 border-blue-500', 'bg-cyan-300 border-cyan-500', 'bg-teal-300 border-teal-600',
      'bg-green-300 border-green-500', 'bg-yellow-300 border-yellow-500', 'bg-purple-300 border-purple-600',
      'bg-gray-300 border-gray-500', 'bg-red-300 border-red-500', 'bg-amber-300 border-amber-500',
      'bg-lime-300 border-lime-500', 'bg-fuchsia-300 border-fuchsia-500', 'bg-rose-300 border-rose-400'
    ],
  },
};

// Simple age → themes (safe fallback to all)
export const ageThemeMap = (age) => {
  return ['underwater', 'candyland', 'animals', 'farm', 'fairytales', 'dinosaurs'];
};

// This now just generates a placeholder description for the learning module.
export function getLearningModuleContent(belt, level) {
  const isBlack = String(belt).startsWith('black');
  
  if (isBlack) {
    const degree = String(belt).split('-')[1];
    return `Black Belt Degree ${degree}: You're reviewing facts up to Level ${level}!`;
  }
  
  return `${belt.charAt(0).toUpperCase() + belt.slice(1)} Belt Quiz at Level ${level}.`;
}

// Normalize difficulty keys (KEEP)
export function normalizeDifficulty(diff) {
  if (!diff) return null;
  const basic = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
  if (basic.includes(diff)) return diff;
  if (String(diff).startsWith('black')) return diff;
  return null;
}

// Keeping a utility just in case
export function shuffleUnique(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Removing: specFacts, getTwoFactsForBelt, buildFourNewQuestions, 
// buildSixPreviousQuestions, buildQuizForBelt, and internal question utils.