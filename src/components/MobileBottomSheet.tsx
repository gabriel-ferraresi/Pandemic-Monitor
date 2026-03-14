import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "../utils";
import { GripHorizontal } from "lucide-react";

type SheetState = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  peekContent?: React.ReactNode;
  /** Forçar o sheet para o estado peek (ex: quando um evento é selecionado) */
  forcePeek?: boolean;
  onStateChange?: (state: SheetState) => void;
}

const SHEET_HEIGHTS: Record<SheetState, string> = {
  peek: '72px',
  half: '50vh',
  full: '85vh',
};

const STATE_ORDER: SheetState[] = ['peek', 'half', 'full'];

export function MobileBottomSheet({ children, peekContent, forcePeek, onStateChange }: MobileBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Ouvir forcePeek do parent
  useEffect(() => {
    if (forcePeek) {
      setSheetState('peek');
      onStateChange?.('peek');
    }
  }, [forcePeek, onStateChange]);

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = clientY - startYRef.current;
    setDragOffset(delta);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    const threshold = 60;

    if (dragOffset < -threshold) {
      // Arrastar para cima → expandir
      const currentIdx = STATE_ORDER.indexOf(sheetState);
      const nextState = STATE_ORDER[Math.min(currentIdx + 1, STATE_ORDER.length - 1)];
      setSheetState(nextState);
      onStateChange?.(nextState);
    } else if (dragOffset > threshold) {
      // Arrastar para baixo → recolher
      const currentIdx = STATE_ORDER.indexOf(sheetState);
      const nextState = STATE_ORDER[Math.max(currentIdx - 1, 0)];
      setSheetState(nextState);
      onStateChange?.(nextState);
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, sheetState, onStateChange]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Tap no drag handle → ciclar estados
  const handleTapToggle = useCallback(() => {
    const currentIdx = STATE_ORDER.indexOf(sheetState);
    const nextState = STATE_ORDER[(currentIdx + 1) % STATE_ORDER.length];
    setSheetState(nextState);
    onStateChange?.(nextState);
  }, [sheetState, onStateChange]);

  const dynamicHeight = SHEET_HEIGHTS[sheetState];

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed left-0 right-0 z-40 bg-white/90 dark:bg-black/85 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.6)] overflow-x-hidden overflow-y-hidden",
        !isDragging && "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      )}
      style={{
        bottom: '56px', // Acima da bottom nav
        height: isDragging ? `calc(${dynamicHeight} - ${dragOffset}px)` : dynamicHeight,
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleTapToggle}
      >
        <GripHorizontal className="w-8 h-1.5 text-slate-300 dark:text-zinc-600" />
      </div>

      {/* Peek content — sempre visível */}
      {sheetState === 'peek' && peekContent && (
        <div className="px-4 pb-2">
          {peekContent}
        </div>
      )}

      {/* Full content — quando expandido */}
      {sheetState !== 'peek' && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-1 max-w-full" style={{ height: 'calc(100% - 32px)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
