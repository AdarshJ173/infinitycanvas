import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-10"
          >
            <Card className="p-6 max-w-md mx-4 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
              {/* Icon */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`
                  p-3 rounded-full
                  ${variant === 'danger' ? 'bg-destructive/10' : ''}
                  ${variant === 'warning' ? 'bg-orange-500/10' : ''}
                  ${variant === 'info' ? 'bg-primary/10' : ''}
                `}>
                  <AlertTriangle className={`
                    w-6 h-6
                    ${variant === 'danger' ? 'text-destructive' : ''}
                    ${variant === 'warning' ? 'text-orange-500' : ''}
                    ${variant === 'info' ? 'text-primary' : ''}
                  `} />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">
                    {title}
                  </h2>
                </div>
              </div>

              {/* Message */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="min-w-[100px]"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  className={`
                    min-w-[100px]
                    ${variant === 'danger' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                    ${variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                    ${variant === 'info' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                  `}
                >
                  {confirmText}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
