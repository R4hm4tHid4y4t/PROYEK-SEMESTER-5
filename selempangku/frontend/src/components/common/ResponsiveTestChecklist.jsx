import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiMinus, FiMonitor, FiTablet, FiSmartphone, FiEye, FiEyeOff } from 'react-icons/fi';

const BREAKPOINTS = {
  mobile: { min: 0, max: 767, label: 'Mobile', icon: FiSmartphone, color: 'bg-red-500' },
  tablet: { min: 768, max: 1023, label: 'Tablet', icon: FiTablet, color: 'bg-yellow-500' },
  desktop: { min: 1024, max: Infinity, label: 'Desktop', icon: FiMonitor, color: 'bg-green-500' },
};

const TEST_FEATURES = [
  { id: 'header', name: 'Header/Navbar', tests: [
    { id: 'header-fixed-desktop', description: 'Fixed on desktop', breakpoints: ['desktop'] },
    { id: 'header-sticky-mobile', description: 'Sticky on mobile/tablet', breakpoints: ['mobile', 'tablet'] },
    { id: 'header-menu-collapse', description: 'Menu collapses on mobile', breakpoints: ['mobile', 'tablet'] },
  ]},
  { id: 'sidebar', name: 'Sidebar', tests: [
    { id: 'sidebar-fixed-desktop', description: 'Fixed on desktop', breakpoints: ['desktop'] },
    { id: 'sidebar-drawer-mobile', description: 'Drawer on mobile/tablet', breakpoints: ['mobile', 'tablet'] },
    { id: 'sidebar-overlay', description: 'Overlay when open on mobile', breakpoints: ['mobile', 'tablet'] },
  ]},
  { id: 'content', name: 'Main Content', tests: [
    { id: 'content-padding', description: 'Responsive padding', breakpoints: ['mobile', 'tablet', 'desktop'] },
    { id: 'content-margin-sidebar', description: 'Margin for sidebar on desktop', breakpoints: ['desktop'] },
  ]},
  { id: 'navigation', name: 'Navigation', tests: [
    { id: 'breadcrumbs-hidden-mobile', description: 'Breadcrumbs hidden on mobile', breakpoints: ['mobile'] },
    { id: 'breadcrumbs-visible-desktop', description: 'Breadcrumbs visible on tablet/desktop', breakpoints: ['tablet', 'desktop'] },
    { id: 'back-button-mobile', description: 'Back button on mobile only', breakpoints: ['mobile'] },
  ]},
  { id: 'typography', name: 'Typography', tests: [
    { id: 'font-scaling', description: 'Font sizes scale properly', breakpoints: ['mobile', 'tablet', 'desktop'] },
    { id: 'line-height', description: 'Readable line heights', breakpoints: ['mobile', 'tablet', 'desktop'] },
  ]},
  { id: 'grid', name: 'Grid/Layout', tests: [
    { id: 'grid-cols-mobile', description: '1-2 columns on mobile', breakpoints: ['mobile'] },
    { id: 'grid-cols-tablet', description: '2-3 columns on tablet', breakpoints: ['tablet'] },
    { id: 'grid-cols-desktop', description: '3-4+ columns on desktop', breakpoints: ['desktop'] },
  ]},
  { id: 'touch', name: 'Touch/Interaction', tests: [
    { id: 'touch-targets', description: 'Touch targets >= 44px', breakpoints: ['mobile', 'tablet'] },
    { id: 'hover-states', description: 'Hover states on desktop', breakpoints: ['desktop'] },
  ]},
];

const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

const useBreakpoint = (width) => {
  if (width >= BREAKPOINTS.desktop.min) return 'desktop';
  if (width >= BREAKPOINTS.tablet.min) return 'tablet';
  return 'mobile';
};

