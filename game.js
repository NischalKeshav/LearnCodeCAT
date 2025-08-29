function Vector2(x, y) {
    return { x: x || 0, y: y || 0 };
}

let canvas, ctx;
let player = {
    pos: Vector2(300, 500),
    velocity: Vector2(0, 0),
    width: 40,
    height: 40,
    speed: 5,
    jumpPower: 15,
    onGround: false,
    color: '#4A90E2'
};

// Physics constants
const gravity = 0.8;
const friction = 0.85;

let keys = {};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Add event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Start game loop
    gameLoop();
}

// Jump function
function jump() {
    if (player.onGround) {
        player.velocity.y = -player.jumpPower;
        player.onGround = false;
        player.color = '#E2E24A'; // Yellow when jumping
    }
}

// Update game state
function update() {
    // Handle horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velocity.x = -player.speed;
        player.color = '#E24A4A'; // Red when moving left
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocity.x = player.speed;
        player.color = '#4AE24A'; // Green when moving right
    } else {
        // Apply friction to horizontal movement
        player.velocity.x *= friction;
    }
    
    // Handle jumping
    if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
        jump();
    }
    
    // Apply gravity
    player.velocity.y += gravity;
    
    // Update position with velocity
    player.pos.x += player.velocity.x;
    player.pos.y += player.velocity.y;
    
    // Ground collision (bottom of screen)
    const groundY = canvas.height - player.height;
    if (player.pos.y >= groundY) {
        player.pos.y = groundY;
        player.velocity.y = 0;
        player.onGround = true;
        
        // Reset to blue when on ground and not moving horizontally
        if (Math.abs(player.velocity.x) < 0.5) {
            player.color = '#4A90E2';
        }
    } else {
        player.onGround = false;
    }
    
    // Keep player in horizontal bounds
    player.pos.x = Math.max(0, Math.min(canvas.width - player.width, player.pos.x));
    
    // Ceiling collision
    if (player.pos.y < 0) {
        player.pos.y = 0;
        player.velocity.y = 0;
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player using vector position
    ctx.fillStyle = player.color;
    ctx.fillRect(player.pos.x, player.pos.y, player.width, player.height);
    
    // Draw border around player
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.pos.x, player.pos.y, player.width, player.height);
    
    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JS13K Canvas Demo', canvas.width / 2, 50);
    
    // Draw instructions
    ctx.font = '16px Arial';
    ctx.fillText('A/D or ← → to Move, Space/W/↑ to Jump', canvas.width / 2, canvas.height - 30);
    
    // Draw ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - player.height);
    ctx.lineTo(canvas.width, canvas.height - player.height);
    ctx.stroke();
}

// Main game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start when page loads
window.onload = init;
