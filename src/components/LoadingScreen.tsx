import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-blue-600 text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="mb-4"
      >
        <Shield size={64} />
      </motion.div>
      <h1 className="text-2xl font-bold tracking-tight">Family Safety Tracker</h1>
      <p className="mt-2 text-blue-100 animate-pulse">Initializing secure connection...</p>
    </div>
  );
}
