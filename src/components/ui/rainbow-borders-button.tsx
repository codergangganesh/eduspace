import React from 'react';

export function RainbowButton({ 
  onClick, 
  children = "Button", 
  className = "" 
}: { 
  onClick?: () => void; 
  children?: React.ReactNode; 
  className?: string 
}) {
  return (
    <>
      <button 
        onClick={onClick}
        className={`rainbow-border relative w-[180px] h-12 flex items-center justify-center gap-2.5 px-6 bg-black rounded-xl border-none text-white cursor-pointer font-black transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      >
        {children}
      </button>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .rainbow-border::before,
        .rainbow-border::after {
          content: '';
          position: absolute;
          left: -2px;
          top: -2px;
          border-radius: 12px;
          background: linear-gradient(45deg, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000);
          background-size: 400%;
          width: calc(100% + 4px);
          height: calc(100% + 4px);
          z-index: -1;
          animation: rainbow 20s linear infinite;
        }
        .rainbow-border::after {
          filter: blur(25px);
        }
        @keyframes rainbow {
          0% { background-position: 0 0; }
          50% { background-position: 400% 0; }
          100% { background-position: 0 0; }
        }
      `}} />
    </>
  );
}
