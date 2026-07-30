import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800);
    const timer2 = setTimeout(() => setStage(2), 2000);
    const timer3 = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0a0a]"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
            animate={{ 
              scale: stage > 0 ? 1 : 0.8, 
              opacity: stage > 0 ? 1 : 0,
              rotate: stage > 0 ? 0 : -15
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 mb-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ 
              y: stage > 0 ? 0 : 20, 
              opacity: stage > 0 ? 1 : 0 
            }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              RYN Hub
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: stage > 1 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="text-zinc-500 dark:text-zinc-400 font-medium"
            >
              Your personal life operating system
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
