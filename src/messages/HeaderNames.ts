/**
 * Header Names - Maps packet IDs to their names for logging
 */

import { Incoming, Outgoing } from './Headers';

// Create reverse mappings for logging
const incomingNames: Map<number, string> = new Map();
const outgoingNames: Map<number, string> = new Map();

// Build incoming names map
for (const [name, id] of Object.entries(Incoming)) {
    incomingNames.set(id as number, name);
}

// Build outgoing names map
for (const [name, id] of Object.entries(Outgoing)) {
    outgoingNames.set(id as number, name);
}

/**
 * Get the name of an incoming packet by its header ID
 */
export function getIncomingPacketName(header: number): string {
    return incomingNames.get(header) || `Unknown(${header})`;
}

/**
 * Get the name of an outgoing packet by its header ID
 */
export function getOutgoingPacketName(header: number): string {
    return outgoingNames.get(header) || `Unknown(${header})`;
}

/**
 * Get packet name based on direction
 */
export function getPacketName(header: number, direction: 'IN' | 'OUT'): string {
    if (direction === 'IN') {
        return getIncomingPacketName(header);
    }
    return getOutgoingPacketName(header);
}
