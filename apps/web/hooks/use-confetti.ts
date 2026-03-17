'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const [isConfettiReady, setIsConfettiReady] = useState(false);

  useEffect(() => {
    setIsConfettiReady(true);
  }, []);

  const fireConfetti = () => {
    if (!isConfettiReady) return;

    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'],
    });

    // Second burst after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        origin: { x: 0 },
        colors: ['#8B5CF6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'],
      });
    }, 250);

    // Third burst from the right
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        origin: { x: 1 },
        colors: ['#8B5CF6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'],
      });
    }, 400);
  };

  return { fireConfetti };
}
