/**
 * Pathfinder - A* pathfinding algorithm for room navigation
 * Based on Arcturus PathfinderImpl.java
 */

import { RoomLayout, RoomTile, RoomTileState } from './RoomLayout';
import type { Room } from './Room';
import { Logger } from '../../utils/Logger';

const logger = new Logger('Pathfinder');

interface PathNode {
    tile: RoomTile;
    g: number;  // Cost from start
    h: number;  // Heuristic (estimated cost to goal)
    f: number;  // Total cost (g + h)
    parent: PathNode | null;
}

export class Pathfinder {
    private static readonly STRAIGHT_COST = 10;
    private static readonly DIAGONAL_COST = 14;
    public static readonly MAX_STEP_HEIGHT = 1.1;

    /**
     * Find path from start to goal using A* algorithm
     * @param room - Room instance for furniture checks
     * @param startX - Start X position
     * @param startY - Start Y position
     * @param goalX - Goal X position
     * @param goalY - Goal Y position
     * @param allowDiagonal - Allow diagonal movement
     */
    public static findPath(
        room: Room,
        startX: number,
        startY: number,
        goalX: number,
        goalY: number,
        allowDiagonal: boolean = true
    ): RoomTile[] {
        const layout = room.getLayout();
        if (!layout) return [];
        const startTile = layout.getTile(startX, startY);
        const goalTile = layout.getTile(goalX, goalY);

        logger.debug(`Finding path from (${startX},${startY}) to (${goalX},${goalY})`);

        if (!startTile || !goalTile) {
            logger.debug(`Start or goal tile not found`);
            return [];
        }

        const startState = startTile.getState();
        const goalState = goalTile.getState();
        logger.debug(`Start tile state: ${RoomTileState[startState]}, Goal tile state: ${RoomTileState[goalState]}`);

        // Can't walk to invalid tiles
        if (goalState === RoomTileState.INVALID) {
            logger.debug(`Goal is INVALID, returning empty path`);
            return [];
        }

        // Already at goal
        if (startX === goalX && startY === goalY) {
            return [];
        }

        // Check if goal is reachable (considering furniture)
        // BLOCKED tiles cannot be walked to
        if (goalState === RoomTileState.BLOCKED) {
            logger.debug(`Goal is BLOCKED, returning empty path`);
            return [];
        }

        const openList: PathNode[] = [];
        const closedSet = new Set<string>();

        const startNode: PathNode = {
            tile: startTile,
            g: 0,
            h: this.heuristic(startX, startY, goalX, goalY),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        openList.push(startNode);

        let iterations = 0;
        const maxIterations = 500; // Prevent infinite loops

        while (openList.length > 0 && iterations < maxIterations) {
            iterations++;

            // Get node with lowest f cost
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;

            // Reached goal
            if (current.tile.getX() === goalX && current.tile.getY() === goalY) {
                return this.reconstructPath(current);
            }

            const key = `${current.tile.getX()},${current.tile.getY()}`;
            closedSet.add(key);

            // Get neighbors
            const neighbors = this.getNeighbors(layout, current.tile, allowDiagonal);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.getX()},${neighbor.getY()}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                // Check if tile is walkable
                if (!this.canWalkTo(room, current.tile, neighbor, goalTile)) {
                    continue;
                }

                const isDiagonal = current.tile.getX() !== neighbor.getX() &&
                                   current.tile.getY() !== neighbor.getY();
                const moveCost = isDiagonal ? this.DIAGONAL_COST : this.STRAIGHT_COST;
                const tentativeG = current.g + moveCost;

                // Check if already in open list
                const existingNode = openList.find(n =>
                    n.tile.getX() === neighbor.getX() && n.tile.getY() === neighbor.getY()
                );

                if (existingNode) {
                    if (tentativeG < existingNode.g) {
                        existingNode.g = tentativeG;
                        existingNode.f = existingNode.g + existingNode.h;
                        existingNode.parent = current;
                    }
                } else {
                    const newNode: PathNode = {
                        tile: neighbor,
                        g: tentativeG,
                        h: this.heuristic(neighbor.getX(), neighbor.getY(), goalX, goalY),
                        f: 0,
                        parent: current
                    };
                    newNode.f = newNode.g + newNode.h;
                    openList.push(newNode);
                }
            }
        }

