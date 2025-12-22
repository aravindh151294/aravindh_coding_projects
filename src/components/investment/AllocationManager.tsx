'use client';

import React from 'react';

/**
 * AllocationManager - Legacy component
 * Note: This component is deprecated. Allocation management is now handled
 * directly in fd/page.tsx with separate Lumpsum/SIP tabs.
 */
export function AllocationManager() {
    return (
        <div className="p-4 text-gray-500 text-center">
            <p>Allocation management has been moved to the Investment page tabs.</p>
        </div>
    );
}
