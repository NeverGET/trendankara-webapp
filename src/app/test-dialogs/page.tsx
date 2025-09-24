'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button-reui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog-reui';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog-reui';
import Modal from '@/components/ui-adapters/ModalAdapter';
import ConfirmDialog from '@/components/ui-adapters/ConfirmDialogAdapter';

export default function TestDialogsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground">ReUI Dialog Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Content Behind Dialogs */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Background Content</h2>
            <p className="text-muted-foreground mb-4">
              This content should blur when a dialog is open. The blur effect creates a professional backdrop.
            </p>
            <div className="space-y-2">
              <div className="h-4 bg-primary/20 rounded"></div>
              <div className="h-4 bg-primary/30 rounded"></div>
              <div className="h-4 bg-primary/20 rounded"></div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Dialogs</h2>
            <div className="space-y-3">
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                Open Dialog (ReUI)
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Open Alert Dialog
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The background should be blurred.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={() => setModalOpen(true)} variant="secondary" className="w-full">
                Open Modal (Adapter)
              </Button>

              <Button onClick={() => setConfirmOpen(true)} variant="destructive" className="w-full">
                Open Confirm Dialog
              </Button>
            </div>
          </div>
        </div>

        {/* More background content */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-border flex items-center justify-center">
              <span className="text-2xl font-bold text-primary/50">Card {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Test Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ReUI Dialog with Blur</DialogTitle>
            <DialogDescription>
              The background should be blurred with a smooth animation. This creates a professional overlay effect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p>Dialog content with ReUI styling</p>
            </div>
            {/* Test scrolling with more content - dialog taller than viewport */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
              <div key={i} className="p-3 bg-card border border-border rounded">
                <h4 className="font-medium mb-2">Section {i}</h4>
                <p className="text-sm text-muted-foreground">
                  This is test content to demonstrate scrolling behavior. The entire dialog should scroll, not just the content area.
                </p>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal with Blur Effect"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            This modal uses the adapter pattern and should also have a blurred background with proper width constraints.
          </p>
          {/* Test scrolling - modal taller than viewport */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="p-3 bg-card border border-border rounded">
              <h4 className="font-medium">Modal Section {i}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Testing modal scrolling. The entire modal should scroll as one unit.
              </p>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          console.log('Confirmed');
          setConfirmOpen(false);
        }}
        title="Confirm Action"
        message="This confirmation dialog should have a blurred background matching the ReUI design system."
        variant="destructive"
      />
    </div>
  );
}