const ResponsiveTestChecklist = ({ defaultVisible = false }) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [checkedItems, setCheckedItems] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const viewport = useViewport();
  const currentBreakpoint = useBreakpoint(viewport.width);

  const toggleCheck = (testId) => {
    setCheckedItems(prev => {
      const current = prev[testId] || 'unchecked';
      const next = current === 'unchecked' ? 'pass' : current === 'pass' ? 'fail' : 'unchecked';
      return { ...prev, [testId]: next };
    });
  };

  const getCheckIcon = (testId) => {
    const status = checkedItems[testId] || 'unchecked';
    if (status === 'pass') return <FiCheck className="text-green-500" />;
    if (status === 'fail') return <FiX className="text-red-500" />;
    return <FiMinus className="text-gray-400" />;
  };

  const getProgress = () => {
    const total = TEST_FEATURES.reduce((acc, cat) => acc + cat.tests.length, 0);
    const checked = Object.values(checkedItems).filter(v => v !== 'unchecked').length;
    const passed = Object.values(checkedItems).filter(v => v === 'pass').length;
    return { total, checked, passed };
  };

  const progress = getProgress();
  const BreakpointIcon = BREAKPOINTS[currentBreakpoint].icon;

  if (process.env.NODE_ENV !== 'development') return null;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        title="Show Responsive Test Checklist"
      >
        <FiEye className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Responsive Test Checklist</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <FiMinus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Hide"
            >
              <FiEyeOff className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <BreakpointIcon className="h-4 w-4" />
            <span className={`px-2 py-0.5 rounded text-white text-xs font-medium ${BREAKPOINTS[currentBreakpoint].color}`}>
              {BREAKPOINTS[currentBreakpoint].label}
            </span>
          </div>
          <div className="font-mono">
            {viewport.width} x {viewport.height}
          </div>
        </div>

        {/* Breakpoint Indicator */}
        <div className="flex gap-1 mt-2">
          {Object.entries(BREAKPOINTS).map(([key, bp]) => (
            <div
              key={key}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                currentBreakpoint === key ? bp.color : 'bg-gray-600'
              }`}
              title={`${bp.label}: ${bp.min}px - ${bp.max === Infinity ? '∞' : bp.max + 'px'}`}
            />
          ))}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Progress */}
          <div className="px-3 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress: {progress.checked}/{progress.total}</span>
              <span className="text-green-600">{progress.passed} passed</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(progress.passed / progress.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Test List */}
          <div className="overflow-y-auto max-h-[50vh] p-2">
            {TEST_FEATURES.map((category) => (
              <div key={category.id} className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1 px-1">
                  {category.name}
                </h4>
                <div className="space-y-1">
                  {category.tests.map((test) => {
                    const isRelevant = test.breakpoints.includes(currentBreakpoint);
                    return (
                      <button
                        key={test.id}
                        onClick={() => toggleCheck(test.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                          isRelevant
                            ? 'bg-primary-50 hover:bg-primary-100 border border-primary-200'
                            : 'bg-gray-50 hover:bg-gray-100 opacity-50'
                        }`}
                      >
                        <span className="flex-shrink-0">{getCheckIcon(test.id)}</span>
                        <span className={`flex-1 ${isRelevant ? 'text-gray-900' : 'text-gray-500'}`}>
                          {test.description}
                        </span>
                        <div className="flex gap-0.5">
                          {test.breakpoints.map((bp) => (
                            <span
                              key={bp}
                              className={`w-1.5 h-1.5 rounded-full ${
                                bp === currentBreakpoint ? BREAKPOINTS[bp].color : 'bg-gray-300'
                              }`}
                              title={BREAKPOINTS[bp].label}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t bg-gray-50 flex gap-2">
            <button
              onClick={() => setCheckedItems({})}
              className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={() => {
                const allTests = {};
                TEST_FEATURES.forEach(cat => {
                  cat.tests.forEach(test => {
                    allTests[test.id] = 'pass';
                  });
                });
                setCheckedItems(allTests);
              }}
              className="flex-1 px-2 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Mark All Pass
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ResponsiveTestChecklist;
