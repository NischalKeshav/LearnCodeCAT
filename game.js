function Vector2(x, y) {
    return { x: x || 0, y: y || 0 };
}

let canvas, ctx;

// Goal position (home) where the cat needs to return
let goalPosition = {
    gridX: 2,
    gridY: 2,
    pos: Vector2(64, 64), // Will be updated based on grid position
    radius: 25,
    color: '#00FF00', // Green for goal
    pulseTimer: 0,
    pulseSpeed: 1.5,
    reached: false
};

// Game state for educational mode
let gameState = {
    isEducationalMode: true,
    levelComplete: false,
    gameOver: false,
    gameOverReason: "",
    catStartPosition: { gridX: 45, gridY: 45 }, // Bottom right corner
    instructions: "Place blocks to help the cat reach home!",
    catBehavior: "The cat moves right until it hits a wall, then turns around."
};

// Physics constants
const gravity = 0.8;
const friction = 0.85;

let keys = {};

function normalizeVector(vector) {
    const x = vector.x;
    const y = vector.y;
  
    const magnitude = Math.sqrt(x * x + y * y);
  
  
    if (magnitude === 0) {
      return { x: 0, y: 0 }; 
    }
  
    return {
      x: x / magnitude,
      y: y / magnitude
    };
  }
  
  // Example usage:
  const myVector = { x: 3, y: 4 };
  const normalizedVector = normalizeVector(myVector);
  console.log(normalizedVector); // Output: { x: 0.6, y: 0.8 } (approximately)




function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1200; // Increased width for side panel
    canvas.height = 600;
    
    // Initialize UI manager with canvas reference
    uiManager = new UIManager();
    uiManager.init(canvas);
    
    // Add event listeners for game controls (only when playing)
    document.addEventListener('keydown', (e) => {
        if (uiManager && uiManager.isPlaying()) {
            keys[e.code] = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (uiManager && uiManager.isPlaying()) {
            keys[e.code] = false;
        }
    });
    
    // Load the first level
    levelManager.loadLevel(1);
    
    // Start game loop
    gameLoop();
}


// Player functionality removed - using cat system instead

// Update game state
function update(deltaTime) {
    // Only update game logic when playing
    if (!uiManager || !uiManager.isPlaying()) {
        return;
    }

    // Update camera to center of map instead of following player
    // Force camera to work even if updateCamera fails
    if (isNaN(gridSystem.camera.x) || isNaN(gridSystem.camera.y)) {
        gridSystem.camera.x = 0;
        gridSystem.camera.y = 0;
    }
    
    // Center camera on the middle of the world
    const worldCenterX = (gridSystem.worldWidth * gridSystem.tileSize) / 2;
    const worldCenterY = (gridSystem.worldHeight * gridSystem.tileSize) / 2;
    gridSystem.updateCamera(worldCenterX, worldCenterY);
    
    // Ensure camera values are valid
    if (isNaN(gridSystem.camera.x)) gridSystem.camera.x = 0;
    if (isNaN(gridSystem.camera.y)) gridSystem.camera.y = 0;
    
    // Update goal position
    const goalWorldPos = gridSystem.gridToWorld(goalPosition.gridX, goalPosition.gridY);
    goalPosition.pos.x = goalWorldPos.x + 16; // Center in grid cell
    goalPosition.pos.y = goalWorldPos.y + 16;
    goalPosition.pulseTimer += deltaTime;
    
    // Update cats
    catManager.update(deltaTime);
    
    // Check if cat reached goal or went off screen
    if (catManager.cats.length > 0 && !gameState.levelComplete && !gameState.gameOver) {
        const cat = catManager.cats[0];
        const catGrid = { x: cat.gridX, y: cat.gridY };
        const goalGrid = { x: goalPosition.gridX, y: goalPosition.gridY };
        
        // Check if cat went off screen (out of bounds)
        if (catGrid.x < 0 || catGrid.x >= gridSystem.worldWidth || 
            catGrid.y < 0 || catGrid.y >= gridSystem.worldHeight) {
            gameState.gameOver = true;
            gameState.gameOverReason = "Cat went off the screen!";
            catManager.script.stop(); // Stop the cat's movement
            console.log("Game Over! Cat went off screen at:", catGrid.x, catGrid.y);
        }
        // Check if cat reached goal
        else if (catGrid.x === goalGrid.x && catGrid.y === goalGrid.y) {
            gameState.levelComplete = true;
            goalPosition.reached = true;
            catManager.script.stop(); // Stop the cat's movement
            console.log("Level Complete! Cat reached home!");
        }
    }
    
}

