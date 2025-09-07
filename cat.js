// Cat image loading
let catImage = null;
let catImageLoaded = false;

// Load cat image
function loadCatImage() {
    if (!catImage) {
        catImage = new Image();
        catImage.onload = function() {
            catImageLoaded = true;
            console.log('Cat image loaded successfully:', catImage.width + 'x' + catImage.height);
        };
        catImage.onerror = function() {
            console.error('Failed to load cat image: catfigure.png not found or invalid');
            catImageLoaded = false;
        };
        catImage.src = 'catfigure.png';
    }
}

// Function to check if cat image is ready
function isCatImageReady() {
    return catImageLoaded && catImage && catImage.complete;
}

// Initialize cat image loading
loadCatImage();

// Cat system for random city wandering
class Cat {
    constructor(gridX, gridY, color = '#FF6B35') {
        // Grid position
        this.gridX = gridX;
        this.gridY = gridY;
        
        // World position
        const worldPos = gridSystem.gridToWorld(gridX, gridY);
        this.pos = Vector2(worldPos.x + 6, worldPos.y + 6); // Offset to center in grid
        
        // Cat properties
        this.width = 24; // Slightly larger for image
        this.height = 24;
        this.color = color;
        this.direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left
        
        // Movement behavior
        this.moveTimer = 0;
        this.moveDelay = 1.0 + Math.random() * 2.0; // Random delay between 1-3 seconds
        this.idleTime = 0;
        this.maxIdleTime = 2.0 + Math.random() * 4.0; // Random idle time
        this.isIdle = Math.random() < 0.3; // 30% chance to start idle
        
        // Animation
        this.animationTimer = 0;
        this.walkCycle = 0;
        this.tailSwish = 0;
        
        // Personality traits
        this.curiosity = Math.random(); // How likely to change direction
        this.laziness = Math.random();  // How often to idle
        this.speed = 0.8 + Math.random() * 0.4; // Slight speed variation
        
        // Memory of recent positions to avoid getting stuck
        this.recentPositions = [];
        this.maxRecentPositions = 5;
        
        // Following behavior
        this.isFollower = false;
        this.followDistance = 2; // Stay about 2 tiles away from player
        this.lastPlayerPosition = { x: 0, y: 0 };
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        this.tailSwish += deltaTime * 3;
        
        if (this.isIdle) {
            this.updateIdle(deltaTime);
        } else {
            this.updateMovement(deltaTime);
        }
        
        // Update walk cycle animation
        if (!this.isIdle) {
            this.walkCycle += deltaTime * 4;
        }
    }
    
    updateIdle(deltaTime) {
        this.idleTime += deltaTime;
        
        // Randomly end idle state
        if (this.idleTime >= this.maxIdleTime || Math.random() < 0.01) {
            this.isIdle = false;
            this.idleTime = 0;
            this.maxIdleTime = 2.0 + Math.random() * 4.0;
            this.changeDirection();
        }
    }
    
    updateMovement(deltaTime) {
        this.moveTimer += deltaTime;
        
        if (this.moveTimer >= this.moveDelay) {
            if (this.isFollower) {
                // Following behavior
                this.updateFollowing();
            } else {
                // Random movement behavior
                // Decide whether to move or become idle
                if (Math.random() < this.laziness * 0.3) {
                    this.isIdle = true;
                    this.moveTimer = 0;
                    return;
                }
                
                // Try to move in current direction
                if (!this.tryMove()) {
                    // If can't move, change direction
                    this.changeDirection();
                    this.tryMove(); // Try once more in new direction
                }
                
                // Random chance to change direction even if movement succeeded
                if (Math.random() < this.curiosity * 0.2) {
                    this.changeDirection();
                }
            }
            
            this.moveTimer = 0;
            this.moveDelay = 0.8 + Math.random() * 1.5; // Vary movement speed
        }
    }
    
