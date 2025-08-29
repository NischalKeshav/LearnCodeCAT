/*
    Minimal LittleJS Game for js13kGames
    - Simple block movement with arrow keys
    - No complex tiles or assets
    - Under 13KB when compressed
*/

'use strict';

// disable splash screen to save space
setShowSplashScreen(false);

// minimal sound
const sound_move = new Sound([0.5,.1]);

let player;

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // setup camera
    cameraPos = vec2(8,4.5);
    cameraScale = 64;

    // disable gravity for top-down movement
    gravity = 0;

    // create player block
    player = {
        pos: vec2(8, 4.5),
        size: vec2(0.8, 0.8),
        color: hsl(0.6, 1, 0.7),
        speed: 0.1
    };
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // handle arrow key movement
    let moved = false;
    
    if (keyIsDown('ArrowLeft') || keyIsDown('KeyA'))
    {
        player.pos.x -= player.speed;
        moved = true;
    }
    if (keyIsDown('ArrowRight') || keyIsDown('KeyD'))
    {
        player.pos.x += player.speed;
        moved = true;
    }
    if (keyIsDown('ArrowUp') || keyIsDown('KeyW'))
    {
        player.pos.y += player.speed;
        moved = true;
    }
    if (keyIsDown('ArrowDown') || keyIsDown('KeyS'))
    {
        player.pos.y -= player.speed;
        moved = true;
    }

    // play sound when moving and change color
    if (moved)
    {
        sound_move.play(player.pos);
        player.color = hsl(rand(), 1, 0.7);
    }

    // keep player within bounds
    player.pos.x = clamp(player.pos.x, 1, 15);
    player.pos.y = clamp(player.pos.y, 1, 8);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw simple background
    drawRect(vec2(8,4.5), vec2(16,9), hsl(0,0,.1), 0, false);
    
    // draw player block
    drawRect(player.pos, player.size, player.color, 0, false);
    
    // draw a subtle border around the player
    drawRect(player.pos, player.size.add(vec2(0.1,0.1)), hsl(0,0,1), 0, true);
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // simple title and instructions
    drawTextScreen('JS13K Demo', 
        vec2(mainCanvasSize.x/2, 50), 48,
        hsl(0,0,1), 3, hsl(0,0,0));
    
    drawTextScreen('Use Arrow Keys or WASD to Move', 
        vec2(mainCanvasSize.x/2, mainCanvasSize.y - 30), 24,
        hsl(0,0,0.8), 2, hsl(0,0,0));
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine - no textures needed!
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