        // No path found
        return [];
    }

    /**
     * Manhattan distance heuristic
     */
    private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
        return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * this.STRAIGHT_COST;
    }

    /**
     * Get walkable neighbor tiles
     */
    private static getNeighbors(layout: RoomLayout, tile: RoomTile, allowDiagonal: boolean): RoomTile[] {
        const neighbors: RoomTile[] = [];
        const x = tile.getX();
        const y = tile.getY();

        // Cardinal directions (N, E, S, W)
        const directions = [
            { dx: 0, dy: -1 },  // North
            { dx: 1, dy: 0 },   // East
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 0 }   // West
        ];

        // Diagonal directions (NE, SE, SW, NW)
        if (allowDiagonal) {
            directions.push(
                { dx: 1, dy: -1 },   // NE
                { dx: 1, dy: 1 },    // SE
                { dx: -1, dy: 1 },   // SW
                { dx: -1, dy: -1 }   // NW
            );
        }

        for (const dir of directions) {
            const neighbor = layout.getTile(x + dir.dx, y + dir.dy);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Check if we can walk from current tile to neighbor
     * Java: RoomUnit.canMoveToTile() logic
     */
    private static canWalkTo(room: Room, from: RoomTile, to: RoomTile, goal: RoomTile): boolean {
        const state = to.getState();

        // Invalid tiles are never walkable
        if (state === RoomTileState.INVALID) {
            return false;
        }

        // BLOCKED tiles - only walkable if it's the final goal AND it's actually SIT/LAY
        // (This shouldn't happen normally because SIT/LAY tiles have their own states)
        if (state === RoomTileState.BLOCKED) {
            // Only allow if it's the goal tile
            const isGoal = to.getX() === goal.getX() && to.getY() === goal.getY();
            if (!isGoal) {
                return false;
            }
            // Even for goal, BLOCKED means truly blocked (not sittable)
            return false;
        }

        // OPEN, SIT, LAY tiles are walkable
        // But SIT/LAY only as destination (can walk through to sit)

        // Check height difference
        const heightDiff = to.getStackHeight() - from.getStackHeight();
        if (Math.abs(heightDiff) > this.MAX_STEP_HEIGHT) {
            // Exception: if goal is SIT/LAY, allow stepping up to it
            const isGoal = to.getX() === goal.getX() && to.getY() === goal.getY();
            const canSitOrLay = state === RoomTileState.SIT || state === RoomTileState.LAY;
            if (!(isGoal && canSitOrLay)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reconstruct path from goal node back to start
     */
    private static reconstructPath(goalNode: PathNode): RoomTile[] {
        const path: RoomTile[] = [];
        let current: PathNode | null = goalNode;

        while (current !== null) {
            path.unshift(current.tile);
            current = current.parent;
        }

        // Remove start tile from path (we're already there)
        if (path.length > 0) {
            path.shift();
        }

        return path;
    }

    /**
     * Calculate rotation from one tile to another
     */
    public static calculateRotation(fromX: number, fromY: number, toX: number, toY: number): number {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (dx === 0 && dy === -1) return 0;  // North
        if (dx === 1 && dy === -1) return 1;  // NE
        if (dx === 1 && dy === 0) return 2;   // East
        if (dx === 1 && dy === 1) return 3;   // SE
        if (dx === 0 && dy === 1) return 4;   // South
        if (dx === -1 && dy === 1) return 5;  // SW
        if (dx === -1 && dy === 0) return 6;  // West
        if (dx === -1 && dy === -1) return 7; // NW

        return 2; // Default to East
    }
}
