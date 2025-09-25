/**
 * ReUI Bundle Optimization
 *
 * This module provides utilities for optimizing the ReUI component bundle
 * through tree-shaking, lazy loading, and conditional imports.
 */

// Dynamic import utilities for code splitting
export const lazyLoadComponent = {
  // Heavy components that should be lazy loaded
  Dialog: () => import('@/components/ui/dialog-reui'),
  AlertDialog: () => import('@/components/ui/alert-dialog-reui'),
  Select: () => import('@/components/ui/select-reui'),
  Table: () => import('@/components/ui/table-reui'),

  // Lighter components can be bundled
  Button: () => import('@/components/ui/button-reui'),
  Input: () => import('@/components/ui/input-reui'),
  Card: () => import('@/components/ui/card-reui'),
};

// Component usage tracker for dead code elimination
export const componentUsage = {
  // Track which components are actually used
  Button: true,
  Input: true,
  Card: true,
  Dialog: true,
  Table: true,
  Select: true,
  Checkbox: true,
  Alert: true,
  Badge: true,
  Progress: true,

  // Components that can be removed in production
  // Set to false for unused components
  Breadcrumb: false, // Only used in admin
  Sonner: false,     // Only for notifications
};

// Optimization configuration
export const optimizationConfig = {
  // Enable tree shaking for production
  enableTreeShaking: process.env.NODE_ENV === 'production',

  // Lazy load threshold (components larger than this size)
  lazyLoadThreshold: 10 * 1024, // 10KB

  // Preload critical components
  preloadCritical: ['Button', 'Input', 'Card'],

  // Bundle splitting strategy
  splitChunks: {
    // Core components (always loaded)
    core: ['Button', 'Input', 'Card'],

    // Form components (loaded on form pages)
    forms: ['Select', 'Checkbox', 'Textarea'],

    // Data components (loaded on data pages)
    data: ['Table', 'Badge', 'Progress'],

    // Overlay components (loaded on demand)
    overlays: ['Dialog', 'AlertDialog', 'Alert'],
  },
};

// Webpack configuration helper
export const getWebpackOptimization = () => ({
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // ReUI core components
      'reui-core': {
        test: /[\\/]components[\\/]ui[\\/](button|input|card)-reui/,
        name: 'reui-core',
        priority: 30,
        reuseExistingChunk: true,
      },

      // ReUI form components
      'reui-forms': {
        test: /[\\/]components[\\/]ui[\\/](select|checkbox|textarea)-reui/,
        name: 'reui-forms',
        priority: 25,
        reuseExistingChunk: true,
      },

      // ReUI data components
      'reui-data': {
        test: /[\\/]components[\\/]ui[\\/](table|badge|progress)-reui/,
        name: 'reui-data',
        priority: 25,
        reuseExistingChunk: true,
      },

      // ReUI overlay components
      'reui-overlays': {
        test: /[\\/]components[\\/]ui[\\/](dialog|alert)-reui/,
        name: 'reui-overlays',
        priority: 20,
        reuseExistingChunk: true,
      },

      // Radix UI primitives
      radix: {
        test: /[\\/]node_modules[\\/]@radix-ui/,
        name: 'radix-ui',
        priority: 10,
        reuseExistingChunk: true,
      },
    },
  },

  // Minimize in production
  minimize: process.env.NODE_ENV === 'production',

  // Use swc minifier for better performance
  minimizer: ['...', 'swc'],

  // Module concatenation for smaller bundles
  concatenateModules: true,

  // Tree shaking
  sideEffects: false,
  usedExports: true,
});

// CSS optimization
export const getCSSOptimization = () => ({
  // Remove unused CSS
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/components/ui/**/*.tsx',
      './src/components/ui-adapters/**/*.tsx',
    ],
    safelist: [
      // Keep dynamic classes
      /^bg-/,
      /^text-/,
      /^border-/,
      /^hover:/,
      /^focus:/,
      /^dark:/,
    ],
  },

  // Optimize for size
  optimization: {
    // Remove unused keyframes
    removeUnusedKeyframes: true,

    // Merge duplicate rules
    mergeDuplicateRules: true,

    // Remove empty rules
    removeEmptyRules: true,

    // Minify colors
    minifyColors: true,

    // Minify font values
    minifyFontValues: true,
  },
});

// Import map for optimized loading
export const importMap = {
  // Use barrel exports for tree shaking
  '@/components/ui': {
    Button: './Button',
    Input: './Input',
    Card: './Card',
    // Add more as needed
  },

  // Direct imports for heavy components
  '@/components/ui/Table': './table-reui',
  '@/components/ui/Dialog': './dialog-reui',
  '@/components/ui/Select': './select-reui',
};

// Preload critical components
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload core components
    const coreComponents = [
      '/reui-core.js',
      '/reui-core.css',
    ];

    coreComponents.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = src.endsWith('.css') ? 'style' : 'script';
      link.href = src;
      document.head.appendChild(link);
    });
  }
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.ANALYZE === 'true') {
    return {
      enabled: true,
      openAnalyzer: true,
      analyzerMode: 'static',
      reportFilename: 'bundle-analysis.html',
      defaultSizes: 'parsed',
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    };
  }
  return { enabled: false };
};

// Export optimization utils
export default {
  lazyLoadComponent,
  componentUsage,
  optimizationConfig,
  getWebpackOptimization,
  getCSSOptimization,
  importMap,
  preloadCriticalComponents,
  analyzeBundleSize,
};