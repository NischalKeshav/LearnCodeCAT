// UI System for level selection and game interface
class UIManager {
    constructor() {
        this.gameState = 'menu'; // 'menu', 'playing', 'levelSelect'
        this.selectedLevelButton = 1;
        this.buttonHover = null;
        this.buttons = [];
        this.canvas = null; // Will be set during initialization
        
        // Layout constants
        this.GAME_AREA_WIDTH = 800; // Main game area width
        this.SIDE_PANEL_WIDTH = 400; // Side panel width
        this.SIDE_PANEL_X = 800; // Side panel starts where game area ends
        
        // Simple block placement
        this.simpleBlockType = { id: 'building', name: 'Building', color: '#8B4513', gridWidth: 1, gridHeight: 1 };
        
        // Block counter
        this.blocksPlaced = 0;
        this.userPlacedBlocks = []; // Track user-placed blocks separately
        
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse event listeners for UI interaction
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.gameState = 'menu';
                } else if (this.gameState === 'levelSelect') {
                    this.gameState = 'menu';
                }
            }
            if (e.code === 'Enter') {
                if (this.gameState === 'menu') {
                    this.gameState = 'playing';
                }
            }
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleClick(e) {
        const mousePos = this.getMousePos(e);
        
        // Handle UI button clicks first
        for (let button of this.buttons) {
            if (this.isPointInButton(mousePos, button)) {
                this.executeButtonAction(button);
                return;
            }
        }
        
        // Check if click is in side panel
        if (mousePos.x >= this.SIDE_PANEL_X) {
            this.handleSidePanelClick(mousePos);
            return;
        }
        
        // If we're in game area and didn't click a button, handle block placement/deletion
        if (this.gameState === 'playing') {
            this.handleBlockClick(mousePos);
        }
    }

    handleMouseMove(e) {
        const mousePos = this.getMousePos(e);
        this.buttonHover = null;
        
        for (let button of this.buttons) {
            if (this.isPointInButton(mousePos, button)) {
                this.buttonHover = button.id;
                this.canvas.style.cursor = 'pointer';
                return;
            }
        }
        this.canvas.style.cursor = 'default';
    }

    handleBlockClick(mousePos) {
        console.log("Handling block click at screen position:", mousePos);
        console.log("Camera position:", gridSystem.camera.x, gridSystem.camera.y);
        
        // Convert screen position to world position accounting for camera
        // Use 0 as default if camera values are NaN
        const cameraX = isNaN(gridSystem.camera.x) ? 0 : gridSystem.camera.x;
        const cameraY = isNaN(gridSystem.camera.y) ? 0 : gridSystem.camera.y;
        
        const worldX = mousePos.x + cameraX;
        const worldY = mousePos.y + cameraY;
        console.log("World position:", worldX, worldY);
        
        // Convert to grid coordinates
        const gridPos = gridSystem.worldToGrid(worldX, worldY);
        console.log("Grid position:", gridPos);
        
        // Check if there's a user-placed block at this position
        const existingBlockIndex = this.findUserBlockAt(gridPos.x, gridPos.y);
        
        if (existingBlockIndex !== -1) {
            // Delete the block
            this.deleteBlockAt(existingBlockIndex);
        } else {
            // Place a new block
            const success = this.placeBlockOnMap(this.simpleBlockType, gridPos.x, gridPos.y);
            console.log("Block placement result:", success);
        }
    }

    findUserBlockAt(gridX, gridY) {
        for (let i = 0; i < this.userPlacedBlocks.length; i++) {
            const block = this.userPlacedBlocks[i];
            if (block.gridX === gridX && block.gridY === gridY) {
                return i;
            }
        }
        return -1;
    }

    deleteBlockAt(index) {
        const block = this.userPlacedBlocks[index];
        console.log(`Deleting user block at (${block.gridX}, ${block.gridY})`);
        
        // Remove from user blocks array
        this.userPlacedBlocks.splice(index, 1);
        
        // Find and remove from global blockades array
        const blockadeIndex = blockades.indexOf(block.blockade);
        if (blockadeIndex !== -1) {
            blockades.splice(blockadeIndex, 1);
        }
        
        // Update counter
        this.blocksPlaced--;
        console.log(`Blocks placed: ${this.blocksPlaced}`);
    }

    isPointInButton(point, button) {
        return point.x >= button.x && 
               point.x <= button.x + button.width &&
               point.y >= button.y && 
               point.y <= button.y + button.height;
    }

    executeButtonAction(button) {
        switch (button.action) {
            case 'startGame':
                this.gameState = 'playing';
                break;
            case 'levelSelect':
                this.gameState = 'levelSelect';
                break;
            case 'loadLevel':
                levelManager.loadLevel(button.levelNumber);
                this.gameState = 'playing';
                break;
            case 'nextLevel':
                levelManager.nextLevel();
                break;
            case 'prevLevel':
                levelManager.previousLevel();
                break;
            case 'backToMenu':
                this.gameState = 'menu';
                break;
            case 'runCatScript':
                if (typeof catManager !== 'undefined') {
                    catManager.runScript();
                }
                break;
            case 'resetCatScript':
                if (typeof catManager !== 'undefined') {
                    catManager.resetScript();
                }
                break;
            case 'startEducationalCat':
                if (typeof catManager !== 'undefined') {
                    catManager.startEducationalLevel();
                }
                break;
            case 'resetEducationalLevel':
                if (typeof catManager !== 'undefined') {
                    catManager.resetScript();
                    if (typeof gameState !== 'undefined') {
                        gameState.levelComplete = false;
                        gameState.gameOver = false;
                        gameState.gameOverReason = "";
                        goalPosition.reached = false;
                    }
                }
                break;
            case 'resetBlocks':
                this.resetUserBlocks();
                break;
        }
    }

    renderMainMenu(ctx) {
        this.buttons = [];
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Blockade Runner', this.canvas.width / 2, 120);

        // Subtitle
        ctx.fillStyle = '#cccccc';
        ctx.font = '20px Arial';
        ctx.fillText('Navigate the platforms and reach your goals!', this.canvas.width / 2, 160);

        // Start Game button
        const startButton = {
            id: 'start',
            x: this.canvas.width / 2 - 100,
            y: 220,
            width: 200,
            height: 50,
            text: 'Start Game',
            action: 'startGame'
        };
        this.buttons.push(startButton);
        this.renderButton(ctx, startButton, '#4CAF50', '#45a049');

        // Level Select button
        const levelSelectButton = {
            id: 'levelSelect',
            x: this.canvas.width / 2 - 100,
            y: 290,
            width: 200,
            height: 50,
            text: 'Select Level',
            action: 'levelSelect'
        };
        this.buttons.push(levelSelectButton);
        this.renderButton(ctx, levelSelectButton, '#2196F3', '#1976D2');

        // Instructions
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px Arial';
        ctx.fillText('Player is now stationary (attached to map)', this.canvas.width / 2, 420);
        ctx.fillText('Use Run Cat and Reset Cat buttons to control cat', this.canvas.width / 2, 450);
        ctx.fillText('Press ESC to return to menu', this.canvas.width / 2, 480);
        ctx.fillText('Click to place/delete blocks in game', this.canvas.width / 2, 510);
    }

    renderLevelSelect(ctx) {
        this.buttons = [];
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2e1a1a');
        gradient.addColorStop(1, '#3e1616');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Select Level', this.canvas.width / 2, 80);

        // Level buttons in a grid
        const buttonsPerRow = 3;
        const buttonWidth = 140;
        const buttonHeight = 100;
        const buttonSpacing = 20;
        const startX = (this.canvas.width - (buttonsPerRow * buttonWidth + (buttonsPerRow - 1) * buttonSpacing)) / 2;
        const startY = 140;

        for (let i = 1; i <= levelManager.maxLevel; i++) {
            const row = Math.floor((i - 1) / buttonsPerRow);
            const col = (i - 1) % buttonsPerRow;
            
            const x = startX + col * (buttonWidth + buttonSpacing);
            const y = startY + row * (buttonHeight + buttonSpacing);
            
            const level = levelManager.levels[i];
            const isCurrentLevel = levelManager.currentLevel === i;
            
            const levelButton = {
                id: `level${i}`,
                x: x,
                y: y,
                width: buttonWidth,
                height: buttonHeight,
                text: `Level ${i}`,
                subtitle: level.name,
                description: level.description,
                action: 'loadLevel',
                levelNumber: i
            };
            
            this.buttons.push(levelButton);
            
            // Choose color based on current level
            const baseColor = isCurrentLevel ? '#FF9800' : '#607D8B';
            const hoverColor = isCurrentLevel ? '#F57C00' : '#546E7A';
            
            this.renderLevelButton(ctx, levelButton, baseColor, hoverColor, isCurrentLevel);
        }

        // Back button
        const backButton = {
            id: 'back',
            x: 50,
            y: this.canvas.height - 80,
            width: 120,
            height: 40,
            text: 'Back to Menu',
            action: 'backToMenu'
        };
        this.buttons.push(backButton);
        this.renderButton(ctx, backButton, '#757575', '#616161');

        // Instructions
        ctx.fillStyle = '#cccccc';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click on a level to play it', this.canvas.width / 2, this.canvas.height - 40);
    }

    renderGameUI(ctx) {
        this.buttons = [];
        
        // Semi-transparent overlay for UI elements
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, 60);
        
        // Current level info
        const currentLevel = levelManager.getCurrentLevel();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${levelManager.currentLevel}: ${currentLevel.name}`, 20, 25);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(currentLevel.description, 20, 45);

        // Level navigation buttons
        if (!levelManager.isFirstLevel()) {
            const prevButton = {
                id: 'prev',
                x: this.canvas.width - 200,
                y: 10,
                width: 80,
                height: 40,
                text: 'Previous',
                action: 'prevLevel'
            };
            this.buttons.push(prevButton);
            this.renderButton(ctx, prevButton, '#FF5722', '#E64A19', true);
        }

        if (!levelManager.isMaxLevel()) {
            const nextButton = {
                id: 'next',
                x: this.canvas.width - 110,
                y: 10,
                width: 80,
                height: 40,
                text: 'Next',
                action: 'nextLevel'
            };
            this.buttons.push(nextButton);
            this.renderButton(ctx, nextButton, '#4CAF50', '#45a049', true);
        }

        // Menu button
        const menuButton = {
            id: 'menu',
            x: 20,
            y: this.canvas.height - 50,
            width: 60,
            height: 30,
            text: 'Menu',
            action: 'backToMenu'
        };
        this.buttons.push(menuButton);
        this.renderButton(ctx, menuButton, '#9E9E9E', '#757575', true);

        // Cat script control buttons
        const runButton = {
            id: 'runScript',
            x: 100,
            y: this.canvas.height - 50,
            width: 80,
            height: 30,
            text: 'Run Cat',
            action: 'runCatScript'
        };
        this.buttons.push(runButton);
        this.renderButton(ctx, runButton, '#4CAF50', '#45a049', true);

        const resetButton = {
            id: 'resetScript',
            x: 190,
            y: this.canvas.height - 50,
            width: 80,
            height: 30,
            text: 'Reset Cat',
            action: 'resetCatScript'
        };
        this.buttons.push(resetButton);
        this.renderButton(ctx, resetButton, '#FF5722', '#E64A19', true);

        // Instructions and counter
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Click to place/delete blocks', this.canvas.width - 20, this.canvas.height - 40);
        
        // Block counter
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Blocks: ${this.blocksPlaced}`, this.canvas.width - 20, this.canvas.height - 20);
        
        // Remove the old cat script status from game area
        // this.renderCatScriptStatus(ctx);
    }

    renderButton(ctx, button, baseColor, hoverColor, small = false) {
        const isHovered = this.buttonHover === button.id;
        const color = isHovered ? hoverColor : baseColor;
        
        // Button background
        ctx.fillStyle = color;
        ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // Button border
        ctx.strokeStyle = isHovered ? '#ffffff' : '#dddddd';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = small ? '14px Arial' : 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            button.text, 
            button.x + button.width / 2, 
            button.y + button.height / 2 + (small ? 4 : 6)
        );
    }

    renderLevelButton(ctx, button, baseColor, hoverColor, isCurrent) {
        const isHovered = this.buttonHover === button.id;
        const color = isHovered ? hoverColor : baseColor;
        
        // Button background
        ctx.fillStyle = color;
        ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // Button border (thicker for current level)
        ctx.strokeStyle = isCurrent ? '#FFC107' : (isHovered ? '#ffffff' : '#dddddd');
        ctx.lineWidth = isCurrent ? 4 : (isHovered ? 3 : 2);
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // Level number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(button.text, button.x + button.width / 2, button.y + 30);
        
        // Level name
        ctx.font = 'bold 14px Arial';
        ctx.fillText(button.subtitle, button.x + button.width / 2, button.y + 55);
        
        // Level description
        ctx.font = '12px Arial';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(button.description, button.x + button.width / 2, button.y + 75);
        
        // Current level indicator
        if (isCurrent) {
            ctx.fillStyle = '#FFC107';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('CURRENT', button.x + button.width / 2, button.y + 90);
        }
    }

    render(ctx) {
        switch (this.gameState) {
            case 'menu':
                this.renderMainMenu(ctx);
                break;
            case 'levelSelect':
                this.renderLevelSelect(ctx);
                break;
            case 'playing':
                // Game renders first, then UI overlay
                this.renderGameUI(ctx);
                this.renderSidePanel(ctx); // Add side panel for playing state
                break;
        }
    }

    isPlaying() {
        return this.gameState === 'playing';
    }

    // Block placement helper methods

    placeBlockOnMap(blockType, gridX, gridY) {
        console.log(`Attempting to place ${blockType.name} at grid (${gridX}, ${gridY})`);
        console.log("Block size:", blockType.gridWidth, "x", blockType.gridHeight);
        console.log("World bounds:", gridSystem.worldWidth, "x", gridSystem.worldHeight);
        
        // Check if the placement is valid (within bounds and not overlapping)
        if (gridX < 0 || gridY < 0 || 
            gridX + blockType.gridWidth > gridSystem.worldWidth ||
            gridY + blockType.gridHeight > gridSystem.worldHeight) {
            console.log("Block placement failed: out of bounds");
            return false;
        }

        // Collision checking disabled - blocks can be placed anywhere

        // Create the new blockade
        const worldPos = gridSystem.gridToWorld(gridX, gridY);
        console.log("Creating blockade at world position:", worldPos);
        
        const blockade = new Blockade(
            worldPos.x, 
            worldPos.y, 
            blockType.gridWidth * gridSystem.tileSize, 
            blockType.gridHeight * gridSystem.tileSize, 
            blockType.color
        );
        
        // Set blockade properties
        blockade.type = blockType.id;
        blockade.gridX = gridX;
        blockade.gridY = gridY;
        blockade.gridWidth = blockType.gridWidth;
        blockade.gridHeight = blockType.gridHeight;
        
        // Add unique ID for tracking user-placed blocks
        blockade.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Add to blockades array
        blockades.push(blockade);
        
        // Track user-placed blocks
        this.userPlacedBlocks.push({
            id: blockade.id,
            gridX: gridX,
            gridY: gridY,
            blockade: blockade
        });
        
        // Update counter
        this.blocksPlaced++;
        
        console.log(`Successfully placed ${blockType.name} at grid (${gridX}, ${gridY})`);
        console.log("Total blockades:", blockades.length);
        console.log(`Blocks placed: ${this.blocksPlaced}`);
        return true;
    }

    checkGridOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 >= x2 + w2 || x2 >= x1 + w1 || y1 >= y2 + h2 || y2 >= y1 + h1);
    }

    renderSidePanel(ctx) {
        // Side panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(this.SIDE_PANEL_X, 0, this.SIDE_PANEL_WIDTH, this.canvas.height);
        
        // Side panel border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.SIDE_PANEL_X, 0);
        ctx.lineTo(this.SIDE_PANEL_X, this.canvas.height);
        ctx.stroke();
        
        // Title
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        const title = 'Programming Puzzle';
        ctx.fillText(title, this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, 40);
        
        // Always render educational panel (only mode available)
        this.renderEducationalPanel(ctx);
    }
    
    
    
    
    renderEducationalPanel(ctx) {
        const panelX = this.SIDE_PANEL_X + 20;
        let y = 80;
        
        // Objective section
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Objective', panelX, y);
        y += 30;
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Help the cat reach home!', panelX, y);
        y += 25;
        
        // Instructions
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Instructions', panelX, y);
        y += 25;
        
        ctx.font = '13px Arial';
        ctx.fillStyle = '#CCCCCC';
        const instructions = [
            '1. Click to place blocks',
            '2. Click blocks to remove them',
            '3. Press "Start Cat" to begin',
            '4. Watch the cat follow its path'
        ];
        
        instructions.forEach(instruction => {
            ctx.fillText(instruction, panelX, y);
            y += 20;
        });
        
        y += 15;
        
        // Cat behavior section
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Cat Behavior', panelX, y);
        y += 25;
        
        if (typeof catManager !== 'undefined') {
            const behaviorInfo = catManager.getCurrentBehaviorInfo();
            if (behaviorInfo) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#4CAF50';
                ctx.fillText(behaviorInfo.name, panelX, y);
                y += 20;
                
                ctx.font = '12px Arial';
                ctx.fillStyle = '#CCCCCC';
                // Word wrap the description
                const words = behaviorInfo.description.split(' ');
                let line = '';
                const maxWidth = this.SIDE_PANEL_WIDTH - 60;
                
                words.forEach(word => {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== '') {
                        ctx.fillText(line, panelX, y);
                        line = word + ' ';
                        y += 16;
                    } else {
                        line = testLine;
                    }
                });
                ctx.fillText(line, panelX, y);
                y += 25;
            }
        }
        
        // Control buttons
        const buttonWidth = 100;
        const buttonHeight = 30;
        const buttonSpacing = 10;
        
        // Start Cat button (disabled if game over or level complete)
        const canStart = !(typeof gameState !== 'undefined' && (gameState.gameOver || gameState.levelComplete));
        const startButton = {
            id: 'startEducationalCat',
            x: panelX,
            y: y,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Start Cat',
            action: canStart ? 'startEducationalCat' : null
        };
        if (canStart) {
            this.buttons.push(startButton);
        }
        const startColor = canStart ? '#4CAF50' : '#757575';
        const startHoverColor = canStart ? '#45a049' : '#616161';
        this.renderButton(ctx, startButton, startColor, startHoverColor, true);
        
        // Reset Level button
        const resetButton = {
            id: 'resetEducationalLevel',
            x: panelX + buttonWidth + buttonSpacing,
            y: y,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Reset Level',
            action: 'resetEducationalLevel'
        };
        this.buttons.push(resetButton);
        this.renderButton(ctx, resetButton, '#FF5722', '#E64A19', true);
        
        y += buttonHeight + 10;
        
        // Reset Blocks button
        const resetBlocksButton = {
            id: 'resetBlocks',
            x: panelX + (buttonWidth + buttonSpacing) / 2,
            y: y,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Reset Blocks',
            action: 'resetBlocks'
        };
        this.buttons.push(resetBlocksButton);
        this.renderButton(ctx, resetBlocksButton, '#9C27B0', '#7B1FA2', true);
        
        y += buttonHeight + 20;
        
        // Level completion or game over status
        if (typeof gameState !== 'undefined') {
            if (gameState.levelComplete) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🎉 LEVEL COMPLETE! 🎉', this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, y);
                
                y += 30;
                ctx.font = '14px Arial';
                ctx.fillStyle = '#4CAF50';
                ctx.fillText('The cat made it home!', this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, y);
            } else if (gameState.gameOver) {
                ctx.fillStyle = '#FF5722';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('💀 GAME OVER 💀', this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, y);
                
                y += 30;
                ctx.font = '14px Arial';
                ctx.fillStyle = '#FF8A80';
                ctx.fillText(gameState.gameOverReason, this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, y);
                
                y += 25;
                ctx.font = '12px Arial';
                ctx.fillStyle = '#CCCCCC';
                ctx.fillText('Try placing blocks to keep the cat on screen!', this.SIDE_PANEL_X + this.SIDE_PANEL_WIDTH/2, y);
            }
        }
    }
    
    resetUserBlocks() {
        // Remove all user-placed blocks from the blockades array
        if (typeof blockades !== 'undefined' && this.userPlacedBlocks.length > 0) {
            // Filter out user-placed blocks from the main blockades array
            const userBlockIds = this.userPlacedBlocks.map(block => block.id);
            blockades = blockades.filter(blockade => !userBlockIds.includes(blockade.id));
            
            // Clear the user-placed blocks array
            this.userPlacedBlocks = [];
            this.blocksPlaced = 0;
            
            console.log(`Reset ${userBlockIds.length} user-placed blocks`);
            console.log(`Remaining blockades: ${blockades.length}`);
        }
    }
    
    darkenColor(color) {
        // Simple color darkening function
        const colorMap = {
            '#4CAF50': '#45a049',
            '#FF9800': '#E68900',
            '#F44336': '#D32F2F',
            '#9C27B0': '#7B1FA2'
        };
        return colorMap[color] || color;
    }
    
    handleSidePanelClick(mousePos) {
        // Handle direction button clicks and other side panel interactions
        // This will be called from the main click handler
        console.log('Side panel clicked at:', mousePos.x - this.SIDE_PANEL_X, mousePos.y);
    }

}

// Global UI manager instance (will be initialized in game.js)
let uiManager;