// Player movement functionality removed - using cat system instead




function render() {
    // Always render UI first (handles background for menu/level select)
    if (uiManager) {
        uiManager.render(ctx);
    }
    
    // Only render game elements when playing
    if (uiManager && uiManager.isPlaying()) {
        // Save context for camera transformation
        ctx.save();
        
        // Clip to game area only (left 800px)
        ctx.beginPath();
        ctx.rect(0, 0, 800, canvas.height);
        ctx.clip();
        
        // Render cityscape skybox (world-space)
        renderCityscape(ctx);
        
        // Apply camera transformation
        ctx.translate(-gridSystem.camera.x, -gridSystem.camera.y);
        
        // Draw blockades using camera-relative positioning
        renderBlockades(ctx);
        
        // Draw grid for debugging (optional)
        gridSystem.renderGrid(ctx);
        
        // Draw cats
        catManager.render(ctx);
        
        // Draw goal position (home)
        renderGoalPosition(ctx);
        
        // Restore context (back to screen space)
        ctx.restore();
        
        // Render game UI overlay after game elements (screen-space)
        if (uiManager) {
            uiManager.render(ctx);
        }
        
        // Render game status overlay (Game Done/Game Over)
        renderGameStatusOverlay(ctx);
    }
}

// Game timing
let lastTime = 0;

// Main game loop
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    update(deltaTime);
    render();
    requestAnimationFrame(gameLoop);
}

