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
        this.autoStartRounds = false;
        this.waveOverPopup = {
            show: false,
            timer: 0,
            duration: 2000 // 2 seconds
        };
        
        // Money bonus popup system
        this.moneyPopups = [];
        
        // Screen shake system
        this.screenShake = {
            intensity: 0,
            duration: 0,
            timer: 0,
            offsetX: 0,
            offsetY: 0
        };
        
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
            damage: 35,
            range: 200,
            fireRate: 800,
            bulletSpeed: 5,
            knockback: 0, // Knockback force
            bulletSize: 1, // Bullet size multiplier
            color: '#8B0000', // Dark red
            size: 15
        };
        
        // Upgrade categories and their effects - DOOM themed
        this.upgradeCategories = {
            damage: {
                name: "Hellfire",
                infinite: true,
                baseCost: 75,
                baseEffect: 8,
                costMultiplier: 1.6,
                effectMultiplier: 1.1
            },
            range: {
                name: "Vision",
                upgrades: [
                    { cost: 75, effect: 20, description: "+20 Vision Range" },
                    { cost: 150, effect: 25, description: "+25 Vision Range" },
                    { cost: 300, effect: 30, description: "+30 Vision Range" },
                    { cost: 600, effect: 35, description: "+35 Vision Range" },
                    { cost: 1200, effect: 40, description: "+40 Vision Range" },
                    { cost: 2400, effect: 45, description: "+45 Vision Range" },
                    { cost: 4800, effect: 50, description: "+50 Vision Range" },
                    { cost: 9600, effect: 60, description: "+60 Vision Range" },
                    { cost: 19200, effect: 80, description: "+80 Vision Range" },
                    { cost: 38400, effect: 110, description: "+110 Vision Range" }
                ]
            },
            fireRate: {
                name: "Fury",
                infinite: true,
                baseCost: 75,
                baseEffect: -50,
                costMultiplier: 1.6,
                effectMultiplier: 1.2
            },
            bulletSpeed: {
                name: "Velocity",
                infinite: true,
                baseCost: 100,
                baseEffect: 1,
                costMultiplier: 1.7,
                effectMultiplier: 1.05
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
            },
            knockback: {
                name: "Force",
                infinite: true,
                baseCost: 100,
                baseEffect: 2,
                costMultiplier: 1.8,
                effectMultiplier: 1.3
            },
            bulletSize: {
                name: "Magnitude",
                infinite: true,
                baseCost: 150,
                baseEffect: 0.3,
                costMultiplier: 2.0,
                effectMultiplier: 1.2
            }
        };
        
        // Track upgrade levels for each category
        this.upgradeLevels = {
            damage: 0,
            range: 0,
            fireRate: 0,
            bulletSpeed: 0,
            multishot: 0,
            knockback: 0,
            bulletSize: 0
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
        
        // Auto-start checkbox listener
        const autoStartCheckbox = document.getElementById('auto-start');
        if (autoStartCheckbox) {
            autoStartCheckbox.addEventListener('change', (e) => {
                this.autoStartRounds = e.target.checked;
            });
        }
        
        // Dev menu keyboard listener
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
                this.toggleDevMenu();
            }
            
            // Spacebar to start wave (only when not in dev menu)
            if (e.key === ' ' && !this.devMenuOpen) {
                e.preventDefault(); // Prevent page scroll
                this.startWave();
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
            } else if (category === 'knockback') {
                upgradeDescription = `+${upgradeEffect} Knockback Force`;
            } else if (category === 'bulletSize') {
                upgradeDescription = `+${upgradeEffect} Bullet Size`;
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
            case 'knockback':
                this.towerStats.knockback += effect;
                break;
            case 'bulletSize':
                this.towerStats.bulletSize += effect;
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
        let baseEnemies, additionalEnemies;
        
        if (this.gameState.wave <= 3) {
            // Easier early waves
            baseEnemies = 3;
            additionalEnemies = Math.floor((this.gameState.wave - 1) * 0.5); // Very gentle scaling
        } else if (this.gameState.wave <= 8) {
            // Moderate scaling starting from wave 4
            baseEnemies = 5;
            additionalEnemies = Math.floor((this.gameState.wave - 3) * 2.0); // Faster scaling
        } else {
            // Aggressive scaling for late game
            baseEnemies = 8;
            additionalEnemies = Math.floor((this.gameState.wave - 8) * 3.0) + 15; // Much faster scaling
        }
        
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
        document.getElementById('money').textContent = '$' + this.gameState.money;
        
        // Update start wave button text with wave number
        const startWaveBtn = document.getElementById('start-wave');
        if (startWaveBtn) {
            startWaveBtn.textContent = `Start Wave ${this.gameState.wave}`;
        }
        
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
                
                // Special handling for multishot naming
                let displayName = categoryData.name;
                if (category === 'multishot') {
                    const eyeNames = ['Binocular', 'Trinocular', 'Quadnocular', 'Pentnocular', 'Hexnocular'];
                    displayName = eyeNames[currentLevel] || `${categoryData.name} (Lv.${currentLevel + 1})`;
                } else {
                    const levelText = currentLevel > 0 ? ` (Lv.${currentLevel + 1})` : '';
                    displayName = `${categoryData.name}${levelText}`;
                }
                
                button.innerHTML = `
                    <div class="upgrade-button-content">
                        <div class="upgrade-name">${displayName}</div>
                        <div class="upgrade-price">$${upgrade.cost}</div>
                    </div>
                `;
                button.setAttribute('data-tooltip', `${upgrade.description} - Cost: $${upgrade.cost}`);
                button.disabled = this.gameState.money < upgrade.cost;
            } else {
                // Special handling for multishot MAX naming
                let maxDisplayName = categoryData.name;
                if (category === 'multishot') {
                    maxDisplayName = 'Hexnocular (MAX)';
                } else {
                    maxDisplayName = `${categoryData.name} (MAX)`;
                }
                
                button.innerHTML = `
                    <div class="upgrade-button-content">
                        <div class="upgrade-name">${maxDisplayName}</div>
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
        // Update wave over popup timer
        if (this.waveOverPopup.show) {
            this.waveOverPopup.timer += 16; // Approximate frame time (60fps)
            if (this.waveOverPopup.timer >= this.waveOverPopup.duration) {
                this.waveOverPopup.show = false;
            }
        }
        
        // Update money popups
        this.moneyPopups.forEach((popup, index) => {
            popup.timer += 16;
            popup.y += popup.velocityY;
            
            // Calculate fade out
            const fadeStart = popup.duration * 0.7; // Start fading at 70% of duration
            if (popup.timer > fadeStart) {
                const fadeProgress = (popup.timer - fadeStart) / (popup.duration - fadeStart);
                popup.alpha = Math.max(0, 1 - fadeProgress);
            }
            
            // Remove expired popups
            if (popup.timer >= popup.duration) {
                this.moneyPopups.splice(index, 1);
            }
        });
        
        // Update screen shake
        this.updateScreenShake();
        
        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.reachedBase) {
                this.gameState.health -= enemy.damage;
                this.gameState.health = Math.max(0, this.gameState.health); // Prevent negative health
                this.enemies.splice(index, 1);
                this.updateUI(); // Update UI when health changes
                
                // Screen shake for taking damage
                this.addScreenShake(10, 200);
                
                console.log(`Enemy reached base! Health: ${this.gameState.health}`);
                
                if (this.gameState.health <= 0) {
                    console.log('Game Over triggered!');
                    this.gameOver();
                }
            } else if (enemy.health <= 0) {
                this.gameState.money += enemy.reward;
                this.enemies.splice(index, 1);
                this.updateUI(); // Update UI when money changes
                
                // Create money popup for enemy kill
                this.createEnemyKillPopup(enemy.reward, enemy.x, enemy.y);
                
                // Screen shake for enemy death
                this.addScreenShake(6, 150);
            }
        });
        
        // Update tower
        if (this.tower) {
            this.tower.update(this.enemies);
            // Always check for firing (main tower and satellite eyes have independent timing)
            const projectiles = this.tower.fire();
            if (projectiles) {
                this.projectiles.push(...projectiles);
                
                // Screen shake for tower firing
                this.addScreenShake(4, 80);
            }
        }
        
        // Update projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(this); // Pass game instance for screen shake
            if (projectile.shouldRemove) {
                // Create explosion particles with projectile color
                this.createExplosionParticles(projectile.x, projectile.y, projectile.color);
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
        // Apply screen shake offset
        this.ctx.save();
        this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
        
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
        
        // Draw wave over popup
        if (this.waveOverPopup.show) {
            this.drawWaveOverPopup();
        }
        
        // Draw money popups
        this.moneyPopups.forEach((popup, index) => {
            this.drawMoneyPopup(popup);
        });
        
        // Draw dev menu
        if (this.devMenuOpen) {
            this.drawDevMenu();
        }
        
        // Restore context (undo screen shake transform)
        this.ctx.restore();
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
        this.ctx.fillText('DEV MENU', this.canvas.width / 2, 80);
        
        // Game Stats section
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('GAME STATS:', 50, 120);
        
        // Stats display
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fillText(`Health: ${this.gameState.health}`, 70, 145);
        this.ctx.fillText(`Wave: ${this.gameState.wave}`, 70, 165);
        this.ctx.fillText(`Enemies Left: ${this.gameState.enemiesLeft}`, 70, 185);
        this.ctx.fillText(`Money: $${this.gameState.money}`, 70, 205);
        
        // Instructions
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press ~ to close', this.canvas.width / 2, 240);
        
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
            this.ctx.fillText(command, 50, 280 + index * 30);
        });
        
        this.ctx.restore();
    }
    
    drawWaveOverPopup() {
        this.ctx.save();
        
        // Calculate fade effect based on timer
        const fadeInTime = 300; // 300ms fade in
        const fadeOutTime = 500; // 500ms fade out
        const holdTime = this.waveOverPopup.duration - fadeInTime - fadeOutTime;
        
        let alpha = 1;
        if (this.waveOverPopup.timer < fadeInTime) {
            // Fade in
            alpha = this.waveOverPopup.timer / fadeInTime;
        } else if (this.waveOverPopup.timer > fadeInTime + holdTime) {
            // Fade out
            alpha = 1 - ((this.waveOverPopup.timer - fadeInTime - holdTime) / fadeOutTime);
        }
        
        this.ctx.globalAlpha = alpha;
        
        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw "WAVE OVER" text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 64px Cinzel, serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Text shadow for depth
        this.ctx.shadowColor = '#8B0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        
        this.ctx.fillText('WAVE OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        // Draw wave number below
        this.ctx.font = 'bold 32px Cinzel, serif';
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillText(`Wave ${this.gameState.wave - 1} Complete`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        this.ctx.restore();
    }
    
    drawMoneyPopup(popup) {
        this.ctx.save();
        this.ctx.globalAlpha = popup.alpha;
        
        // Use dynamic font size
        const fontSize = popup.fontSize || 24; // Fallback to 24px if not set
        
        // Draw text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = `bold ${fontSize}px Cinzel, serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`+$${popup.amount}`, popup.x + 2, popup.y + 2);
        
        // Draw main text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `bold ${fontSize}px Cinzel, serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`+$${popup.amount}`, popup.x, popup.y);
        
        this.ctx.restore();
    }
    
    // Screen shake methods
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        this.screenShake.timer = 0;
    }
    
    updateScreenShake() {
        if (this.screenShake.timer < this.screenShake.duration) {
            this.screenShake.timer += 16; // Approximate frame time (60fps)
            
            // Calculate shake intensity (fades out over time)
            const progress = this.screenShake.timer / this.screenShake.duration;
            const currentIntensity = this.screenShake.intensity * (1 - progress);
            
            // Generate random shake offset
            this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity;
            this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity;
        } else {
            // Reset shake when done
            this.screenShake.intensity = 0;
            this.screenShake.duration = 0;
            this.screenShake.timer = 0;
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
        }
    }
    
    waveComplete() {
        this.gameState.gameRunning = false;
        this.gameState.wave++;
        
        // Calculate wave completion bonus with exponential scaling
        const baseBonus = 150;
        const waveBonus = Math.floor(baseBonus * Math.pow(1.2, this.gameState.wave - 1));
        
        this.gameState.money += waveBonus;
        document.getElementById('start-wave').disabled = false;
        this.updateUI(); // Update UI when wave and money change
        
        // Create money bonus popup
        this.createMoneyPopup(waveBonus);
        
        // Show wave over popup
        this.waveOverPopup.show = true;
        this.waveOverPopup.timer = 0;
        
        // Screen shake for wave completion
        this.addScreenShake(15, 500);
        
        // Auto-start next wave if enabled
        if (this.autoStartRounds) {
            setTimeout(() => {
                this.startWave();
            }, 1000); // 1 second delay before auto-starting
        }
    }
    
    createExplosionParticles(x, y, color = '#FFD700') {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    createMoneyPopup(amount) {
        console.log('Creating money popup for amount:', amount);
        
        // Use a fixed position within the canvas instead of trying to position relative to UI elements
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Position popup in the upper-right area of the canvas (near where money display would be)
        const baseX = canvasWidth - 150; // Right side of canvas
        const baseY = 150; // Lower on screen for better visibility
        
        // Add random offset around this base position
        const offsetX = (Math.random() - 0.5) * 100; // ±50px horizontal
        const offsetY = (Math.random() - 0.5) * 60;  // ±30px vertical
        
        const popup = {
            x: baseX + offsetX,
            y: baseY + offsetY,
            amount: amount,
            timer: 0,
            duration: 3000, // 3 seconds - longer visibility
            velocityY: -0.5, // Slower upward movement
            alpha: 1.0,
            fontSize: this.calculateFontSize(amount) // Dynamic font size based on amount
        };
        
        this.moneyPopups.push(popup);
    }
    
    calculateFontSize(amount) {
        // Base font size for small amounts
        let baseSize = 20;
        
        if (amount >= 1000) {
            // Large amounts (wave completion bonuses)
            baseSize = 28 + Math.min(12, Math.floor(amount / 500)); // 28-40px
        } else if (amount >= 100) {
            // Medium amounts
            baseSize = 24 + Math.min(4, Math.floor(amount / 100)); // 24-28px
        } else {
            // Small amounts (enemy kills)
            baseSize = 18 + Math.min(6, Math.floor(amount / 10)); // 18-24px
        }
        
        return Math.min(48, baseSize); // Cap at 48px
    }
    
    createEnemyKillPopup(amount, enemyX, enemyY) {
        // Position popup at enemy location with some offset
        const offsetX = (Math.random() - 0.5) * 40; // ±20px horizontal
        const offsetY = (Math.random() - 0.5) * 40; // ±20px vertical
        
        this.moneyPopups.push({
            x: enemyX + offsetX,
            y: enemyY + offsetY,
            amount: amount,
            timer: 0,
            duration: 2000, // 2 seconds for enemy kills
            velocityY: -0.8, // Slightly faster than wave completion
            alpha: 1.0,
            fontSize: this.calculateFontSize(amount) // Dynamic font size based on amount
        });
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
            damage: 35,
            range: 100,
            fireRate: 800,
            bulletSpeed: 5,
            knockback: 0,
            bulletSize: 1,
            color: '#8B0000',
            size: 20
        };
        
        this.upgradeLevels = {
            damage: 0,
            range: 0,
            fireRate: 0,
            bulletSpeed: 0,
            multishot: 0,
            knockback: 0,
            bulletSize: 0
        };
        
        this.tower = new Tower(this.base.x, this.base.y, this.towerStats);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.moneyPopups = []; // Clear money popups on reset
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
        // Preserve the original size to prevent tower from growing
        const originalSize = this.data.size;
        this.data = {...newStats};
        this.data.size = originalSize;
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
            
            // Check if we're close enough to target to start firing (within 30 degrees)
            const angleDifference = Math.abs(delta);
            const canFire = angleDifference < Math.PI / 6; // 30 degrees
            
            // Clamp rotation step for smooth turning
            if (delta > this.turnSpeed) delta = this.turnSpeed;
            if (delta < -this.turnSpeed) delta = -this.turnSpeed;
            this.rotation += delta;
            
            // Fire if close enough to target and cooldown is ready
            if (canFire && Date.now() - this.lastFireTime >= this.data.fireRate) {
                this.shouldFire = true;
                this.lastFireTime = Date.now();
            }
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
            // Calculate accuracy based on how well aimed we are
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const desired = Math.atan2(dy, dx);
            let delta = desired - this.rotation;
            delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
            const angleDifference = Math.abs(delta);
            
            // Accuracy decreases as angle difference increases
            // Perfect aim (0 degrees) = 1.0 accuracy, 30 degrees = 0.5 accuracy, 60+ degrees = 0.1 accuracy
            const accuracy = Math.max(0.1, 1.0 - (angleDifference / (Math.PI / 3)));
            
            projectiles.push(new Projectile(this.x, this.y, this.target, this.data.damage, this.data.bulletSpeed, accuracy, this.data));
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
            
            // Check if we're close enough to target to start firing (within 30 degrees)
            const angleDifference = Math.abs(delta);
            const canFire = angleDifference < Math.PI / 6; // 30 degrees
            
            if (delta > this.turnSpeed) delta = this.turnSpeed;
            if (delta < -this.turnSpeed) delta = -this.turnSpeed;
            this.rotation += delta;
            
            // Fire if close enough to target and cooldown is ready
            if (canFire && Date.now() - this.lastFireTime >= this.towerData.fireRate) {
                this.shouldFire = true;
                this.lastFireTime = Date.now();
            }
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
            // Calculate accuracy based on how well aimed we are
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const desired = Math.atan2(dy, dx);
            let delta = desired - this.rotation;
            delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
            const angleDifference = Math.abs(delta);
            
            // Accuracy decreases as angle difference increases
            const accuracy = Math.max(0.1, 1.0 - (angleDifference / (Math.PI / 3)));
            
            return new SmallProjectile(this.x, this.y, this.target, this.towerData.damage * 0.5, this.towerData.bulletSpeed, accuracy, this.towerData);
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
        
        // Scale stats based on wave - gentle early, aggressive after wave 4
        let waveMultiplier, healthMultiplier;
        
        if (wave <= 4) {
            // Gentle scaling for early waves
            waveMultiplier = 1 + (wave - 1) * 0.08; // 8% increase per wave
            healthMultiplier = 1 + (wave - 1) * 0.1; // 10% health increase per wave
        } else if (wave <= 10) {
            // Aggressive scaling starting from wave 5
            const earlyWaveBonus = 1 + 3 * 0.08; // Bonus from waves 1-4
            const midWaveBonus = (wave - 4) * 0.2; // 20% increase per wave starting wave 5
            waveMultiplier = earlyWaveBonus + midWaveBonus;
            
            const earlyHealthBonus = 1 + 3 * 0.1; // Health bonus from waves 1-4
            const midHealthBonus = (wave - 4) * 0.25; // 25% health increase per wave starting wave 5
            healthMultiplier = earlyHealthBonus + midHealthBonus;
        } else {
            // Brutal scaling after wave 10
            const earlyWaveBonus = 1 + 3 * 0.08; // Bonus from waves 1-4
            const midWaveBonus = 6 * 0.2; // Bonus from waves 5-10
            const lateWaveBonus = (wave - 10) * 0.35; // 35% increase per wave after 10
            waveMultiplier = earlyWaveBonus + midWaveBonus + lateWaveBonus;
            
            const earlyHealthBonus = 1 + 3 * 0.1; // Health bonus from waves 1-4
            const midHealthBonus = 6 * 0.25; // Health bonus from waves 5-10
            const lateHealthBonus = (wave - 10) * 0.45; // 45% health increase per wave after 10
            healthMultiplier = earlyHealthBonus + midHealthBonus + lateHealthBonus;
        }
        
        this.speed = 0.8 * waveMultiplier; // Lower base speed
        this.health = Math.floor(30 * healthMultiplier); // Reduced base health for easier early waves
        this.maxHealth = this.health;
        this.damage = Math.floor(8 * waveMultiplier); // Reduced base damage for less punishing hits
        this.reward = Math.floor(6 * waveMultiplier); // Reduced base reward for more challenging economy
        this.reachedBase = false;
        this.type = this.getRandomDemonType();
        
        // Knockback system
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDecay = 0.85; // How quickly knockback fades
        
        console.log(`Wave ${wave} Enemy: Health=${this.health}, Damage=${this.damage}, Speed=${this.speed.toFixed(2)}, Reward=${this.reward}`);
    }
    
    getRandomDemonType() {
        const types = ['imp', 'cacodemon', 'pinky'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    applyKnockback(knockbackForce, towerX, towerY) {
        // Calculate direction away from tower
        const dx = this.x - towerX;
        const dy = this.y - towerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction and apply knockback force
            this.knockbackX = (dx / distance) * knockbackForce;
            this.knockbackY = (dy / distance) * knockbackForce;
        }
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
        
        // Apply knockback movement
        this.x += this.knockbackX;
        this.y += this.knockbackY;
        
        // Decay knockback over time
        this.knockbackX *= this.knockbackDecay;
        this.knockbackY *= this.knockbackDecay;
        
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
    constructor(x, y, target, damage, speed = 5, accuracy = 1.0, towerData = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.accuracy = accuracy; // 1.0 = perfect accuracy, 0.0 = completely random
        this.towerData = towerData; // Store tower data for color calculation
        this.shouldRemove = false;
        this.hitsRemaining = 1; // Default: single hit
        
        // Calculate projectile color based on upgrades
        this.color = this.calculateProjectileColor();
        
        // Calculate bullet size and piercing capability
        this.size = this.calculateBulletSize();
        this.piercing = this.calculatePiercing();
        
        // Calculate direction with accuracy-based randomness
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add accuracy-based randomness to the direction
        const baseAngle = Math.atan2(dy, dx);
        const accuracySpread = (1 - accuracy) * Math.PI / 4; // Max 45 degrees spread at 0 accuracy
        const randomAngle = baseAngle + (Math.random() - 0.5) * accuracySpread;
        
        this.vx = Math.cos(randomAngle) * this.speed;
        this.vy = Math.sin(randomAngle) * this.speed;
    }
    
    calculateBulletSize() {
        if (!this.towerData) return 1;
        return Math.max(1, this.towerData.bulletSize);
    }
    
    calculatePiercing() {
        if (!this.towerData) return 1;
        // Larger bullets can pierce through more enemies
        return Math.max(1, Math.floor(this.towerData.bulletSize * 2));
    }
    
    calculateProjectileColor() {
        if (!this.towerData) return '#FF4500'; // Default orange
        
        // Base color (damage upgrade)
        let baseColor = '#FF4500'; // Orange for hellfire
        
        // Add colors based on upgrades
        let colorComponents = {
            r: 255, // Red component
            g: 69,  // Green component  
            b: 0    // Blue component
        };
        
        // Damage upgrade adds more red intensity
        if (this.towerData.damage > 35) {
            colorComponents.r = Math.min(255, 255 + (this.towerData.damage - 35) * 2);
        }
        
        // Range upgrade adds blue tint
        if (this.towerData.range > 200) {
            colorComponents.b = Math.min(255, (this.towerData.range - 200) * 3);
        }
        
        // Fire rate upgrade adds yellow tint
        if (this.towerData.fireRate < 800) {
            colorComponents.g = Math.min(255, 69 + (800 - this.towerData.fireRate) * 0.5);
        }
        
        // Bullet speed upgrade adds white intensity
        if (this.towerData.bulletSpeed > 5) {
            const speedBonus = (this.towerData.bulletSpeed - 5) * 20;
            colorComponents.r = Math.min(255, colorComponents.r + speedBonus);
            colorComponents.g = Math.min(255, colorComponents.g + speedBonus);
            colorComponents.b = Math.min(255, colorComponents.b + speedBonus);
        }
        
        // Knockback upgrade adds purple tint
        if (this.towerData.knockback > 0) {
            colorComponents.r = Math.min(255, colorComponents.r + this.towerData.knockback * 10);
            colorComponents.b = Math.min(255, colorComponents.b + this.towerData.knockback * 15);
        }
        
        return `rgb(${Math.floor(colorComponents.r)}, ${Math.floor(colorComponents.g)}, ${Math.floor(colorComponents.b)})`;
    }
    
    update(gameInstance = null) {
        this.x += this.vx;
        this.y += this.vy;
        
        // Check collision with all enemies for piercing
        if (gameInstance && gameInstance.enemies) {
            gameInstance.enemies.forEach((enemy, enemyIndex) => {
                const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
                const collisionRadius = 10 + (this.size - 1) * 5; // Larger bullets have bigger collision radius
                
                if (distance < collisionRadius && this.hitsRemaining > 0) {
                    enemy.health -= this.damage;
                    this.hitsRemaining--;
                    
                    // Apply knockback if game instance provided
                    if (gameInstance.tower && gameInstance.tower.data.knockback > 0) {
                        enemy.applyKnockback(gameInstance.tower.data.knockback, gameInstance.tower.x, gameInstance.tower.y);
                    }
                    
                    // Screen shake for projectile hit
                    if (gameInstance) {
                        gameInstance.addScreenShake(2, 50);
                    }
                    
                    // Remove projectile if no hits remaining
                    if (this.hitsRemaining <= 0) {
                        this.shouldRemove = true;
                    }
                }
            });
        }
        
        // Remove if out of bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Draw hellfire projectile trail with dynamic color
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.size; // Scale line width with bullet size
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        // Draw hellfire outer glow with dynamic color and size
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7 * this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw hellfire core with dynamic size
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3 * this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// SmallProjectile class for satellite eye bullets
class SmallProjectile {
    constructor(x, y, target, damage, speed = 5, accuracy = 1.0, towerData = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.accuracy = accuracy;
        this.towerData = towerData; // Store tower data for color calculation
        this.shouldRemove = false;
        this.hitsRemaining = 1; // Default: single hit
        
        // Calculate projectile color based on upgrades (smaller version)
        this.color = this.calculateSmallProjectileColor();
        
        // Calculate bullet size and piercing capability (smaller than main projectiles)
        this.size = this.calculateSmallBulletSize();
        this.piercing = this.calculateSmallPiercing();
        
        // Calculate direction with accuracy-based randomness
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add accuracy-based randomness to the direction
        const baseAngle = Math.atan2(dy, dx);
        const accuracySpread = (1 - accuracy) * Math.PI / 4; // Max 45 degrees spread at 0 accuracy
        const randomAngle = baseAngle + (Math.random() - 0.5) * accuracySpread;
        
        this.vx = Math.cos(randomAngle) * this.speed;
        this.vy = Math.sin(randomAngle) * this.speed;
    }
    
    calculateSmallBulletSize() {
        if (!this.towerData) return 0.7; // Smaller than main bullets
        return Math.max(0.7, this.towerData.bulletSize * 0.7);
    }
    
    calculateSmallPiercing() {
        if (!this.towerData) return 1;
        // Smaller bullets pierce less than main bullets
        return Math.max(1, Math.floor(this.towerData.bulletSize * 1.5));
    }
    
    calculateSmallProjectileColor() {
        if (!this.towerData) return '#FF4500'; // Default orange
        
        // Similar to main projectile but dimmer for satellite eyes
        let colorComponents = {
            r: 200, // Red component (dimmer)
            g: 50,  // Green component  
            b: 0    // Blue component
        };
        
        // Damage upgrade adds more red intensity
        if (this.towerData.damage > 35) {
            colorComponents.r = Math.min(255, 200 + (this.towerData.damage - 35) * 1.5);
        }
        
        // Range upgrade adds blue tint
        if (this.towerData.range > 200) {
            colorComponents.b = Math.min(255, (this.towerData.range - 200) * 2);
        }
        
        // Fire rate upgrade adds yellow tint
        if (this.towerData.fireRate < 800) {
            colorComponents.g = Math.min(255, 50 + (800 - this.towerData.fireRate) * 0.3);
        }
        
        // Bullet speed upgrade adds white intensity
        if (this.towerData.bulletSpeed > 5) {
            const speedBonus = (this.towerData.bulletSpeed - 5) * 15;
            colorComponents.r = Math.min(255, colorComponents.r + speedBonus);
            colorComponents.g = Math.min(255, colorComponents.g + speedBonus);
            colorComponents.b = Math.min(255, colorComponents.b + speedBonus);
        }
        
        // Knockback upgrade adds purple tint
        if (this.towerData.knockback > 0) {
            colorComponents.r = Math.min(255, colorComponents.r + this.towerData.knockback * 8);
            colorComponents.b = Math.min(255, colorComponents.b + this.towerData.knockback * 12);
        }
        
        return `rgb(${Math.floor(colorComponents.r)}, ${Math.floor(colorComponents.g)}, ${Math.floor(colorComponents.b)})`;
    }
    
    update(gameInstance = null) {
        this.x += this.vx;
        this.y += this.vy;
        
        // Check collision with all enemies for piercing
        if (gameInstance && gameInstance.enemies) {
            gameInstance.enemies.forEach((enemy, enemyIndex) => {
                const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
                const collisionRadius = 10 + (this.size - 1) * 5; // Larger bullets have bigger collision radius
                
                if (distance < collisionRadius && this.hitsRemaining > 0) {
                    enemy.health -= this.damage;
                    this.hitsRemaining--;
                    
                    // Apply knockback if game instance provided
                    if (gameInstance.tower && gameInstance.tower.data.knockback > 0) {
                        enemy.applyKnockback(gameInstance.tower.data.knockback, gameInstance.tower.x, gameInstance.tower.y);
                    }
                    
                    // Screen shake for projectile hit
                    if (gameInstance) {
                        gameInstance.addScreenShake(2, 50);
                    }
                    
                    // Remove projectile if no hits remaining
                    if (this.hitsRemaining <= 0) {
                        this.shouldRemove = true;
                    }
                }
            });
        }
        
        // Remove if out of bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Draw smaller hellfire projectile trail with dynamic color
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 * this.size; // Scale line width with bullet size
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        // Draw smaller hellfire outer glow with dynamic color and size
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw smaller hellfire core with dynamic size
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2 * this.size, 0, Math.PI * 2);
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
