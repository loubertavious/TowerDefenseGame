class TowerDefenseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = {
            health: 100,
            money: 500,
            wave: 1,
            enemiesLeft: 0,
            gameRunning: false,
            paused: false,
            selectedTower: null,
            placingTower: false,
            mouseX: 0,
            mouseY: 0
        };
        
        // Dev menu state
        this.devMenuOpen = false;
        
        // Game objects
        this.tower = null; // Single tower
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        
        // Heal system
        this.healCost = 50;
        this.healAmount = 50;
        
            // Central base position
        this.base = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 30
        };
        
        // Tower base stats - Evil Eye
        this.towerStats = {
            damage: 25,
            range: 200,
            fireRate: 1200,
            bulletSpeed: 5,
            color: '#8B0000', // Dark red
            size: 15
        };
        
        // Upgrade categories and their effects - DOOM themed
        this.upgradeCategories = {
            damage: {
                name: "Hellfire",
                infinite: true,
                baseCost: 75,
                baseEffect: 10,
                costMultiplier: 1.5,
                effectMultiplier: 1.2
            },
            range: {
                name: "Vision",
                upgrades: [
                    { cost: 75, effect: 12, description: "+12 Vision Range" },
                    { cost: 150, effect: 15, description: "+15 Vision Range" },
                    { cost: 300, effect: 18, description: "+18 Vision Range" },
                    { cost: 600, effect: 22, description: "+22 Vision Range" },
                    { cost: 1200, effect: 28, description: "+28 Vision Range" }
                ]
            },
            fireRate: {
                name: "Fury",
                infinite: true,
                baseCost: 75,
                baseEffect: -75,
                costMultiplier: 1.5,
                effectMultiplier: 1.3
            },
            bulletSpeed: {
                name: "Velocity",
                infinite: true,
                baseCost: 100,
                baseEffect: 1,
                costMultiplier: 1.6,
                effectMultiplier: 1.1
            },
            multishot: {
                name: "Multishot",
                upgrades: [
                    { cost: 500, effect: 1, description: "+1 Satellite Eye" },
                    { cost: 1000, effect: 1, description: "+1 Satellite Eye" },
                    { cost: 2000, effect: 1, description: "+1 Satellite Eye" },
                    { cost: 4000, effect: 1, description: "+1 Satellite Eye" },
                    { cost: 8000, effect: 1, description: "+1 Satellite Eye" }
                ]
            }
        };
        
        // Track upgrade levels for each category
        this.upgradeLevels = {
            damage: 0,
            range: 0,
            fireRate: 0,
            bulletSpeed: 0,
            multishot: 0
        };
        
        this.init();
    }
    
    init() {
        // Create initial tower
        this.tower = new Tower(this.base.x, this.base.y, this.towerStats);
        
        // Ensure DOM is ready before setting up event listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.updateUI();
            });
        } else {
            this.setupEventListeners();
            this.updateUI();
        }
        
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Use event delegation for upgrade buttons to handle dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.closest('.upgrade-category')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.upgrade-category');
                const category = button.dataset.category;
                console.log('Upgrade button clicked via delegation:', category);
                this.upgradeCategory(category);
            }
        });
        
        // Game controls
        const startWaveBtn = document.getElementById('start-wave');
        const pauseBtn = document.getElementById('pause-game');
        const healBtn = document.getElementById('heal-base');
        
        if (startWaveBtn) {
            startWaveBtn.addEventListener('click', () => {
                this.startWave();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        if (healBtn) {
            healBtn.addEventListener('click', () => {
                this.heal();
            });
        }
        
        // Dev menu keyboard listener
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
                this.toggleDevMenu();
            }
            
            // Dev menu commands (only when dev menu is open)
            if (this.devMenuOpen) {
                switch(e.key) {
                    case '1':
                        this.devAddMoney(1000);
                        break;
                    case '2':
                        this.devAddMoney(10000);
                        break;
                    case '3':
                        this.devMaxUpgrades();
                        break;
                    case '4':
                        this.devSkipWave();
                        break;
                    case '5':
                        this.devKillAllEnemies();
                        break;
                    case '6':
                        this.gameState.health = 100;
                        this.updateUI();
                        console.log('Full heal!');
                        break;
                }
            }
        });
    }
    
    
    heal() {
        // Only allow healing between rounds (when no enemies are spawning)
        if (this.gameState.gameRunning) {
            console.log('Cannot heal during active combat!');
            return;
        }
        
        // Check if player has enough money
        if (this.gameState.money < this.healCost) {
            console.log('Not enough money for healing!');
            return;
        }
        
        // Check if health is already at maximum
        if (this.gameState.health >= 100) {
            console.log('Health is already at maximum!');
            return;
        }
        
        // Perform healing
        this.gameState.money -= this.healCost;
        this.gameState.health = Math.min(100, this.gameState.health + this.healAmount);
        
        console.log(`Healed for ${this.healAmount} health! Current health: ${this.gameState.health}`);
        this.updateUI();
    }
    
    toggleDevMenu() {
        this.devMenuOpen = !this.devMenuOpen;
        console.log('Dev menu toggled:', this.devMenuOpen);
    }
    
    devAddMoney(amount = 1000) {
        this.gameState.money += amount;
        this.updateUI();
        console.log(`Added $${amount}. Total money: $${this.gameState.money}`);
    }
    
    devMaxUpgrades() {
        // Max out all infinite upgrades
        this.upgradeLevels.damage = 50;
        this.upgradeLevels.fireRate = 50;
        this.upgradeLevels.bulletSpeed = 50;
        
        // Apply all upgrades
        for (let i = 0; i < 50; i++) {
            this.applyUpgrade('damage', 10);
            this.applyUpgrade('fireRate', -75);
            this.applyUpgrade('bulletSpeed', 1);
        }
        
        this.updateUI();
        console.log('Maxed out all infinite upgrades!');
    }
    
    devSkipWave() {
        this.gameState.wave++;
        this.gameState.money += 300;
        this.updateUI();
        console.log(`Skipped to wave ${this.gameState.wave}`);
    }
    
    devKillAllEnemies() {
        this.enemies = [];
        console.log('Killed all enemies');
    }
    
    upgradeCategory(category) {
        console.log('Upgrade clicked:', category); // Debug log
        
        const currentLevel = this.upgradeLevels[category];
        const categoryData = this.upgradeCategories[category];
        
        if (!categoryData) {
            console.error('Category not found:', category);
            return;
        }
        
        let upgradeCost, upgradeEffect, upgradeDescription;
        
        if (categoryData.infinite) {
            // Calculate cost and effect for infinite upgrades
            upgradeCost = Math.floor(categoryData.baseCost * Math.pow(categoryData.costMultiplier, currentLevel));
            upgradeEffect = Math.floor(categoryData.baseEffect * Math.pow(categoryData.effectMultiplier, currentLevel));
            
            // Create description based on category
            if (category === 'damage') {
                upgradeDescription = `+${upgradeEffect} Hellfire Damage`;
            } else if (category === 'fireRate') {
                upgradeDescription = `${upgradeEffect}ms Fury Speed`;
            } else if (category === 'bulletSpeed') {
                upgradeDescription = `+${upgradeEffect} Bullet Speed`;
            }
        } else {
            // Handle finite upgrades (Vision, Multishot)
            if (currentLevel < categoryData.upgrades.length) {
                const upgrade = categoryData.upgrades[currentLevel];
                upgradeCost = upgrade.cost;
                upgradeEffect = upgrade.effect;
                upgradeDescription = upgrade.description;
            } else {
                console.log('Max level reached for', category); // Debug log
                return;
            }
        }
        
        console.log('Current money:', this.gameState.money, 'Upgrade cost:', upgradeCost); // Debug log
        
        if (this.gameState.money >= upgradeCost) {
            this.gameState.money -= upgradeCost;
            this.upgradeLevels[category]++;
            
            console.log('Upgrade successful! New level:', this.upgradeLevels[category]); // Debug log
            
            // Apply the upgrade effect
            this.applyUpgrade(category, upgradeEffect);
            this.updateUI();
        } else {
            console.log('Not enough money for upgrade'); // Debug log
        }
    }
    
    applyUpgrade(category, effect) {
        switch(category) {
            case 'damage':
                this.towerStats.damage += effect;
                break;
            case 'range':
                this.towerStats.range += effect;
                break;
            case 'fireRate':
                this.towerStats.fireRate += effect; // effect is negative for fire rate
                break;
            case 'bulletSpeed':
                this.towerStats.bulletSpeed += effect;
                break;
            case 'multishot':
                // Multishot doesn't modify tower stats, just updates satellite eyes
                break;
        }
        
        // Update tower with new stats
        this.tower.updateStats(this.towerStats);
        
        // Update satellite eyes for multishot
        if (category === 'multishot') {
            this.tower.updateSatelliteEyes(this.upgradeLevels.multishot);
        }
    }
    
    
    startWave() {
        if (this.gameState.gameRunning) return;
        
        this.gameState.gameRunning = true;
        // Scale enemy count based on wave (more enemies each wave)
        const baseEnemies = 5;
        const additionalEnemies = Math.floor(this.gameState.wave * 1.0); // gentler spawn scaling
        this.gameState.enemiesLeft = baseEnemies + additionalEnemies;
        
        console.log(`Wave ${this.gameState.wave}: Spawning ${this.gameState.enemiesLeft} enemies`);
        
        // Spawn enemies
        this.spawnEnemies();
        
        document.getElementById('start-wave').disabled = true;
    }
    
    spawnEnemies() {
        const spawnInterval = setInterval(() => {
            if (this.gameState.enemiesLeft <= 0) {
                clearInterval(spawnInterval);
                return;
            }
            
            // Spawn enemies from random positions around the edge
            const spawnPos = this.getRandomSpawnPosition();
            const enemy = new Enemy(spawnPos.x, spawnPos.y, this.base, this.gameState.wave);
            this.enemies.push(enemy);
            this.gameState.enemiesLeft--;
            this.updateUI();
        }, 800); // Slightly faster spawning for single-point defense
    }
    
    getRandomSpawnPosition() {
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        
        switch(edge) {
            case 0: // Top edge
                x = Math.random() * this.canvas.width;
                y = 0;
                break;
            case 1: // Right edge
                x = this.canvas.width;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom edge
                x = Math.random() * this.canvas.width;
                y = this.canvas.height;
                break;
            case 3: // Left edge
                x = 0;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        return { x, y };
    }
    
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        document.getElementById('pause-game').textContent = 
            this.gameState.paused ? 'Resume' : 'Pause';
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.gameState.health;
        document.getElementById('money').textContent = '$' + this.gameState.money;
        document.getElementById('wave').textContent = this.gameState.wave;
        document.getElementById('enemies-left').textContent = this.gameState.enemiesLeft;
        
        // Update heal button state
        const healBtn = document.getElementById('heal-base');
        if (healBtn) {
            const canHeal = !this.gameState.gameRunning && 
                           this.gameState.money >= this.healCost && 
                           this.gameState.health < 100;
            
            healBtn.disabled = !canHeal;
            
            if (this.gameState.health >= 100) {
                healBtn.textContent = 'Health Full';
                healBtn.title = 'Health is already at maximum';
            } else if (this.gameState.gameRunning) {
                healBtn.textContent = 'Heal Base ($50)';
                healBtn.title = 'Cannot heal during active combat';
            } else if (this.gameState.money < this.healCost) {
                healBtn.textContent = 'Heal Base ($50)';
                healBtn.title = `Need $${this.healCost} to heal`;
            } else {
                healBtn.textContent = 'Heal Base ($50)';
                healBtn.title = `Heal for ${this.healAmount} health`;
            }
        }
        
        // Update upgrade buttons with detailed info and prices
        Object.keys(this.upgradeCategories).forEach(category => {
            const button = document.getElementById(`upgrade-${category}`);
            const currentLevel = this.upgradeLevels[category];
            const categoryData = this.upgradeCategories[category];
            
            if (categoryData.infinite) {
                // Handle infinite upgrades
                const upgradeCost = Math.floor(categoryData.baseCost * Math.pow(categoryData.costMultiplier, currentLevel));
                const upgradeEffect = Math.floor(categoryData.baseEffect * Math.pow(categoryData.effectMultiplier, currentLevel));
                
                let upgradeDescription;
                if (category === 'damage') {
                    upgradeDescription = `+${upgradeEffect} Hellfire Damage`;
                } else if (category === 'fireRate') {
                    upgradeDescription = `${upgradeEffect}ms Fury Speed`;
                } else if (category === 'bulletSpeed') {
                    upgradeDescription = `+${upgradeEffect} Bullet Speed`;
                }
                
                const levelText = currentLevel > 0 ? ` (Lv.${currentLevel + 1})` : '';
                button.innerHTML = `
                    <div class="upgrade-button-content">
                        <div class="upgrade-name">${categoryData.name}${levelText}</div>
                        <div class="upgrade-price">$${upgradeCost}</div>
                    </div>
                `;
                button.setAttribute('data-tooltip', `${upgradeDescription} - Cost: $${upgradeCost}`);
                button.disabled = this.gameState.money < upgradeCost;
            } else if (currentLevel < categoryData.upgrades.length) {
                const upgrade = categoryData.upgrades[currentLevel];
                const levelText = currentLevel > 0 ? ` (Lv.${currentLevel + 1})` : '';
                button.innerHTML = `
                    <div class="upgrade-button-content">
                        <div class="upgrade-name">${categoryData.name}${levelText}</div>
                        <div class="upgrade-price">$${upgrade.cost}</div>
                    </div>
                `;
                button.setAttribute('data-tooltip', `${upgrade.description} - Cost: $${upgrade.cost}`);
                button.disabled = this.gameState.money < upgrade.cost;
            } else {
                button.innerHTML = `
                    <div class="upgrade-button-content">
                        <div class="upgrade-name">${categoryData.name} (MAX)</div>
                        <div class="upgrade-price">MAX</div>
                    </div>
                `;
                button.setAttribute('data-tooltip', 'Maximum level reached');
                button.disabled = true;
            }
        });
    }
    
    gameLoop() {
        if (!this.gameState.paused) {
            this.update();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.reachedBase) {
                this.gameState.health -= enemy.damage;
                this.gameState.health = Math.max(0, this.gameState.health); // Prevent negative health
                this.enemies.splice(index, 1);
                this.updateUI(); // Update UI when health changes
                
                console.log(`Enemy reached base! Health: ${this.gameState.health}`);
                
                if (this.gameState.health <= 0) {
                    console.log('Game Over triggered!');
                    this.gameOver();
                }
            } else if (enemy.health <= 0) {
                this.gameState.money += enemy.reward;
                this.enemies.splice(index, 1);
                this.updateUI(); // Update UI when money changes
            }
        });
        
        // Update tower
        if (this.tower) {
            this.tower.update(this.enemies);
            // Always check for firing (main tower and satellite eyes have independent timing)
            const projectiles = this.tower.fire();
            if (projectiles) {
                this.projectiles.push(...projectiles);
            }
        }
        
        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            if (projectile.shouldRemove) {
                // Create explosion particles
                this.createExplosionParticles(projectile.x, projectile.y);
                this.projectiles.splice(index, 1);
            }
        });
        
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.shouldRemove) {
                this.particles.splice(index, 1);
            }
        });
        
        // Check if wave is complete
        if (this.gameState.gameRunning && this.enemies.length === 0 && this.gameState.enemiesLeft === 0) {
            this.waveComplete();
        }
        
        // Only update UI when stats change (not every frame)
        // this.updateUI(); // Removed from game loop
    }
    
    render() {
        // Clear canvas with dark hell background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.drawGrid();
        
        // Draw central base
        this.drawBase();
        
        // Draw tower
        if (this.tower) {
            this.tower.render(this.ctx, this.gameState.health);
        }
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        
        // Draw game over overlay
        if (this.gameState.health <= 0) {
            this.drawGameOverOverlay();
            // Ensure game is stopped
            this.gameState.gameRunning = false;
        }
        
        // Draw dev menu
        if (this.devMenuOpen) {
            this.drawDevMenu();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawBase() {
        // Draw base shadow
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(this.base.x + 3, this.base.y + 3, this.base.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Removed outer golden ring around base
        
        // Draw base main body (hell portal)
        this.ctx.fillStyle = '#2a0a0a';
        this.ctx.beginPath();
        this.ctx.arc(this.base.x, this.base.y, this.base.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw base outer ring (hellfire)
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.arc(this.base.x, this.base.y, this.base.radius - 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw base center (portal core)
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.arc(this.base.x, this.base.y, this.base.radius / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    
    drawGameOverOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FF4444';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Waves Survived: ${this.gameState.wave - 1}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.restore();
    }
    
    drawDevMenu() {
        this.ctx.save();
        
        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dev menu title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DEV MENU', this.canvas.width / 2, 100);
        
        // Instructions
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press ~ to close', this.canvas.width / 2, 130);
        
        // Dev commands
        const commands = [
            '1 - Add $1000',
            '2 - Add $10000', 
            '3 - Max All Upgrades',
            '4 - Skip Wave',
            '5 - Kill All Enemies',
            '6 - Full Heal'
        ];
        
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        
        commands.forEach((command, index) => {
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.fillText(command, 50, 200 + index * 30);
        });
        
        this.ctx.restore();
    }
    
    waveComplete() {
        this.gameState.gameRunning = false;
        this.gameState.wave++;
        this.gameState.money += 300; // Wave completion bonus
        document.getElementById('start-wave').disabled = false;
        this.updateUI(); // Update UI when wave and money change
    }
    
    createExplosionParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, '#FFD700'));
        }
    }
    
    gameOver() {
        console.log('Game Over! Final health:', this.gameState.health);
        this.gameState.gameRunning = false;
        this.gameState.health = 0; // Ensure health is exactly 0
        alert('Game Over! You survived ' + (this.gameState.wave - 1) + ' waves!');
        
        // Reset game
        this.gameState.health = 100;
        this.gameState.money = 500;
        this.gameState.wave = 1;
        
        // Reset tower stats and upgrades
        this.towerStats = {
            damage: 25,
            range: 100,
            fireRate: 1200,
            bulletSpeed: 5,
            color: '#8B0000',
            size: 20
        };
        
        this.upgradeLevels = {
            damage: 0,
            range: 0,
            fireRate: 0,
            bulletSpeed: 0,
            multishot: 0
        };
        
        this.tower = new Tower(this.base.x, this.base.y, this.towerStats);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        document.getElementById('start-wave').disabled = false;
    }
}

// Tower class
class Tower {
    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        this.data = data;
        this.lastFireTime = 0;
        this.shouldFire = false;
        this.target = null;
        this.satelliteEyes = [];
        this.rotation = 0; // current facing angle in radians
        this.turnSpeed = 0.15; // radians per update for smooth tracking
        
        // Load the Eye sprite
        this.eyeSprite = new Image();
        this.eyeSprite.src = 'assets/sprite/Eye.png';
        this.spriteLoaded = false;
        
        // Set up sprite load handler
        this.eyeSprite.onload = () => {
            this.spriteLoaded = true;
            console.log('Eye sprite loaded successfully from:', this.eyeSprite.src);
        };
        
        this.eyeSprite.onerror = () => {
            console.error('Failed to load Eye sprite from:', this.eyeSprite.src);
            console.error('Make sure the file exists at: assets/sprite/Eye.png');
            this.spriteLoaded = false;
        };
    }
    
    updateStats(newStats) {
        this.data = newStats;
    }
    
    updateSatelliteEyes(multishotLevel) {
        // Remove excess satellite eyes if level decreased
        while (this.satelliteEyes.length > multishotLevel) {
            this.satelliteEyes.pop();
        }
        
        // Add new satellite eyes if level increased
        while (this.satelliteEyes.length < multishotLevel) {
            const angle = (this.satelliteEyes.length * 2 * Math.PI) / 5; // Pentagram: 5 points
            const radius = 40; // Distance from main tower
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            this.satelliteEyes.push(new SmallEye(x, y, angle, this.data));
        }
        
        // Update positions for pentagram formation
        this.satelliteEyes.forEach((eye, index) => {
            const angle = (index * 2 * Math.PI) / 5; // Pentagram: 5 points
            const radius = 40; // Distance from main tower
            eye.x = this.x + Math.cos(angle) * radius;
            eye.y = this.y + Math.sin(angle) * radius;
        });
    }
    
    update(enemies) {
        this.shouldFire = false;
        
        // Find target
        this.target = this.findTarget(enemies);
        
        // Smoothly rotate to face target if present
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const desired = Math.atan2(dy, dx);
            // Shortest angular difference in [-PI, PI]
            let delta = desired - this.rotation;
            delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
            // Clamp rotation step for smooth turning
            if (delta > this.turnSpeed) delta = this.turnSpeed;
            if (delta < -this.turnSpeed) delta = -this.turnSpeed;
            this.rotation += delta;
        }
        
        if (this.target && Date.now() - this.lastFireTime >= this.data.fireRate) {
            this.shouldFire = true;
            this.lastFireTime = Date.now();
        }
        
        // Update satellite eyes
        this.satelliteEyes.forEach(eye => {
            eye.update(enemies, this.x, this.y);
        });
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.data.range;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
            if (distance <= this.data.range && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    fire() {
        const projectiles = [];
        
        // Main tower projectile
        if (this.target && this.shouldFire) {
            projectiles.push(new Projectile(this.x, this.y, this.target, this.data.damage, this.data.bulletSpeed));
        }
        
        // Satellite eye projectiles (always check, independent timing)
        this.satelliteEyes.forEach(eye => {
            if (eye.shouldFire) {
                const projectile = eye.fire();
                if (projectile) {
                    projectiles.push(projectile);
                }
            }
        });
        
        return projectiles.length > 0 ? projectiles : null;
    }
    
    render(ctx, health = 100) {
        // Draw evil eye shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, this.data.size + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw tower using sprite if loaded, otherwise fallback to placeholder
        if (this.spriteLoaded) {
            // Calculate sprite size based on tower size - make it bigger
            const spriteSize = this.data.size * 6; // Increased to 6x for bigger sprite 
            
            // Draw the Eye sprite rotated to face target
            ctx.save();
            ctx.imageSmoothingEnabled = false; // Pixelated rendering
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation - Math.PI / 2);
            ctx.drawImage(
                this.eyeSprite,
                -spriteSize/2,
                -spriteSize/2,
                spriteSize,
                spriteSize
            );
            ctx.restore();
        } else {
            // Fallback to placeholder circles while sprite loads
            this.renderPlaceholder(ctx);
        }
        
        // Draw circular health bar around the evil eye
        const healthPercent = health / 100;
        const healthBarRadius = this.data.size + 12; // Increased to accommodate larger sprite
        const healthBarThickness = 4;
        
        // Health bar background (dark ring)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = healthBarThickness;
        ctx.beginPath();
        ctx.arc(this.x, this.y, healthBarRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Health bar fill (colored arc) - red to dark orange
        const healthColor = healthPercent > 0.5 ? '#FF8C00' : healthPercent > 0.25 ? '#FF4500' : '#FF0000';
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = healthBarThickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, healthBarRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * healthPercent));
        ctx.stroke();
        
        // Draw range circle (always visible)
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Render satellite eyes
        this.satelliteEyes.forEach(eye => {
            eye.render(ctx);
        });
    }
    
    renderPlaceholder(ctx) {
        // Draw evil eye base (dark socket)
        ctx.fillStyle = '#2a0a0a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.size + 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw evil eye outer ring
        ctx.fillStyle = '#4a0a0a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.size + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw evil eye main body (blood red)
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw evil eye pupil (black center)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw evil eye iris (yellow/orange)
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.data.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw evil eye highlight (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - this.data.size/3, this.y - this.data.size/3, this.data.size/4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// SmallEye class for satellite eyes
class SmallEye {
    constructor(x, y, angle, towerData) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.towerData = towerData;
        this.rotation = 0;
        this.turnSpeed = 0.2;
        this.target = null;
        this.lastFireTime = 0;
        this.shouldFire = false;
        
        // Load the Eye sprite (same as main tower)
        this.eyeSprite = new Image();
        this.eyeSprite.src = 'assets/sprite/Eye.png';
        this.spriteLoaded = false;
        
        this.eyeSprite.onload = () => {
            this.spriteLoaded = true;
        };
        
        this.eyeSprite.onerror = () => {
            this.spriteLoaded = false;
        };
    }
    
    update(enemies, towerX, towerY) {
        this.shouldFire = false;
        
        // Find target
        this.target = this.findTarget(enemies);
        
        // Smoothly rotate to face target if present
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const desired = Math.atan2(dy, dx);
            let delta = desired - this.rotation;
            delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
            if (delta > this.turnSpeed) delta = this.turnSpeed;
            if (delta < -this.turnSpeed) delta = -this.turnSpeed;
            this.rotation += delta;
        }
        
        if (this.target && Date.now() - this.lastFireTime >= this.towerData.fireRate) {
            this.shouldFire = true;
            this.lastFireTime = Date.now();
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.towerData.range;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
            if (distance <= this.towerData.range && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    fire() {
        if (this.target) {
            return new SmallProjectile(this.x, this.y, this.target, this.towerData.damage * 0.5, this.towerData.bulletSpeed);
        }
        return null;
    }
    
    render(ctx) {
        if (this.spriteLoaded) {
            const spriteSize = this.towerData.size * 3; // Smaller than main tower
            
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation - Math.PI / 2);
            ctx.drawImage(
                this.eyeSprite,
                -spriteSize/2,
                -spriteSize/2,
                spriteSize,
                spriteSize
            );
            ctx.restore();
        } else {
            // Fallback placeholder
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.towerData.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, base, wave = 1) {
        this.x = x;
        this.y = y;
        this.base = base;
        this.wave = wave;
        
        // Scale stats based on wave - gentle early, brutal after wave 10
        let waveMultiplier, healthMultiplier;
        
        if (wave <= 10) {
            // Gentle scaling for early waves
            waveMultiplier = 1 + (wave - 1) * 0.08; // 8% increase per wave
            healthMultiplier = 1 + (wave - 1) * 0.1; // 10% health increase per wave
        } else {
            // Aggressive scaling after wave 10
            const earlyWaveBonus = 1 + 9 * 0.08; // Bonus from waves 1-10
            const lateWaveBonus = (wave - 10) * 0.25; // 25% increase per wave after 10
            waveMultiplier = earlyWaveBonus + lateWaveBonus;
            
            const earlyHealthBonus = 1 + 9 * 0.1; // Health bonus from waves 1-10
            const lateHealthBonus = (wave - 10) * 0.3; // 30% health increase per wave after 10
            healthMultiplier = earlyHealthBonus + lateHealthBonus;
        }
        
        this.speed = 0.8 * waveMultiplier; // Lower base speed
        this.health = Math.floor(50 * healthMultiplier); // Lower base health
        this.maxHealth = this.health;
        this.damage = Math.floor(12 * waveMultiplier); // Lower base damage
        this.reward = Math.floor(12 * waveMultiplier); // Lower base reward
        this.reachedBase = false;
        this.type = this.getRandomDemonType();
        
        console.log(`Wave ${wave} Enemy: Health=${this.health}, Damage=${this.damage}, Speed=${this.speed.toFixed(2)}, Reward=${this.reward}`);
    }
    
    getRandomDemonType() {
        const types = ['imp', 'cacodemon', 'pinky'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    update() {
        // Calculate direction to base
        const dx = this.base.x - this.x;
        const dy = this.base.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached base
        if (distance < this.base.radius + 5) {
            this.reachedBase = true;
            return;
        }
        
        // Move toward base
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }
    
    render(ctx) {
        // Draw demon shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw demon based on type
        switch(this.type) {
            case 'imp':
                this.renderImp(ctx);
                break;
            case 'cacodemon':
                this.renderCacodemon(ctx);
                break;
            case 'pinky':
                this.renderPinky(ctx);
                break;
        }
        
        // Draw health bar
        this.renderHealthBar(ctx);
    }
    
    adjustColorBrightness(hex, amount) {
        // Convert hex to RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Adjust brightness
        const newR = Math.min(255, Math.max(0, r + amount * 255));
        const newG = Math.min(255, Math.max(0, g + amount * 255));
        const newB = Math.min(255, Math.max(0, b + amount * 255));
        
        // Convert back to hex
        return `#${Math.floor(newR).toString(16).padStart(2, '0')}${Math.floor(newG).toString(16).padStart(2, '0')}${Math.floor(newB).toString(16).padStart(2, '0')}`;
    }
    
    renderImp(ctx) {
        // Imp body (brownish-red) - darker for higher waves
        const waveIntensity = Math.min(0.3, (this.wave - 1) * 0.05);
        const baseColor = '#8B4513';
        const waveColor = this.adjustColorBrightness(baseColor, waveIntensity);
        
        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 + (this.wave - 1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Imp head (darker)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, 6 + (this.wave - 1) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Imp eyes (red) - brighter for higher waves
        const eyeColor = this.adjustColorBrightness('#FF0000', waveIntensity);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 3, 1.5 + (this.wave - 1) * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y - 3, 1.5 + (this.wave - 1) * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderCacodemon(ctx) {
        // Cacodemon body (pinkish-red) - brighter for higher waves
        const waveIntensity = Math.min(0.3, (this.wave - 1) * 0.05);
        const baseColor = '#FF69B4';
        const waveColor = this.adjustColorBrightness(baseColor, waveIntensity);
        
        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10 + (this.wave - 1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Cacodemon mouth (dark)
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, 4 + (this.wave - 1) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cacodemon eye (yellow) - brighter for higher waves
        const eyeColor = this.adjustColorBrightness('#FFFF00', waveIntensity);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, 3 + (this.wave - 1) * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPinky(ctx) {
        // Pinky body (pink) - brighter for higher waves
        const waveIntensity = Math.min(0.3, (this.wave - 1) * 0.05);
        const baseColor = '#FF1493';
        const waveColor = this.adjustColorBrightness(baseColor, waveIntensity);
        
        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 9 + (this.wave - 1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pinky horns (dark) - larger for higher waves
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 5, 2 + (this.wave - 1) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y - 5, 2 + (this.wave - 1) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pinky eyes (red) - brighter for higher waves
        const eyeColor = this.adjustColorBrightness('#FF0000', waveIntensity);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 1, 1.5 + (this.wave - 1) * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y - 1, 1.5 + (this.wave - 1) * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderHealthBar(ctx) {
        const barWidth = 16;
        const barHeight = 3;
        const healthPercent = this.health / this.maxHealth;
        
        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - 15, barWidth, barHeight);
        
        // Health bar fill
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(this.x - barWidth/2, this.y - 15, barWidth * healthPercent, barHeight);
    }
}

// Projectile class
class Projectile {
    constructor(x, y, target, damage, speed = 5) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.shouldRemove = false;
        
        // Calculate direction
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Check collision with target
        const distance = Math.sqrt((this.x - this.target.x) ** 2 + (this.y - this.target.y) ** 2);
        if (distance < 10) {
            this.target.health -= this.damage;
            this.shouldRemove = true;
        }
        
        // Remove if out of bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Draw hellfire projectile trail
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        // Draw hellfire outer glow
        ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw hellfire core
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// SmallProjectile class for satellite eye bullets
class SmallProjectile {
    constructor(x, y, target, damage, speed = 5) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.shouldRemove = false;
        
        // Calculate direction
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Check collision with target
        const distance = Math.sqrt((this.x - this.target.x) ** 2 + (this.y - this.target.y) ** 2);
        if (distance < 10) {
            this.target.health -= this.damage;
            this.shouldRemove = true;
        }
        
        // Remove if out of bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Draw smaller hellfire projectile trail
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        // Draw smaller hellfire outer glow
        ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw smaller hellfire core
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
        this.shouldRemove = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
        
        if (this.life <= 0 || this.size <= 0.1) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new TowerDefenseGame();
});
