import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Trophy, HelpCircle } from 'lucide-react';
import { Drawer } from 'vaul';
import { useIsMobile } from '../../hooks/use-mobile';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MATH_THEMES, MathTheme } from '../../lib/mathGameTheme';

interface MathPlaygroundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeThemeId: MathTheme['id'];
  onChangeTheme: (themeId: MathTheme['id']) => void;
  onResetHighScores: () => void;
  onResetTutorial: () => void;
}

export function MathPlaygroundSettings({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  activeThemeId,
  onChangeTheme,
  onResetHighScores,
  onResetTutorial
}: MathPlaygroundSettingsProps) {
  const isMobile = useIsMobile();

  const renderContent = () => (
    <CardContent className="p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Playground Settings</span>
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="rounded-xl size-8 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Sound Setting */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Sound & Audio</span>
        <button 
          onClick={onToggleMute}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 transition-all text-left bg-white dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              isMuted ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'
            }`}>
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </div>
            <div>
              <span className="font-extrabold text-sm block text-slate-800 dark:text-white">Synthesizer SFX</span>
              <span className="text-xs text-slate-400 font-semibold">Procedural arcade game sounds</span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
            isMuted ? 'bg-slate-205 dark:bg-slate-800' : 'bg-indigo-600'
          }`}>
            <div className={`bg-white size-4 rounded-full shadow-md transition-transform ${
              isMuted ? 'translate-x-0' : 'translate-x-6'
            }`} />
          </div>
        </button>
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Board Theme</span>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(MATH_THEMES) as MathTheme['id'][]).map((themeId) => {
            const t = MATH_THEMES[themeId];
            const isSelected = activeThemeId === themeId;
            return (
              <button
                key={themeId}
                onClick={() => onChangeTheme(themeId)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all bg-white dark:bg-slate-900 ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/15'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className={`text-xs font-black ${
                  themeId === 'cyber' ? 'text-indigo-500' :
                  themeId === 'retro' ? 'text-emerald-500' :
                  themeId === 'sunset' ? 'text-orange-500' :
                  'text-sky-500'
                }`}>{t.name}</span>
                
                <div className="flex gap-1.5 items-center">
                  <div className={`size-3 rounded-full ${
                    themeId === 'cyber' ? 'bg-indigo-500' :
                    themeId === 'retro' ? 'bg-emerald-500' :
                    themeId === 'sunset' ? 'bg-orange-500' :
                    'bg-sky-500'
                  }`} />
                  <div className={`size-3 rounded-full ${
                    themeId === 'cyber' ? 'bg-pink-500' :
                    themeId === 'retro' ? 'bg-black border border-emerald-500' :
                    themeId === 'sunset' ? 'bg-rose-500' :
                    'bg-indigo-500'
                  }`} />
                  {isSelected && (
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wide ml-auto">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Actions */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Actions</span>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={onResetTutorial}
            className="rounded-2xl py-5 border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900"
          >
            <HelpCircle className="size-4 mr-1.5 text-slate-400" />
            Show Tutorial
          </Button>
          <Button 
            variant="outline" 
            onClick={onResetHighScores}
            className="rounded-2xl py-5 border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 bg-white dark:bg-slate-900"
          >
            <Trophy className="size-4 mr-1.5 text-rose-500" />
            Reset Scores
          </Button>
        </div>
      </div>

      {/* Footer close button */}
      <Button 
        onClick={onClose} 
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-2xl py-6 font-bold border-none"
      >
        Save & Apply
      </Button>
    </CardContent>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(val) => { if (!val) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] flex flex-col bg-white dark:bg-slate-900 rounded-t-[32px] outline-none max-h-[85vh] border-t border-slate-200/60 dark:border-slate-800/60 transition-transform duration-300">
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 cursor-grab rounded-full bg-slate-200 dark:bg-slate-800 mt-4 mb-2" />
            <div className="flex-1 overflow-y-auto pb-8">
              {renderContent()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-w-md w-full"
          >
            <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900/95">
              {renderContent()}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
