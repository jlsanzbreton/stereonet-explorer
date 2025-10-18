import React from 'react';

export interface MobileTab {
  id: string;
  label: string;
}

interface MobileTabsProps {
  tabs: MobileTab[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

const MobileTabs: React.FC<MobileTabsProps> = ({ tabs, activeTab, onChange, ariaLabel }) => {
  return (
    <div className="lg:hidden border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-md items-center justify-between px-4">
        <div role="tablist" aria-label={ariaLabel ?? 'Primary views'} className="flex flex-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`mobile-tab-panel-${tab.id}`}
                id={`mobile-tab-${tab.id}`}
                type="button"
                onClick={() => onChange(tab.id)}
                tabIndex={isActive ? 0 : -1}
                className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabs;
