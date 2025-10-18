import React from 'react';

type ActivePane = 'stereonet' | 'map';

interface DesktopSplitPaneProps {
  stereonetPane: React.ReactNode;
  mapPane: React.ReactNode;
  activePane: ActivePane;
}

/**
 * DesktopSplitPane shows stereonet and map panes side-by-side from the lg breakpoint.
 */
const DesktopSplitPane: React.FC<DesktopSplitPaneProps> = ({ stereonetPane, mapPane, activePane }) => {
  return (
    <div className="flex h-full flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(20rem,28rem),minmax(0,1fr)] lg:gap-4 xl:grid-cols-[minmax(22rem,32rem),minmax(0,1fr)]">
      <section
        id="mobile-tab-panel-stereonet"
        role="tabpanel"
        aria-labelledby="mobile-tab-stereonet"
        className={`flex-1 overflow-y-auto ${activePane === 'stereonet' ? 'block' : 'hidden'} lg:block`}
      >
        {stereonetPane}
      </section>
      <section
        id="mobile-tab-panel-map"
        role="tabpanel"
        aria-labelledby="mobile-tab-map"
        className={`flex-1 overflow-y-auto ${activePane === 'map' ? 'block' : 'hidden'} lg:block`}
      >
        {mapPane}
      </section>
    </div>
  );
};

export default DesktopSplitPane;
