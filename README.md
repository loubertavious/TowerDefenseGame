# Multi-Upgrade Tower Defense Game

A fun and engaging 2D tower defense game built with HTML5 Canvas and JavaScript. Defend your central base with a single tower that can be upgraded in multiple different ways!

## How to Play

1. **Start the Game**: Open `index.html` in your web browser
2. **Choose Your Upgrades**: Select from 7 different upgrade categories to customize your tower
3. **Start Waves**: Click "Start Wave" to begin spawning enemies
4. **Defend**: Watch your tower automatically target and shoot enemies approaching from all sides
5. **Survive**: Prevent enemies from reaching your central base!

## Game Features

- **Single Customizable Tower**: One tower with multiple upgrade paths
- **7 Upgrade Categories**: Choose how to specialize your tower
- **Smart Targeting**: Tower automatically targets the closest enemy in range
- **Visual Effects**: Particle explosions, shadows, and smooth animations
- **Progressive Difficulty**: Each wave spawns more enemies
- **Resource Management**: Earn money by defeating enemies, spend strategically on upgrades
- **Health System**: Lose health when enemies reach your base
- **Pause Function**: Pause/resume the game at any time

## Upgrade Categories

### **Tower Upgrades** (5 levels each)
- **Damage** ($50-$800): Increase projectile damage by 15-50 points
- **Range** ($50-$800): Extend tower's targeting range by 20-50 pixels
- **Fire Rate** ($50-$800): Reduce firing delay by 100-300 milliseconds

## Controls

- **Upgrade Buttons**: Click any upgrade category to improve that specific stat
- **Tooltips**: Hover over upgrade buttons to see detailed information
- **Start Wave Button**: Begin spawning enemies
- **Pause Button**: Pause/resume the game

## Game Mechanics

- **Enemies**: Spawn from random edges and move directly toward your central base
- **Tower**: Automatically targets and shoots enemies within range
- **Money**: Earn money by defeating enemies, spend on strategic upgrades
- **Health**: Lose health when enemies reach your base (shown as shrinking base)
- **Waves**: Each wave increases the number of enemies spawned
- **Strategic Choices**: Balance different upgrade paths based on enemy patterns and available money

## Game Interface

- **Left Panel**: Game stats and controls
  - **Game Stats**: Health, money, wave, and enemy count
  - **Game Controls**: Start wave and pause buttons
- **Center**: Game canvas where the action happens
- **Right Panel**: Tower upgrades and shop
  - **Tower Shop**: Simple upgrade system with clear pricing
  - **Basic Stats**: Damage, range, and fire rate upgrades
  - **Clear Pricing**: All upgrade costs displayed prominently
- **Responsive Design**: Adapts to different screen sizes

## File Structure

- `index.html` - Main HTML file with game interface
- `style.css` - CSS styling for the game UI
- `game.js` - Complete game logic and classes

Enjoy defending your base!