// Cityscape background rendering
function renderCityscape(ctx) {
    const currentLevel = levelManager.getCurrentLevel();
    const theme = currentLevel.theme;
    const skyColor = currentLevel.skyColor || '#222';
    
    // Create gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    if (theme === 'futuristic') {
        // Night sky with stars
        skyGradient.addColorStop(0, '#000033');
        skyGradient.addColorStop(1, skyColor);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2);
            ctx.fillRect(x, y, 2, 2);
        }
    } else if (theme === 'industrial') {
        // Smoggy sky
        skyGradient.addColorStop(0, '#8B7D6B');
        skyGradient.addColorStop(1, skyColor);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme === 'residential') {
        // Sunset sky
        skyGradient.addColorStop(0, '#FF6B6B');
        skyGradient.addColorStop(0.3, '#FFE66D');
        skyGradient.addColorStop(1, skyColor);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Default sky (downtown/corporate)
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, skyColor);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some clouds for day themes
        if (theme !== 'futuristic' && theme !== 'industrial') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            // Simple cloud shapes
            ctx.beginPath();
            ctx.arc(150, 80, 30, 0, Math.PI * 2);
            ctx.arc(180, 80, 40, 0, Math.PI * 2);
            ctx.arc(210, 80, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(450, 60, 25, 0, Math.PI * 2);
            ctx.arc(475, 60, 35, 0, Math.PI * 2);
            ctx.arc(500, 60, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Add distant cityscape silhouette
    renderDistantCityscape(ctx, theme);
}

function renderDistantCityscape(ctx, theme) {
    // Create distant buildings silhouette
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    
    const distantBuildings = [
        { x: -50, width: 60, height: 150 },
        { x: 20, width: 40, height: 120 },
        { x: 70, width: 80, height: 180 },
        { x: 160, width: 50, height: 140 },
        { x: 220, width: 70, height: 200 },
        { x: 300, width: 90, height: 160 },
        { x: 400, width: 60, height: 190 },
        { x: 470, width: 100, height: 170 },
        { x: 580, width: 80, height: 150 },
        { x: 670, width: 60, height: 130 },
        { x: 740, width: 90, height: 160 }
    ];
    
    distantBuildings.forEach(building => {
        const y = canvas.height - building.height - 100; // Position in background
        ctx.fillRect(building.x, y, building.width, building.height);
    });
    
    // Add atmospheric perspective
    ctx.fillStyle = theme === 'futuristic' ? 'rgba(25, 25, 112, 0.2)' : 
                   theme === 'industrial' ? 'rgba(139, 125, 107, 0.2)' :
                   'rgba(135, 206, 235, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 200);
}

// Render the goal position (home) where cat needs to return
function renderGoalPosition(ctx) {
    // Check visibility
    const isVisible = gridSystem.isVisible(goalPosition.pos.x - goalPosition.radius, 
                                          goalPosition.pos.y - goalPosition.radius, 
                                          goalPosition.radius * 2, 
                                          goalPosition.radius * 2);
    
    if (!isVisible) return;
    
    // Pulsing effect
    const pulseScale = 1 + Math.sin(goalPosition.pulseTimer * goalPosition.pulseSpeed) * 0.3;
    const currentRadius = goalPosition.radius * pulseScale;
    
    // Change appearance if goal is reached
    const baseColor = goalPosition.reached ? '#FFD700' : goalPosition.color; // Gold when reached
    const borderColor = goalPosition.reached ? '#FFA500' : '#FFFFFF';
    
    // Main circle (home base)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(goalPosition.pos.x, goalPosition.pos.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(goalPosition.pos.x, goalPosition.pos.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Home icon (house shape)
    ctx.fillStyle = '#FFFFFF';
    const houseSize = currentRadius * 0.6;
    
    // House base
    ctx.fillRect(goalPosition.pos.x - houseSize/2, goalPosition.pos.y - houseSize/4, 
                 houseSize, houseSize/2);
    
    // House roof (triangle)
    ctx.beginPath();
    ctx.moveTo(goalPosition.pos.x - houseSize/2, goalPosition.pos.y - houseSize/4);
    ctx.lineTo(goalPosition.pos.x, goalPosition.pos.y - houseSize/2);
    ctx.lineTo(goalPosition.pos.x + houseSize/2, goalPosition.pos.y - houseSize/4);
    ctx.closePath();
    ctx.fill();
    
    // Door
    ctx.fillStyle = baseColor;
    const doorWidth = houseSize * 0.2;
    const doorHeight = houseSize * 0.3;
    ctx.fillRect(goalPosition.pos.x - doorWidth/2, goalPosition.pos.y - doorHeight/2, 
                 doorWidth, doorHeight);
}

// Render game status overlay (Game Done/Game Over)
function renderGameStatusOverlay(ctx) {
    if (!gameState.levelComplete && !gameState.gameOver) {
        return; // No overlay needed
    }
    
    // Semi-transparent dark overlay over the entire game area
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 800, canvas.height); // Only cover game area, not side panel
    
    // Prepare text settings
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = 400; // Center of game area
    const centerY = canvas.height / 2;
    
    if (gameState.levelComplete) {
        // "Game Done" message
        ctx.fillStyle = '#00ff00'; // Bright green
        ctx.font = 'bold 48px Arial';
        ctx.fillText('GAME DONE!', centerX, centerY - 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🎉 The cat made it home! 🎉', centerX, centerY + 20);
        
        ctx.font = '18px Arial';
        ctx.fillText('Great job placing the blocks!', centerX, centerY + 50);
        
        // "More levels coming" message
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🚀 More levels coming soon! 🚀', centerX, centerY + 85);
        
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '16px Arial';
        ctx.fillText('Stay tuned for more programming challenges!', centerX, centerY + 110);
        
    } else if (gameState.gameOver) {
        // "Game Over" message
        ctx.fillStyle = '#ff0000'; // Bright red
        ctx.font = 'bold 48px Arial';
        ctx.fillText('GAME OVER', centerX, centerY - 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(gameState.gameOverReason || 'Try again!', centerX, centerY + 10);
        
        ctx.font = '16px Arial';
        ctx.fillText('Use "Reset Level" to try again', centerX, centerY + 40);
    }
    
    ctx.restore();
}

// Start when page loads
window.onload = init;
