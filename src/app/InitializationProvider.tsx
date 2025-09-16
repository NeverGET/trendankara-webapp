'use client';

import { useEffect, useState } from 'react';
import { initializeForDevelopment, ApplicationInitResult } from '@/lib/init';

/**
 * Initialization Provider
 * Handles database and storage initialization on app startup
 * Only runs in development mode to avoid blocking production startup
 */

interface InitializationState {
  result: ApplicationInitResult | null;
  isLoading: boolean;
}

interface InitializationProviderProps {
  children: React.ReactNode;
}

export function InitializationProvider({ children }: InitializationProviderProps) {
  const [state, setState] = useState<InitializationState>({
    result: null,
    isLoading: true,
  });

  useEffect(() => {
    // Only run initialization in development mode
    if (process.env.NODE_ENV !== 'development') {
      setState({ result: null, isLoading: false });
      return;
    }

    const initializeServices = async () => {
      try {
        console.log('🚀 Starting application initialization...');

        // Use centralized initialization for development
        const result = await initializeForDevelopment();

        setState({
          result,
          isLoading: false
        });

        // Log final status
        const dbStatus = result.database.initialized ? '✅' : '❌';
        const storageStatus = result.storage.initialized ? '✅' : '❌';
        console.log(`🎯 Initialization complete - Database: ${dbStatus} Storage: ${storageStatus}`);

        if (result.success) {
          console.log('✅ All services initialized successfully');
        } else {
          console.error('❌ Some services failed to initialize:', result.errors);
        }

      } catch (error) {
        console.error('💥 Application initialization failed:', error);
        setState({
          result: {
            success: false,
            database: { initialized: false, error: error instanceof Error ? error.message : 'Unknown error' },
            storage: { initialized: false, error: error instanceof Error ? error.message : 'Unknown error' },
            message: 'Initialization failed',
            errors: [error instanceof Error ? error.message : 'Unknown error']
          },
          isLoading: false
        });
      }
    };

    // Run initialization
    initializeServices();
  }, []);

  // In development, show initialization status
  if (process.env.NODE_ENV === 'development' && state.isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 9999
      }}>
        <div style={{ marginBottom: '20px', fontSize: '24px' }}>
          🚀 Initializing Application...
        </div>
        <div style={{ marginBottom: '10px' }}>
          📊 Database: ⏳ Initializing...
        </div>
        <div style={{ marginBottom: '20px' }}>
          💾 Storage: ⏳ Initializing...
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          This screen only appears in development mode
        </div>
      </div>
    );
  }

  // In development, show any initialization errors
  if (process.env.NODE_ENV === 'development' && !state.isLoading && state.result) {
    const hasErrors = !state.result.success || state.result.errors.length > 0;

    if (hasErrors) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 9998
        }}>
          <strong>⚠️ Initialization Warnings:</strong>
          {state.result.database.error && (
            <div>Database: {state.result.database.error}</div>
          )}
          {state.result.storage.error && (
            <div>Storage: {state.result.storage.error}</div>
          )}
          {state.result.errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      );
    }
  }

  return <>{children}</>;
}