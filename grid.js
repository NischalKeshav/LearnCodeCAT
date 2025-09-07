// Grid-based system for bird's eye view cityscape
class GridSystem {
    constructor(tileSize = 32, worldWidth = 50, worldHeight = 50) {
        this.tileSize = tileSize;
        this.worldWidth = worldWidth;  // Grid tiles wide
        this.worldHeight = worldHeight; // Grid tiles tall
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Camera system for bird's eye view (top-down)
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.15
        };
        
        // Grid visualization
        this.showGrid = true; // Show grid for top-down navigation
        this.viewDistance = 400; // How far the camera can see
    }

    // Convert grid coordinates to world pixels
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.tileSize,
            y: gridY * this.tileSize
        };
    }

    // Convert world pixels to grid coordinates
    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    // Snap position to grid
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.tileSize) * this.tileSize,
            y: Math.round(y / this.tileSize) * this.tileSize
        };
    }

    // Update camera to follow target (usually player) - bird's eye view
    updateCamera(targetX, targetY) {
        // Check for invalid input
        if (isNaN(targetX) || isNaN(targetY)) {
            console.warn("Invalid camera target:", targetX, targetY);
            return;
        }
        
        // Center player on screen for top-down view
        const desiredCameraX = targetX - (this.canvasWidth * 0.5);
        const desiredCameraY = targetY - (this.canvasHeight * 0.5);
        
        // Smooth camera movement with bounds
        this.camera.targetX = Math.max(0, Math.min(
            desiredCameraX, 
            (this.worldWidth * this.tileSize) - this.canvasWidth
        ));
        
        this.camera.targetY = Math.max(0, Math.min(
            desiredCameraY, 
            (this.worldHeight * this.tileSize) - this.canvasHeight
        ));
        
        // Check for NaN before updating camera position
        if (!isNaN(this.camera.targetX) && !isNaN(this.camera.targetY)) {
            this.camera.x += (this.camera.targetX - this.camera.x) * this.smoothing;
            this.camera.y += (this.camera.targetY - this.camera.y) * this.smoothing;
        } else {
            console.warn("Camera target became NaN:", this.camera.targetX, this.camera.targetY);
        }
    }

    // Transform world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.camera.x,
            y: worldY - this.camera.y
        };
    }

    // Transform screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.camera.x,
            y: screenY + this.camera.y
        };
    }

    // Check if a world position is visible on screen
    isVisible(worldX, worldY, width = this.tileSize, height = this.tileSize) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x + width >= 0 && 
               screen.x <= this.canvasWidth && 
               screen.y + height >= 0 && 
               screen.y <= this.canvasHeight;
    }

    // Render grid lines for debugging
    renderGrid(ctx) {
        if (!this.showGrid) return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.worldWidth; x++) {
            const worldX = x * this.tileSize;
            const screenPos = this.worldToScreen(worldX, 0);
            
            if (screenPos.x >= 0 && screenPos.x <= this.canvasWidth) {
                ctx.beginPath();
                ctx.moveTo(screenPos.x, 0);
                ctx.lineTo(screenPos.x, this.canvasHeight);
                ctx.stroke();
            }
        }

        // Horizontal lines
        for (let y = 0; y <= this.worldHeight; y++) {
            const worldY = y * this.tileSize;
            const screenPos = this.worldToScreen(0, worldY);
            
            if (screenPos.y >= 0 && screenPos.y <= this.canvasHeight) {
                ctx.beginPath();
                ctx.moveTo(0, screenPos.y);
                ctx.lineTo(this.canvasWidth, screenPos.y);
                ctx.stroke();
            }
        }
    }

    // Get grid bounds for current camera view
    getVisibleGridBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvasWidth, this.canvasHeight);
        
        return {
            minX: Math.max(0, Math.floor(topLeft.x / this.tileSize)),
            maxX: Math.min(this.worldWidth - 1, Math.ceil(bottomRight.x / this.tileSize)),
            minY: Math.max(0, Math.floor(topLeft.y / this.tileSize)),
            maxY: Math.min(this.worldHeight - 1, Math.ceil(bottomRight.y / this.tileSize))
        };
    }

    // Create a building at grid coordinates
    createGridBuilding(gridX, gridY, gridWidth, gridHeight, color, type = 'building') {
        const world = this.gridToWorld(gridX, gridY);
        return {
            gridX: gridX,
            gridY: gridY,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
            x: world.x,
            y: world.y,
            width: gridWidth * this.tileSize,
            height: gridHeight * this.tileSize,
            color: color,
            type: type
        };
    }

    // Collision detection with grid alignment
    checkGridCollision(entity, buildings) {
        const entityGrid = this.worldToGrid(entity.pos.x, entity.pos.y);
        const entityGridWidth = Math.ceil(entity.width / this.tileSize);
        const entityGridHeight = Math.ceil(entity.height / this.tileSize);

        for (let building of buildings) {
            // Grid-based collision detection
            if (entityGrid.x < building.gridX + building.gridWidth &&
                entityGrid.x + entityGridWidth > building.gridX &&
                entityGrid.y < building.gridY + building.gridHeight &&
                entityGrid.y + entityGridHeight > building.gridY) {
                return building;
            }
        }
        return null;
    }
}

// Global grid system
let gridSystem = new GridSystem();
