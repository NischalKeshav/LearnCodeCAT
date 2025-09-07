// Level system for the blockade game
class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 1;
        this.levels = this.createLevels();
    }

    createLevels() {
        return {
            1: {
                name: "Cat Navigation Challenge",
                description: "Help the cat reach home by placing blocks to guide its path",
                theme: "educational",
                skyColor: "#87CEEB", // Sky blue
                gridBuildings: [
                    // Ground layer
                    { gridX: 0, gridY: 0, gridWidth: 50, gridHeight: 50, color: '#2F4F4F', type: 'ground' },
                    
                    // Major buildings - creating a complex city layout
                    { gridX: 5, gridY: 5, gridWidth: 6, gridHeight: 8, color: '#8B4513', type: 'building' },
                    { gridX: 15, gridY: 3, gridWidth: 7, gridHeight: 12, color: '#A0522D', type: 'building' },
                    { gridX: 25, gridY: 6, gridWidth: 5, gridHeight: 9, color: '#8B4513', type: 'building' },
                    { gridX: 35, gridY: 4, gridWidth: 8, gridHeight: 11, color: '#654321', type: 'building' },
                    
                    // Middle row buildings
                    { gridX: 3, gridY: 18, gridWidth: 7, gridHeight: 6, color: '#A0522D', type: 'building' },
                    { gridX: 14, gridY: 20, gridWidth: 6, gridHeight: 8, color: '#8B4513', type: 'building' },
                    { gridX: 24, gridY: 17, gridWidth: 8, gridHeight: 10, color: '#654321', type: 'building' },
                    { gridX: 36, gridY: 19, gridWidth: 5, gridHeight: 7, color: '#A0522D', type: 'building' },
                    
                    // Lower buildings
                    { gridX: 6, gridY: 30, gridWidth: 5, gridHeight: 6, color: '#8B4513', type: 'building' },
                    { gridX: 16, gridY: 32, gridWidth: 7, gridHeight: 8, color: '#654321', type: 'building' },
                    { gridX: 28, gridY: 31, gridWidth: 6, gridHeight: 7, color: '#A0522D', type: 'building' },
                    { gridX: 38, gridY: 33, gridWidth: 5, gridHeight: 5, color: '#8B4513', type: 'building' },
                    
                    // Small scattered buildings
                    { gridX: 12, gridY: 8, gridWidth: 2, gridHeight: 3, color: '#696969', type: 'building' },
                    { gridX: 32, gridY: 12, gridWidth: 2, gridHeight: 4, color: '#696969', type: 'building' },
                    { gridX: 8, gridY: 26, gridWidth: 3, gridHeight: 2, color: '#696969', type: 'building' },
                    { gridX: 21, gridY: 28, gridWidth: 2, gridHeight: 3, color: '#696969', type: 'building' },
                    { gridX: 42, gridY: 28, gridWidth: 3, gridHeight: 3, color: '#696969', type: 'building' },
                    
                    // Industrial buildings
                    { gridX: 1, gridY: 40, gridWidth: 8, gridHeight: 4, color: '#2F4F4F', type: 'building' },
                    { gridX: 12, gridY: 42, gridWidth: 6, gridHeight: 5, color: '#2F4F4F', type: 'building' },
                    { gridX: 22, gridY: 41, gridWidth: 9, gridHeight: 6, color: '#2F4F4F', type: 'building' },
                    { gridX: 35, gridY: 40, gridWidth: 7, gridHeight: 4, color: '#2F4F4F', type: 'building' },
                    
                    // Smokestacks and towers
                    { gridX: 4, gridY: 35, gridWidth: 1, gridHeight: 8, color: '#4A4A4A', type: 'smokestack' },
                    { gridX: 19, gridY: 38, gridWidth: 1, gridHeight: 6, color: '#4A4A4A', type: 'smokestack' },
                    { gridX: 29, gridY: 36, gridWidth: 1, gridHeight: 7, color: '#4A4A4A', type: 'smokestack' },
                    { gridX: 41, gridY: 37, gridWidth: 1, gridHeight: 5, color: '#4A4A4A', type: 'smokestack' },
                    
                    // Park areas (safe zones) - fewer now due to more buildings
                    { gridX: 11, gridY: 15, gridWidth: 2, gridHeight: 2, color: '#228B22', type: 'park' },
                    { gridX: 33, gridY: 22, gridWidth: 2, gridHeight: 2, color: '#228B22', type: 'park' }
                ],
                playerStart: { gridX: 2, gridY: 2 }
            }
        };
    }

    loadLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.maxLevel) {
            console.error(`Level ${levelNumber} does not exist!`);
            return false;
        }

        this.currentLevel = levelNumber;
        const level = this.levels[levelNumber];
        
        // Clear existing blockades and cats
        blockades = [];
        catManager.clearCats();
        
        // Create new blockades for this level using grid system
        level.gridBuildings.forEach(buildingData => {
            const building = gridSystem.createGridBuilding(
                buildingData.gridX,
                buildingData.gridY,
                buildingData.gridWidth,
                buildingData.gridHeight,
                buildingData.color,
                buildingData.type
            );
            
            const blockade = createBlockade(
                building.x,
                building.y,
                building.width,
                building.height,
                building.color
            );
            
            // Add grid and cityscape properties
            blockade.gridX = building.gridX;
            blockade.gridY = building.gridY;
            blockade.gridWidth = building.gridWidth;
            blockade.gridHeight = building.gridHeight;
            blockade.type = building.type;
            blockade.theme = level.theme;
        });

        // Player positioning removed - using cat system instead
        // The cat will be positioned by the cat manager

        console.log(`Loaded level ${levelNumber}: ${level.name}`);
        return true;
    }

    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }

    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            return this.loadLevel(this.currentLevel + 1);
        }
        return false;
    }

    previousLevel() {
        if (this.currentLevel > 1) {
            return this.loadLevel(this.currentLevel - 1);
        }
        return false;
    }

    isMaxLevel() {
        return this.currentLevel === this.maxLevel;
    }

    isFirstLevel() {
        return this.currentLevel === 1;
    }
}

// Global level manager instance
let levelManager = new LevelManager();
