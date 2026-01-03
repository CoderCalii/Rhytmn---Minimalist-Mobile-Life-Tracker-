import type { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

const AppHeader = ({ title, subtitle, rightAction }: AppHeaderProps) => (
  <div className="px-6 pt-12 pb-4 flex justify-between items-end bg-white/95 backdrop-blur-sm sticky top-0 z-10">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
      {subtitle && <p className="text-gray-400 text-sm mt-1 font-medium tracking-wide">{subtitle}</p>}
    </div>
    {rightAction && <div>{rightAction}</div>}
  </div>
);

export default AppHeader;
