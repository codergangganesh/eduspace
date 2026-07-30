import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Trophy, HelpCircle } from 'lucide-react';
import { Drawer } from 'vaul';
import { useIsMobile } from '../../hooks/use-mobile';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { MATH_THEMES, MathTheme } from '../../lib/mathGameTheme';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../ui/sheet';

import { GraphicsQuality, WeatherPreset } from './AnimatedBackgroundEnvironment';

interface MathPlaygroundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeThemeId: MathTheme['id'];
  onChangeTheme: (themeId: MathTheme['id']) => void;
  onResetHighScores: () => void;
  onResetTutorial: () => void;
  quality?: GraphicsQuality;
  onChangeQuality?: (quality: GraphicsQuality) => void;
  weatherPreset?: WeatherPreset;
  onChangeWeatherPreset?: (preset: WeatherPreset) => void;
}

export function MathPlaygroundSettings({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  activeThemeId,
  onChangeTheme,
  onResetHighScores,
  onResetTutorial,
  quality = 'high',
  onChangeQuality,
  weatherPreset = 'auto',
  onChangeWeatherPreset,
}: MathPlaygroundSettingsProps) {
  const isMobile = useIsMobile();

  const renderSettingsList = () => (
    <div className="space-y-6">

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
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left bg-white dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${isMuted ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'
              }`}>
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </div>
            <div>
              <span className="font-extrabold text-sm block text-slate-800 dark:text-white">Synthesizer SFX</span>
              <span className="text-xs text-slate-400 font-semibold">Procedural arcade game sounds</span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isMuted ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600'
            }`}>
            <div className={`bg-white size-4 rounded-full shadow-md transition-transform ${isMuted ? 'translate-x-0' : 'translate-x-6'
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
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all bg-white dark:bg-slate-900 ${isSelected
                  ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/15'
                  : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
              >
                <span className={`text-xs font-black ${themeId === 'cyber' ? 'text-indigo-500' :
                  themeId === 'retro' ? 'text-emerald-500' :
                    themeId === 'sunset' ? 'text-orange-500' :
                      'text-sky-500'
                  }`}>{t.name}</span>

                <div className="flex gap-1.5 items-center">
                  <div className={`size-3 rounded-full ${themeId === 'cyber' ? 'bg-indigo-500' :
                    themeId === 'retro' ? 'bg-emerald-500' :
                      themeId === 'sunset' ? 'bg-orange-500' :
                        'bg-sky-500'
                    }`} />
                  <div className={`size-3 rounded-full ${themeId === 'cyber' ? 'bg-pink-500' :
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

      {/* Graphics Quality */}
      {onChangeQuality && (
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Background Graphics (60 FPS)</span>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {(['low', 'medium', 'high', 'ultra'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => onChangeQuality(q)}
                className={`py-2 rounded-xl text-xs font-black capitalize transition-all ${quality === q
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weather Preset */}
      {onChangeWeatherPreset && (
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Atmosphere & Weather</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'auto', label: 'Dynamic' },
                { id: 'sunny', label: 'Sunny Sky' },
                { id: 'sunset', label: 'Sunset' },
                { id: 'rain', label: 'Rainstorm' },
                { id: 'snow', label: 'Snowfall' },
                { id: 'cyberstorm', label: 'Cyber Storm' },
              ] as { id: WeatherPreset; label: string }[]
            ).map((w) => (
              <button
                key={w.id}
                onClick={() => onChangeWeatherPreset(w.id)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all text-center ${weatherPreset === w.id
                  ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Actions */}

    </div>
  );

  const renderFooter = () => (
    <Button
      onClick={onClose}
      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-2xl py-6 font-bold border-none"
    >
      Save & Apply
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(val) => { if (!val) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] flex flex-col bg-white dark:bg-slate-900 rounded-t-[32px] outline-none max-h-[85vh] border-t border-slate-200/60 dark:border-slate-800/60 transition-transform duration-300">
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 cursor-grab rounded-full bg-slate-200 dark:bg-slate-800 mt-4 mb-2" />
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {renderSettingsList()}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              {renderFooter()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(val) => { if (!val) onClose(); }}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 border-none bg-background shadow-2xl transition-all duration-500 ease-in-out h-full w-full sm:max-w-md pt-[var(--safe-top)] z-[10001] [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Playground Settings</SheetTitle>
        <SheetDescription className="sr-only">
          Adjust sound, theme, and highscores
        </SheetDescription>
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {renderSettingsList()}
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {renderFooter()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
