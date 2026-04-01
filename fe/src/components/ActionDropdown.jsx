import { useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useRole, useInteractions, FloatingPortal } from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '@mui/material';
import { MoreVertical } from 'lucide-react';

export default function ActionDropdown({ options = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift({ padding: 8 })
    ]
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click, dismiss, role
  ]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-flex items-center justify-center">
        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <MoreVertical size={20} />
        </IconButton>
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[9999] bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[160px] p-1.5 flex flex-col gap-1"
            >
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
              {options.map((opt, idx) => (
                <button 
                  key={idx}
                  onClick={() => { opt.onClick(); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm font-medium rounded-xl transition-colors
                    ${opt.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-200 hover:bg-white/10 hover:text-white'}
                  `}
                >
                   {opt.icon && <span className="inline-flex">{opt.icon}</span>}
                   {opt.label}
                </button>
              ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
