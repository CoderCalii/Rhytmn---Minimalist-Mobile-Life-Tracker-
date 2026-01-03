import { useState } from 'react';
import { Check, Flame } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import { INITIAL_HABITS } from '../../mockData';
import type { Habit, TimeScale } from '../../types';

interface HabitsViewProps {
  habits: Habit[];
}

const HabitsView = ({ habits = INITIAL_HABITS }: HabitsViewProps) => {
  const [scale, setScale] = useState<TimeScale>('Weekly');

  const renderScaleContent = () => {
    switch (scale) {
      case 'Daily':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 bg-gray-50 p-4 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Current Streak</span>
                <span className="text-xl font-bold">12 Days</span>
              </div>
              <Flame className="text-orange-400 fill-orange-400" size={20} />
            </div>
            {habits.map((habit, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${habit.data[0] ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  <div>
                    <h4 className="font-bold text-sm">{habit.name}</h4>
                    <p className="text-[10px] text-gray-400">{habit.meta}</p>
                  </div>
                </div>
                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${habit.data[0] ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}>
                  <Check size={20} />
                </button>
              </div>
            ))}
          </div>
        );

      case 'Weekly':
        return (
          <div className="space-y-8">
            <div className="flex justify-between px-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={index} className="text-[10px] font-bold text-gray-400 w-8 text-center">{day}</span>)}
            </div>
            {habits.map((habit, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-bold text-sm uppercase tracking-wider">{habit.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{habit.data.filter(Boolean).length}/7 days</span>
                </div>
                <div className="flex justify-between gap-1.5 h-10">
                  {habit.data.map((value, idx) => (
                    <div key={idx} className={`flex-1 rounded-lg transition-all duration-500 ${value ? habit.color : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Monthly':
        return (
          <div className="space-y-8">
            {habits.map((habit, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-bold text-sm uppercase tracking-wider">{habit.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{habit.monthly} days active</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const isActive = Math.random() > 0.3;
                    return (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-sm ${isActive ? habit.color : 'bg-gray-100'}`}
                        style={{ opacity: isActive ? (0.3 + (Math.random() * 0.7)) : 1 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Yearly':
        return (
          <div className="space-y-10">
            {habits.map((habit, index) => (
              <div key={index}>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{habit.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 12 }).map((_, monthIdx) => (
                    <div key={monthIdx} className="flex flex-col gap-1">
                      <div className="w-6 h-20 bg-gray-50 rounded-full relative overflow-hidden">
                        <div 
                          className={`absolute bottom-0 left-0 right-0 ${habit.color} transition-all duration-1000`} 
                          style={{ height: `${40 + Math.random() * 60}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold text-center">M{monthIdx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Annual Completion</span>
                  <span className="text-lg font-mono font-bold">{habit.yearly}/365</span>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-40">
      <AppHeader title="Rhythm" subtitle="Consistency > Intensity" />
      
      <div className="px-6 mb-8 mt-2 sticky top-24 bg-white/95 backdrop-blur-sm pb-4 z-10">
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100">
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as TimeScale[]).map((mode) => (
            <button 
              key={mode} 
              onClick={() => setScale(mode)} 
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${scale === mode ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {renderScaleContent()}
      </div>
    </div>
  );
};

export default HabitsView;