    updateFollowing() {
        // Following behavior disabled - using script system instead
        // Cat will be controlled by script commands
        this.isIdle = true;
    }
    
    tryMoveTowards(deltaX, deltaY) {
        // Calculate new position
        const newGridX = this.gridX + deltaX;
        const newGridY = this.gridY + deltaY;
        
        console.log(`Trying to move from (${this.gridX}, ${this.gridY}) to (${newGridX}, ${newGridY})`);
        
        // Allow movement off screen for game over detection
        // Boundaries will be checked in the main game loop
        
        // Check for collisions
        const blockingObject = this.getBlockingObject(newGridX, newGridY);
        if (blockingObject) {
            console.log(`Movement blocked: collision at (${newGridX}, ${newGridY})`);
            
            // Handle collision-based behavior
            if (typeof catManager !== 'undefined' && catManager.script.educationalBehaviors[catManager.script.currentBehavior]?.isCollisionBased) {
                this.handleSmartCollision(blockingObject, deltaX, deltaY);
            }
            return false;
        }
        
        // Move to new position
        this.gridX = newGridX;
        this.gridY = newGridY;
        
        const worldPos = gridSystem.gridToWorld(newGridX, newGridY);
        this.pos.x = worldPos.x + 6;
        this.pos.y = worldPos.y + 6;
        
        console.log(`Cat moved to grid (${this.gridX}, ${this.gridY}), world (${this.pos.x}, ${this.pos.y})`);
        
        // Update direction for visual purposes
        if (deltaX > 0) this.direction = 1; // Right
        else if (deltaX < 0) this.direction = 3; // Left
        else if (deltaY > 0) this.direction = 2; // Down
        else if (deltaY < 0) this.direction = 0; // Up
        
        return true;
    }
    
    tryMove() {
        // Calculate new position based on direction
        let newGridX = this.gridX;
        let newGridY = this.gridY;
        
        switch (this.direction) {
            case 0: newGridY--; break; // Up
            case 1: newGridX++; break; // Right
            case 2: newGridY++; break; // Down
            case 3: newGridX--; break; // Left
        }
        
        // Check world boundaries
        if (newGridX < 0 || newGridX >= gridSystem.worldWidth || 
            newGridY < 0 || newGridY >= gridSystem.worldHeight) {
            return false;
        }
        
        // Check if position was recently visited (avoid getting stuck)
        const posKey = `${newGridX},${newGridY}`;
        if (this.recentPositions.includes(posKey) && this.recentPositions.length > 2) {
            return false;
        }
        
        // Check for collisions with buildings
        if (this.isPositionBlocked(newGridX, newGridY)) {
            return false;
        }
        
        // Move to new position
        this.gridX = newGridX;
        this.gridY = newGridY;
        
        const worldPos = gridSystem.gridToWorld(newGridX, newGridY);
        this.pos.x = worldPos.x + 6;
        this.pos.y = worldPos.y + 6;
        
        // Update recent positions
        this.recentPositions.push(posKey);
        if (this.recentPositions.length > this.maxRecentPositions) {
            this.recentPositions.shift();
        }
        
        return true;
    }
    
    isPositionBlocked(gridX, gridY) {
        // Check if position overlaps with any solid buildings
        for (let blockade of blockades) {
            if (blockade.type === 'building' || blockade.type === 'smokestack') {
                if (gridX >= blockade.gridX && gridX < blockade.gridX + blockade.gridWidth &&
                    gridY >= blockade.gridY && gridY < blockade.gridY + blockade.gridHeight) {
                    return true;
                }
            }
        }
        return false;
    }
    
    getBlockingObject(gridX, gridY) {
        // Return the specific object blocking this position
        if (typeof blockades === 'undefined') return null;
        
        for (let blockade of blockades) {
            if (blockade.type === 'building' || blockade.type === 'smokestack' || blockade.type === 'platform') {
                if (gridX >= blockade.gridX && gridX < blockade.gridX + blockade.gridWidth &&
                    gridY >= blockade.gridY && gridY < blockade.gridY + blockade.gridHeight) {
                    return blockade;
                }
            }
        }
        return null;
    }
    
