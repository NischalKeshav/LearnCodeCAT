// Blockade object class - physical objects that players can collide with and jump on
class Blockade {
    constructor(x, y, width = 80, height = 40, color = '#D2691E') {
        this.pos = Vector2(x, y);
        this.width = width;
        this.height = height;
        this.color = color;
        this.solid = true; // Can be collided with
    }

    // Check collision
    checkCollision(other) {
        return this.pos.x < other.pos.x + other.width &&
               this.pos.x + this.width > other.pos.x &&
               this.pos.y < other.pos.y + other.height &&
               this.pos.y + this.height > other.pos.y;
    }

    // Get collision side
    getCollisionSide(other) {
        const overlapLeft = (other.pos.x + other.width) - this.pos.x;
        const overlapRight = (this.pos.x + this.width) - other.pos.x;
        const overlapTop = (other.pos.y + other.height) - this.pos.y;
        const overlapBottom = (this.pos.y + this.height) - other.pos.y;

     
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) return 'top';
        if (minOverlap === overlapBottom) return 'bottom';
        if (minOverlap === overlapLeft) return 'left';
        if (minOverlap === overlapRight) return 'right';
    }

    // Resolve collision with player (disabled - no player character)
    resolveCollision(player) {
        // Player collision resolution removed - using cat system instead
        return;
    }

    // Render the blockade as a city building
    render(ctx) {
        const type = this.type || 'building';
        
        if (type === 'building') {
            this.renderBuilding(ctx);
        } else if (type === 'platform') {
            this.renderPlatform(ctx);
        } else if (type === 'special') {
            this.renderSpecial(ctx);
        } else if (type === 'ground') {
            this.renderGround(ctx);
        } else if (type === 'park') {
            this.renderPark(ctx);
        } else if (type === 'plaza') {
            this.renderPlaza(ctx);
        } else if (type === 'smokestack') {
            this.renderSmokestack(ctx);
        } else if (type === 'hologram') {
            this.renderHologram(ctx);
        } else {
            this.renderBuilding(ctx); // Default to building
        }
    }

    renderPark(ctx) {
        // Green park area
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Park border
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Trees (circles)
        ctx.fillStyle = '#228B22';
        const treeCount = Math.floor((this.width * this.height) / 2000);
        for (let i = 0; i < treeCount; i++) {
            const x = this.pos.x + Math.random() * (this.width - 16) + 8;
            const y = this.pos.y + Math.random() * (this.height - 16) + 8;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderPlaza(ctx) {
        // Corporate plaza
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Decorative pattern
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 2;
        
        // Diamond pattern
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        const size = Math.min(this.width, this.height) * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size / 2);
        ctx.lineTo(centerX + size / 2, centerY);
        ctx.lineTo(centerX, centerY + size / 2);
        ctx.lineTo(centerX - size / 2, centerY);
        ctx.closePath();
        ctx.stroke();
    }

    renderSmokestack(ctx) {
        // Industrial smokestack
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Smokestack outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Smoke effect (simple circles)
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        for (let i = 0; i < 3; i++) {
            const x = this.pos.x + this.width / 2 + (Math.random() - 0.5) * 20;
            const y = this.pos.y - 10 - (i * 8);
            const radius = 4 + i * 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHologram(ctx) {
        // Holographic display
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Glowing border
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Inner glow effect
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.fillRect(this.pos.x + 2, this.pos.y + 2, this.width - 4, this.height - 4);
        
        // Holographic scanlines
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let y = this.pos.y; y < this.pos.y + this.height; y += 4) {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, y);
            ctx.lineTo(this.pos.x + this.width, y);
            ctx.stroke();
        }
    }

    renderBuilding(ctx) {
        // Main building body (top-down view)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Building outline
        ctx.strokeStyle = this.getDarkerColor(this.color);
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Top-down building details
        this.addTopDownDetails(ctx);
        
        // Add building-specific features
        if (this.theme === 'futuristic') {
            this.addFuturisticTopDown(ctx);
        } else if (this.theme === 'industrial') {
            this.addIndustrialTopDown(ctx);
        } else {
            this.addModernTopDown(ctx);
        }
    }

    addTopDownDetails(ctx) {
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        
        // Building sections/floors (top-down view)
        if (this.width > 64 && this.height > 64) {
            ctx.strokeStyle = this.getDarkerColor(this.color);
            ctx.lineWidth = 1;
            
            // Divide building into sections
            const sectionsX = Math.floor(this.width / 32);
            const sectionsY = Math.floor(this.height / 32);
            
            for (let i = 1; i < sectionsX; i++) {
                const x = this.pos.x + (i * 32);
                ctx.beginPath();
                ctx.moveTo(x, this.pos.y + 4);
                ctx.lineTo(x, this.pos.y + this.height - 4);
                ctx.stroke();
            }
            
            for (let i = 1; i < sectionsY; i++) {
                const y = this.pos.y + (i * 32);
                ctx.beginPath();
                ctx.moveTo(this.pos.x + 4, y);
                ctx.lineTo(this.pos.x + this.width - 4, y);
                ctx.stroke();
            }
        }
        
        // Central feature (elevator shaft, atrium, etc.)
        if (this.width > 96 && this.height > 96) {
            const featureSize = Math.min(this.width * 0.3, this.height * 0.3);
            ctx.fillStyle = this.getDarkerColor(this.color);
            ctx.fillRect(
                centerX - featureSize / 2,
                centerY - featureSize / 2,
                featureSize,
                featureSize
            );
        }
    }

    renderPlatform(ctx) {
        // Futuristic floating platform
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Glowing edge effect
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Inner glow
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(this.pos.x + 2, this.pos.y + 2, this.width - 4, this.height - 4);
    }

    renderSpecial(ctx) {
        // Golden goal building/platform
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Sparkly golden border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Inner shine effect
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(this.pos.x + 3, this.pos.y + 3, this.width - 6, this.height - 6);
        
        // Add sparkle effects
        ctx.fillStyle = '#FFFFFF';
        const sparkles = 3;
        for (let i = 0; i < sparkles; i++) {
            const sx = this.pos.x + (this.width / (sparkles + 1)) * (i + 1);
            const sy = this.pos.y + this.height / 2;
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
        }
    }

    renderGround(ctx) {
        // Street/ground surface (top-down view)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Street grid pattern
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        
        // Draw street grid
        const gridSize = 32;
        for (let x = this.pos.x; x <= this.pos.x + this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, this.pos.y);
            ctx.lineTo(x, this.pos.y + this.height);
            ctx.stroke();
        }
        
        for (let y = this.pos.y; y <= this.pos.y + this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, y);
            ctx.lineTo(this.pos.x + this.width, y);
            ctx.stroke();
        }
        
        // Add some road markings
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        
        // Horizontal road lines
        for (let y = this.pos.y + 16; y < this.pos.y + this.height; y += 64) {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, y);
            ctx.lineTo(this.pos.x + this.width, y);
            ctx.stroke();
        }
        
        // Vertical road lines  
        for (let x = this.pos.x + 16; x < this.pos.x + this.width; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, this.pos.y);
            ctx.lineTo(x, this.pos.y + this.height);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset dash pattern
    }

    addModernTopDown(ctx) {
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        
        // Main entrance (darker rectangle at bottom)
        if (this.height > 64) {
            ctx.fillStyle = this.getDarkerColor(this.color);
            const entranceWidth = Math.min(this.width * 0.4, 32);
            ctx.fillRect(
                centerX - entranceWidth / 2,
                this.pos.y + this.height - 8,
                entranceWidth,
                8
            );
        }
        
        // Office windows pattern
        if (this.width > 96 && this.height > 96) {
            ctx.fillStyle = '#FFFF99';
            const windowSize = 4;
            const spacing = 12;
            
            for (let x = this.pos.x + spacing; x < this.pos.x + this.width - windowSize; x += spacing) {
                for (let y = this.pos.y + spacing; y < this.pos.y + this.height - windowSize; y += spacing) {
                    ctx.fillRect(x, y, windowSize, windowSize);
                }
            }
        }
    }

    addFuturisticTopDown(ctx) {
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        
        // Neon border glow effect
        ctx.strokeStyle = '#00CED1';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.pos.x + 2, this.pos.y + 2, this.width - 4, this.height - 4);
        
        // Central holographic display
        if (this.width > 128 && this.height > 128) {
            const holoSize = Math.min(this.width * 0.4, this.height * 0.4);
            ctx.fillStyle = 'rgba(0, 206, 209, 0.3)';
            ctx.fillRect(
                centerX - holoSize / 2,
                centerY - holoSize / 2,
                holoSize,
                holoSize
            );
            
            // Holographic grid
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 1;
            const gridSpacing = holoSize / 4;
            for (let i = 1; i < 4; i++) {
                const x = centerX - holoSize / 2 + i * gridSpacing;
                const y = centerY - holoSize / 2 + i * gridSpacing;
                
                ctx.beginPath();
                ctx.moveTo(x, centerY - holoSize / 2);
                ctx.lineTo(x, centerY + holoSize / 2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(centerX - holoSize / 2, y);
                ctx.lineTo(centerX + holoSize / 2, y);
                ctx.stroke();
            }
        }
    }

    addIndustrialTopDown(ctx) {
        // Industrial machinery and equipment (top-down view)
        if (this.width > 128 && this.height > 128) {
            // Large machinery in center
            const machineSize = Math.min(this.width * 0.6, this.height * 0.6);
            const centerX = this.pos.x + this.width / 2;
            const centerY = this.pos.y + this.height / 2;
            
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(
                centerX - machineSize / 2,
                centerY - machineSize / 2,
                machineSize,
                machineSize
            );
            
            // Conveyor belts
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.pos.x, centerY);
            ctx.lineTo(this.pos.x + this.width, centerY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, this.pos.y);
            ctx.lineTo(centerX, this.pos.y + this.height);
            ctx.stroke();
        }
        
        // Pipes and ducts
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 3;
        
        // Corner pipes
        ctx.beginPath();
        ctx.moveTo(this.pos.x + 8, this.pos.y + 8);
        ctx.lineTo(this.pos.x + this.width - 8, this.pos.y + 8);
        ctx.lineTo(this.pos.x + this.width - 8, this.pos.y + this.height - 8);
        ctx.stroke();
    }

    addRooftopDetails(ctx) {
        // Add rooftop elements
        if (this.width > 50 && this.height > 80) {
            // Rooftop structure
            ctx.fillStyle = this.getDarkerColor(this.color);
            const roofWidth = Math.min(15, this.width / 4);
            const roofX = this.pos.x + (this.width - roofWidth) / 2;
            ctx.fillRect(roofX, this.pos.y - 8, roofWidth, 10);
        }
    }

    getDarkerColor(color) {
        // Simple function to get a darker version of a color
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            const darkerR = Math.max(0, r - 40);
            const darkerG = Math.max(0, g - 40);
            const darkerB = Math.max(0, b - 40);
            
            return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
        }
        return '#000000'; // Default to black
    }
}

// Array to hold all blockades in the game
let blockades = [];

// Function to create and add a blockade
function createBlockade(x, y, width, height, color) {
    const blockade = new Blockade(x, y, width, height, color);
    blockades.push(blockade);
    console.log(`Created blockade at (${x}, ${y}) with size ${width}x${height}. Total blockades: ${blockades.length}`);
    return blockade;
}

// Function to check collisions between player and all blockades
function checkBlockadeCollisions(player) {
    for (let blockade of blockades) {
        blockade.resolveCollision(player);
    }
}

// Function to render all blockades
function renderBlockades(ctx) {
    // Debug: Log how many blockades we're trying to render
    if (blockades.length === 0) {
        console.log("No blockades found to render!");
    }
    
    for (let blockade of blockades) {
        blockade.render(ctx);
    }
}