    handleSmartCollision(blockingObject, deltaX, deltaY) {
        // Different behavior based on what type of object was hit
        const isUserPlacedBlock = blockingObject.id && blockingObject.id.startsWith('user_');
        
        if (isUserPlacedBlock) {
            // Hit a player-placed block - turn right
            console.log("Hit player block - turning right");
            this.turnRight();
        } else {
            // Hit a building or level geometry - reverse direction
            console.log("Hit building - reversing");
            this.reverseDirection();
        }
    }
    
    turnRight() {
        // Turn 90 degrees counter-clockwise (which appears as "right" in top-down view)
        // 0=up, 1=right, 2=down, 3=left
        // Counter-clockwise: up->left->down->right->up
        const oldDirection = this.direction;
        this.direction = (this.direction + 3) % 4; // +3 is same as -1 in modulo 4
        const directionNames = ['up', 'right', 'down', 'left'];
        console.log(`Cat turned RIGHT from ${directionNames[oldDirection]} to ${directionNames[this.direction]} (${oldDirection} -> ${this.direction})`);
    }
    
    reverseDirection() {
        // Turn 180 degrees
        // 0=up, 1=right, 2=down, 3=left
        this.direction = (this.direction + 2) % 4;
        console.log(`Cat reversed, now facing direction ${this.direction}`);
    }
    
    changeDirection() {
        // Choose a new random direction, preferring not to go backwards
        const oppositeDirection = (this.direction + 2) % 4;
        let newDirection;
        
        do {
            newDirection = Math.floor(Math.random() * 4);
        } while (newDirection === oppositeDirection && Math.random() < 0.7);
        
        this.direction = newDirection;
    }
    
    render(ctx) {
        // Only render if visible on screen
        if (!gridSystem.isVisible(this.pos.x - 10, this.pos.y - 10, this.width + 20, this.height + 20)) {
            return;
        }
        
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        
        // Use image if loaded, otherwise fall back to drawn cat
        if (isCatImageReady()) {
            this.renderCatImage(ctx, centerX, centerY);
        } else {
            this.renderDrawnCat(ctx, centerX, centerY);
        }
        
        // Debug: Show direction (optional)
        if (gridSystem.showGrid) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(['↑', '→', '↓', '←'][this.direction], centerX, centerY - 20);
        }
    }
    
    renderCatImage(ctx, centerX, centerY) {
        ctx.save();
        
        // Move to center of cat
        ctx.translate(centerX, centerY);
        
        // Only rotate when cat is actively moving (not idle)
        if (!this.isIdle) {
            const rotations = [0, Math.PI/2, Math.PI, -Math.PI/2]; // up, right, down, left
            ctx.rotate(rotations[this.direction]);
        }
        
        // Add slight bobbing animation when walking
        let bobOffset = 0;
        if (!this.isIdle) {
            bobOffset = Math.sin(this.walkCycle) * 1;
        }
        
        // Draw the cat image centered
        const imageSize = 28; // Size to draw the image
        ctx.drawImage(
            catImage, 
            -imageSize / 2, 
            -imageSize / 2 + bobOffset, 
            imageSize, 
            imageSize
        );
        
        ctx.restore();
        
        // Add subtle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 12, this.width / 3, this.height / 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderDrawnCat(ctx, centerX, centerY) {
        // Fallback to drawn cat if image doesn't load
        // Cat body (main oval)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cat head (smaller circle)
        const headOffset = this.getHeadOffset();
        const headX = centerX + headOffset.x;
        const headY = centerY + headOffset.y - 8;
        
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Cat ears
        this.renderEars(ctx, headX, headY);
        
        // Cat tail (animated)
        this.renderTail(ctx, centerX, centerY);
        
        // Cat eyes
        ctx.fillStyle = '#000';
        const eyeOffset = this.getHeadOffset();
        ctx.beginPath();
        ctx.arc(headX - 3 + eyeOffset.x * 0.3, headY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(headX + 3 + eyeOffset.x * 0.3, headY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Cat nose (tiny pink dot)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(headX + eyeOffset.x * 0.2, headY + 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Walking animation - little paws
        if (!this.isIdle) {
            this.renderPaws(ctx, centerX, centerY);
        }
    }
    
    getHeadOffset() {
        // Head direction based on movement direction
        const headOffsets = [
            { x: 0, y: -3 },  // Up
            { x: 3, y: 0 },   // Right  
            { x: 0, y: 3 },   // Down
            { x: -3, y: 0 }   // Left
        ];
        return headOffsets[this.direction];
    }
    
    renderEars(ctx, headX, headY) {
        ctx.fillStyle = this.color;
        
        // Left ear
        ctx.beginPath();
        ctx.moveTo(headX - 5, headY - 6);
        ctx.lineTo(headX - 2, headY - 10);
        ctx.lineTo(headX - 1, headY - 6);
        ctx.fill();
        
        // Right ear
        ctx.beginPath();
        ctx.moveTo(headX + 5, headY - 6);
        ctx.lineTo(headX + 2, headY - 10);
        ctx.lineTo(headX + 1, headY - 6);
        ctx.fill();
        
        // Inner ears
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(headX - 3, headY - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(headX + 3, headY - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderTail(ctx, centerX, centerY) {
        // Animated swishing tail
        const tailSwish = Math.sin(this.tailSwish) * 0.5;
        const tailX = centerX - 8 + tailSwish * 3;
        const tailY = centerY + 6 + Math.abs(tailSwish) * 2;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(centerX - 6, centerY + 4);
        ctx.quadraticCurveTo(tailX, tailY, tailX - 4 + tailSwish * 2, tailY + 4);
        ctx.stroke();
    }
    
    renderPaws(ctx, centerX, centerY) {
        // Simple walking animation with tiny paw prints
        const walkOffset = Math.sin(this.walkCycle) * 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        
        // Front paws
        ctx.beginPath();
        ctx.arc(centerX - 4 + walkOffset, centerY + 8, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + 4 - walkOffset, centerY + 8, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Cat scripting system
class CatScript {
    constructor() {
        this.commands = [];
        this.currentCommand = 0;
        this.isRunning = false;
        this.commandDelay = 0.5; // Time between commands
        this.commandTimer = 0;
        // Single collision-based behavior - the only mode available
        this.educationalBehaviors = {
            'collision_smart': {
                name: "Smart Collision Cat",
                description: "Reverses when hitting buildings, turns left when hitting player blocks.",
                script: ['move right'], // Will be handled by collision logic
                difficulty: 1,
                isCollisionBased: true
            }
        };
        
        this.currentBehavior = 'collision_smart';
        this.defaultScript = this.educationalBehaviors[this.currentBehavior].script;
        this.loadScript(this.defaultScript);
    }
    
    loadScript(scriptArray) {
        this.commands = [...scriptArray];
        this.currentCommand = 0;
        this.commandTimer = 0;
    }
    
    start() {
        this.isRunning = true;
        this.currentCommand = 0;
        this.commandTimer = 0;
        console.log("Cat script started");
    }
    
    stop() {
        this.isRunning = false;
        console.log("Cat script stopped");
    }
    
    reset() {
        this.currentCommand = 0;
        this.commandTimer = 0;
        this.isRunning = false;
        console.log("Cat script reset");
    }
    
    setBehavior(behaviorKey) {
        if (this.educationalBehaviors[behaviorKey]) {
            this.currentBehavior = behaviorKey;
            this.loadScript(this.educationalBehaviors[behaviorKey].script);
            console.log(`Cat behavior set to: ${this.educationalBehaviors[behaviorKey].name}`);
            return true;
        }
        return false;
    }
    
    getCurrentBehaviorInfo() {
        return this.educationalBehaviors[this.currentBehavior];
    }
    
    getBehaviorsByDifficulty(difficulty) {
        const behaviors = [];
        for (const key in this.educationalBehaviors) {
            if (this.educationalBehaviors[key].difficulty === difficulty) {
                behaviors.push({ key, ...this.educationalBehaviors[key] });
            }
        }
        return behaviors;
    }
    
    getRandomBehavior(difficulty = null) {
        let availableBehaviors;
        if (difficulty) {
            availableBehaviors = this.getBehaviorsByDifficulty(difficulty);
        } else {
            availableBehaviors = Object.keys(this.educationalBehaviors).map(key => 
                ({ key, ...this.educationalBehaviors[key] }));
        }
        
        if (availableBehaviors.length > 0) {
            const randomBehavior = availableBehaviors[Math.floor(Math.random() * availableBehaviors.length)];
            return randomBehavior.key;
        }
        return 'simple_right'; // fallback
    }
    
    update(deltaTime, cat) {
        if (!this.isRunning || this.commands.length === 0) {
            return;
        }
        
        this.commandTimer += deltaTime;
        
        if (this.commandTimer >= this.commandDelay) {
            // For collision-based behavior, continuously move in current direction
            if (this.educationalBehaviors[this.currentBehavior]?.isCollisionBased) {
                this.executeDirectionBasedMovement(cat);
            } else {
                this.executeCurrentCommand(cat);
                this.currentCommand = (this.currentCommand + 1) % this.commands.length;
            }
            this.commandTimer = 0;
        }
    }
    
    executeCurrentCommand(cat) {
        if (this.currentCommand >= this.commands.length) return;
        
        const command = this.commands[this.currentCommand].toLowerCase().trim();
        console.log(`Executing command: ${command}`);
        
        if (command.startsWith('move ')) {
            const direction = command.substring(5);
            this.moveCommand(cat, direction);
        } else if (command === 'wait') {
            // Do nothing for one cycle
        }
    }
    
    executeDirectionBasedMovement(cat) {
        // Move based on cat's current direction
        let deltaX = 0, deltaY = 0;
        let directionName = '';
        
        switch (cat.direction) {
            case 0: // up
                deltaY = -1;
                directionName = 'up';
                break;
            case 1: // right
                deltaX = 1;
                directionName = 'right';
                break;
            case 2: // down
                deltaY = 1;
                directionName = 'down';
                break;
            case 3: // left
                deltaX = -1;
                directionName = 'left';
                break;
        }
        
        console.log(`Cat moving ${directionName} from position (${cat.gridX}, ${cat.gridY})`);
        
        if (deltaX !== 0 || deltaY !== 0) {
            const success = cat.tryMoveTowards(deltaX, deltaY);
            console.log(`Move result: ${success}, new position: (${cat.gridX}, ${cat.gridY})`);
        }
    }
    
    moveCommand(cat, direction) {
        let deltaX = 0, deltaY = 0;
        
        console.log(`Moving cat ${direction} from position (${cat.gridX}, ${cat.gridY})`);
        
        switch (direction) {
            case 'up':
                deltaY = -1;
                cat.direction = 0;
                break;
            case 'right':
                deltaX = 1;
                cat.direction = 1;
                break;
            case 'down':
                deltaY = 1;
                cat.direction = 2;
                break;
            case 'left':
                deltaX = -1;
                cat.direction = 3;
                break;
        }
        
        if (deltaX !== 0 || deltaY !== 0) {
            const success = cat.tryMoveTowards(deltaX, deltaY);
            console.log(`Move result: ${success}, new position: (${cat.gridX}, ${cat.gridY})`);
        }
    }
}

// Cat manager to handle multiple cats
class CatManager {
    constructor() {
        this.cats = [];
        this.maxCats = 1; // One cat that follows the player
        this.spawnTimer = 0;
        this.spawnDelay = 1.0; // Spawn quickly at start
        this.hasSpawned = false;
        this.script = new CatScript();
    }
    
    update(deltaTime) {
        // Update existing cats
        for (let cat of this.cats) {
            // Disable the old AI behavior
            cat.isFollower = false;
            
            // Only keep cat idle if script is not running
            if (!this.script.isRunning) {
                cat.isIdle = true; // Keep cat idle when script is not running
            } else {
                cat.isIdle = false; // Allow movement when script is running
            }
            
            // Update script (this will move the cat)
            this.script.update(deltaTime, cat);
            
            // Update cat for animation and other logic
            cat.update(deltaTime);
        }
        
        // Spawn a cat if we don't have one yet
        if (!this.hasSpawned && this.cats.length === 0) {
            this.spawnScriptedCat();
            this.hasSpawned = true;
        }
    }
    
    runScript() {
        // Use existing cat if available, otherwise spawn one
        if (this.cats.length === 0) {
            this.spawnScriptedCat();
        } else {
            // Configure the existing cat for scripted movement
            const cat = this.cats[0];
            cat.isFollower = false;
            cat.isIdle = true;
            // Reset to starting position
            cat.gridX = 4;
            cat.gridY = 4;
            const worldPos = gridSystem.gridToWorld(cat.gridX, cat.gridY);
            cat.pos.x = worldPos.x + 6;
            cat.pos.y = worldPos.y + 6;
            console.log(`Using existing cat at (${cat.gridX}, ${cat.gridY})`);
        }
        this.script.start();
    }
    
    stopScript() {
        this.script.stop();
    }
    
    resetScript() {
        this.script.reset();
        // Reset cat to starting position
        if (this.cats.length > 0) {
            const cat = this.cats[0];
            cat.gridX = 4; // Starting position
            cat.gridY = 4;
            const worldPos = gridSystem.gridToWorld(cat.gridX, cat.gridY);
            cat.pos.x = worldPos.x + 6;
            cat.pos.y = worldPos.y + 6;
        }
    }
    
    getScriptStatus() {
        if (this.cats.length === 0) {
            return {
                hasScript: false,
                isRunning: false,
                currentCommand: '',
                progress: '',
                commands: []
            };
        }
        
        return {
            hasScript: this.script.commands.length > 0,
            isRunning: this.script.isRunning,
            currentCommand: this.script.commands[this.script.currentCommand] || '',
            progress: `${this.script.currentCommand + 1}/${this.script.commands.length}`,
            commands: this.script.commands,
            timeUntilNext: Math.max(0, this.script.commandDelay - this.script.commandTimer).toFixed(1)
        };
    }
    
    findValidSpawnPosition(preferredX, preferredY) {
        // Check if preferred position is valid (not inside a building)
        if (this.isPositionValid(preferredX, preferredY)) {
            return { x: preferredX, y: preferredY };
        }
        
        // If preferred position is invalid, search for nearby valid positions
        const searchRadius = 5;
        for (let radius = 1; radius <= searchRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const testX = preferredX + dx;
                        const testY = preferredY + dy;
                        
                        if (testX >= 0 && testX < gridSystem.worldWidth && 
                            testY >= 0 && testY < gridSystem.worldHeight &&
                            this.isPositionValid(testX, testY)) {
                            return { x: testX, y: testY };
                        }
                    }
                }
            }
        }
        
        // If no valid position found nearby, find any valid position on the map
        for (let y = 0; y < gridSystem.worldHeight; y++) {
            for (let x = 0; x < gridSystem.worldWidth; x++) {
                if (this.isPositionValid(x, y)) {
                    return { x, y };
                }
            }
        }
        
        // Fallback to preferred position even if invalid
        console.warn("No valid spawn position found, using preferred position anyway");
        return { x: preferredX, y: preferredY };
    }
    
    isPositionValid(gridX, gridY) {
        // Check if position is blocked by buildings or other solid objects
        if (typeof blockades === 'undefined') return true;
        
        for (let blockade of blockades) {
            if (blockade.type === 'building' || blockade.type === 'smokestack' || blockade.type === 'platform') {
                if (gridX >= blockade.gridX && gridX < blockade.gridX + blockade.gridWidth &&
                    gridY >= blockade.gridY && gridY < blockade.gridY + blockade.gridHeight) {
                    return false; // Position is inside a solid building
                }
            }
        }
        return true; // Position is valid
    }
    
    spawnScriptedCat() {
        // Use educational mode starting position if available
        let preferredX = 4; // Default starting position
        let preferredY = 4;
        
        if (typeof gameState !== 'undefined' && gameState.isEducationalMode) {
            preferredX = gameState.catStartPosition.gridX;
            preferredY = gameState.catStartPosition.gridY;
        }
        
        // Find a valid spawn position (not inside buildings)
        const validPos = this.findValidSpawnPosition(preferredX, preferredY);
        const spawnX = validPos.x;
        const spawnY = validPos.y;
        
        // Choose a nice cat color
        const colors = ['#FF6B35', '#8B4513', '#FFA500']; // Orange, brown, golden
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const cat = new Cat(spawnX, spawnY, color);
        cat.isFollower = false; // Not a follower, uses script
        cat.isIdle = true; // Start idle
        this.cats.push(cat);
        console.log(`Spawned scripted cat at (${spawnX}, ${spawnY})`);
    }
    
    trySpawnCat() {
        // Legacy method - not used anymore
        this.spawnScriptedCat();
    }
    
    render(ctx) {
        for (let cat of this.cats) {
            cat.render(ctx);
        }
    }
    
    clearCats() {
        this.cats = [];
        this.spawnTimer = 0;
        this.hasSpawned = false;
    }
    
    // Remove cats that might be stuck or too old
    cleanup() {
        // Remove cats that haven't moved in a very long time (optional)
        this.cats = this.cats.filter(cat => {
            // Could add logic here to remove stuck cats
            return true;
        });
    }
    
    setBehavior(behaviorKey) {
        return this.script.setBehavior(behaviorKey);
    }
    
    getCurrentBehaviorInfo() {
        return this.script.getCurrentBehaviorInfo();
    }
    
    setRandomBehavior(difficulty = null) {
        const behaviorKey = this.script.getRandomBehavior(difficulty);
        return this.setBehavior(behaviorKey);
    }
    
    getBehaviorsByDifficulty(difficulty) {
        return this.script.getBehaviorsByDifficulty(difficulty);
    }
    
    startEducationalLevel() {
        // Reset cat to starting position (find valid position)
        if (this.cats.length > 0) {
            const cat = this.cats[0];
            if (typeof gameState !== 'undefined' && gameState.isEducationalMode) {
                const preferredX = gameState.catStartPosition.gridX;
                const preferredY = gameState.catStartPosition.gridY;
                const validPos = this.findValidSpawnPosition(preferredX, preferredY);
                
                cat.gridX = validPos.x;
                cat.gridY = validPos.y;
                const worldPos = gridSystem.gridToWorld(cat.gridX, cat.gridY);
                cat.pos.x = worldPos.x + 6;
                cat.pos.y = worldPos.y + 6;
                
                console.log(`Cat repositioned to valid spawn at (${validPos.x}, ${validPos.y})`);
            }
        }
        
        // Reset game state
        if (typeof gameState !== 'undefined') {
            gameState.levelComplete = false;
            gameState.gameOver = false;
            gameState.gameOverReason = "";
            goalPosition.reached = false;
        }
        
        // Start the script
        this.script.start();
        console.log("Educational level started");
    }
}

// Global cat manager
let catManager = new CatManager();
