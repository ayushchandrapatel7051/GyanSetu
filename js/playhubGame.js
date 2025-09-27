// Enhanced Smart Farming Simulator - Progressive Difficulty System (Fixed)

class EnhancedFarmingSimulator {
    constructor() {
        this.gameState = {
            currentSection: 'homepage',
            currentPhase: 'soil',
            currentCycle: 1,
            plantedCrops: {},
            irrigationSystem: {},
            harvestedCrops: {},
            money: 500,
            gcPoints: 150,
            day: 1,
            growthProgress: {},
            achievements: [],
            irrigationEfficiency: 0,
            cycleStats: {
                totalCycles: 1,
                totalHarvests: 0,
                bestEfficiency: 0,
                totalEarnings: 0
            }
        };

        this.cycleProgression = {
            1: {
                title: "Beginner Farmer",
                crops: ["tomato", "carrot", "spinach", "wheat"],
                soils: ["sandy", "clay", "loamy"],
                traders: 2,
                mathLevel: "Basic Arithmetic",
                irrigationComplexity: "Simple Irrigation",
                unlockMessage: "Complete first full cycle"
            },
            2: {
                title: "Growing Farmer", 
                crops: ["tomato", "carrot", "spinach", "wheat", "corn", "green_beans"],
                soils: ["sandy", "clay", "loamy", "rocky"],
                traders: 3,
                mathLevel: "Fractions & Percentages",
                irrigationComplexity: "Intermediate Systems",
                unlockMessage: "70%+ efficiency required"
            },
            3: {
                title: "Advanced Farmer",
                crops: ["tomato", "carrot", "spinach", "wheat", "corn", "green_beans", "rice", "cotton"],
                soils: ["sandy", "clay", "loamy", "rocky", "peaty"],
                traders: 4,
                mathLevel: "Ratios & Optimization",
                irrigationComplexity: "Advanced Networks",
                unlockMessage: "80%+ efficiency required"
            },
            4: {
                title: "Master Farmer",
                crops: ["tomato", "carrot", "spinach", "wheat", "corn", "green_beans", "rice", "cotton", "okra", "eggplant", "chili", "coriander"],
                soils: ["sandy", "clay", "loamy", "rocky", "peaty", "saline"],
                traders: 5,
                mathLevel: "Complex Economics",
                irrigationComplexity: "Expert Systems",
                unlockMessage: "Master level achievement"
            }
        };

        this.expandedCrops = {
            tomato: {
                name: 'Tomato', emoji: '🍅', soil: 'loamy', growthDays: 8, value: 25,
                nutrition: {
                    title: 'Tomato Nutrition Facts',
                    vitamin_c: '28mg per 100g - Strengthens immune system',
                    lycopene: '2573mcg per 100g - Powerful antioxidant for heart health',
                    potassium: '237mg per 100g - Maintains healthy blood pressure',
                    calories: '18 per 100g - Low calorie but nutritious',
                    fun_fact: 'Tomatoes were once thought poisonous in Europe!'
                }
            },
            carrot: {
                name: 'Carrot', emoji: '🥕', soil: 'sandy', growthDays: 6, value: 15,
                nutrition: {
                    title: 'Carrot Nutrition Facts',
                    vitamin_a: '835mcg per 100g - Essential for good vision',
                    beta_carotene: '8285mcg per 100g - Converts to Vitamin A',
                    fiber: '2.8g per 100g - Healthy digestion',
                    calories: '41 per 100g - Natural energy from healthy sugars',
                    fun_fact: 'Carrots were originally purple!'
                }
            },
            spinach: {
                name: 'Spinach', emoji: '🥬', soil: 'clay', growthDays: 4, value: 12,
                nutrition: {
                    title: 'Spinach Nutrition Facts',
                    iron: '2.7mg per 100g - Prevents anemia',
                    vitamin_k: '483mcg per 100g - Strong bones',
                    folate: '194mcg per 100g - Makes new cells and DNA',
                    calories: '23 per 100g - Very low calorie, high nutrition',
                    fun_fact: 'Popeye increased spinach consumption by 33%!'
                }
            },
            wheat: {
                name: 'Wheat', emoji: '🌾', soil: 'loamy', growthDays: 10, value: 18,
                nutrition: {
                    title: 'Wheat Nutrition Facts',
                    carbohydrates: '71g per 100g - Primary energy source',
                    protein: '13g per 100g - Complete protein for growth',
                    fiber: '13g per 100g - Digestive health',
                    b_vitamins: 'Thiamine and niacin - Energy metabolism',
                    fun_fact: 'Wheat feeds more people worldwide than any other grain!'
                }
            },
            corn: {
                name: 'Sweet Corn', emoji: '🌽', soil: 'loamy', growthDays: 10, value: 22,
                nutrition: {
                    title: 'Sweet Corn Nutrition Facts',
                    carbohydrates: '19g per 100g - Quick energy for active children',
                    fiber: '2.7g per 100g - Promotes healthy digestion',
                    vitamin_c: '6.8mg per 100g - Supports immune system',
                    antioxidants: 'Lutein and zeaxanthin - Protect eyes',
                    fun_fact: 'Each corn kernel is actually a separate fruit!'
                }
            },
            green_beans: {
                name: 'Green Beans', emoji: '🫘', soil: 'loamy', growthDays: 7, value: 18,
                nutrition: {
                    title: 'Green Beans Nutrition Facts',
                    protein: '1.8g per 100g - Plant-based protein',
                    vitamin_k: '43mcg per 100g - Essential for strong bones',
                    folate: '33mcg per 100g - Helps make healthy new cells',
                    fiber: '2.7g per 100g - Digestive system health',
                    fun_fact: 'Green beans improve soil by adding nitrogen!'
                }
            },
            rice: {
                name: 'Rice', emoji: '🍚', soil: 'clay', growthDays: 14, value: 30,
                nutrition: {
                    title: 'Rice Nutrition Facts',
                    carbohydrates: '80g per 100g - Primary energy for half the world',
                    protein: '7g per 100g - Complete protein with amino acids',
                    b_vitamins: 'Thiamine and niacin - Energy metabolism',
                    minerals: 'Iron and zinc - Growth and development',
                    fun_fact: 'Rice feeds over 3.5 billion people daily!'
                }
            },
            cotton: {
                name: 'Cotton', emoji: '🌿', soil: 'sandy', growthDays: 16, value: 35,
                industrial: {
                    title: 'Cotton Industrial Facts',
                    primary_use: 'Textile fiber for clothing production',
                    secondary: 'Cottonseed oil and animal feed',
                    economic: 'Major cash crop for millions of farmers',
                    processing: 'Ginning, carding, and spinning required',
                    fun_fact: 'One cotton plant produces fiber for 7 t-shirts!'
                }
            },
            okra: {
                name: 'Okra', emoji: '🫒', soil: 'clay', growthDays: 9, value: 24,
                nutrition: {
                    title: 'Okra Nutrition Facts',
                    vitamin_c: '23mg per 100g - Immune system support',
                    folate: '60mcg per 100g - Essential for cell growth',
                    fiber: '3.2g per 100g - Promotes healthy digestion',
                    antioxidants: 'Flavonoids and phenolic compounds',
                    fun_fact: 'Okra\'s mucilage is great for thickening soups!'
                }
            },
            eggplant: {
                name: 'Eggplant', emoji: '🍆', soil: 'loamy', growthDays: 12, value: 20,
                nutrition: {
                    title: 'Eggplant Nutrition Facts',
                    fiber: '3g per 100g - Excellent digestive health',
                    antioxidants: 'Nasunin in skin protects brain cells',
                    potassium: '229mg per 100g - Heart and muscle health',
                    calories: '25 per 100g - Great for healthy eating',
                    fun_fact: 'Eggplants are berries related to tomatoes!'
                }
            },
            chili: {
                name: 'Chili Pepper', emoji: '🌶️', soil: 'sandy', growthDays: 11, value: 28,
                nutrition: {
                    title: 'Chili Pepper Facts',
                    capsaicin: 'Natural compound that creates heat',
                    vitamin_c: 'More vitamin C than oranges',
                    metabolism: 'Boosts metabolic rate naturally',
                    preservation: 'Natural antimicrobial properties',
                    fun_fact: 'Birds can\'t taste capsaicin - only mammals!'
                }
            },
            coriander: {
                name: 'Coriander', emoji: '🌿', soil: 'loamy', growthDays: 5, value: 16,
                nutrition: {
                    title: 'Coriander Nutrition Facts',
                    vitamins: 'Rich in vitamins A, C, and K',
                    minerals: 'Iron, manganese, and potassium',
                    antioxidants: 'Powerful antioxidant properties',
                    digestion: 'Aids in healthy digestion',
                    fun_fact: 'Seeds and leaves have completely different flavors!'
                }
            }
        };

        this.achievementsList = [
            {id: 'first_harvest', name: 'First Harvest', description: 'Complete your first farming cycle', reward: 50, icon: '🌱'},
            {id: 'efficient_farmer', name: 'Efficient Farmer', description: 'Achieve 90%+ irrigation efficiency', reward: 75, icon: '💧'},
            {id: 'quality_master', name: 'Quality Master', description: 'Harvest all Grade A crops in one cycle', reward: 100, icon: '🌟'},
            {id: 'math_wizard', name: 'Math Wizard', description: 'Answer 10 trading questions correctly', reward: 80, icon: '🧮'},
            {id: 'cycle_champion', name: 'Cycle Champion', description: 'Complete 3 farming cycles', reward: 150, icon: '🏆'},
            {id: 'crop_master', name: 'Crop Master', description: 'Unlock all crop varieties', reward: 200, icon: '🌾'},
            {id: 'irrigation_expert', name: 'Irrigation Expert', description: 'Design perfect irrigation system', reward: 120, icon: '🔧'},
            {id: 'profit_maximizer', name: 'Profit Maximizer', description: 'Earn ₹1000 in total', reward: 100, icon: '💰'}
        ];

        this.draggedCrop = null;
        this.selectedPipeType = null;
        this.currentTradingProblem = null;
        this.mathCorrectAnswers = 0;

        this.init();
    }

    init() {
        console.log('Initializing Enhanced Farming Simulator...');
        
        this.setupEventListeners();
        this.updateHomepageDisplay();
        this.setupAchievementGallery();
        this.showAchievement('Welcome to Enhanced Smart Farming! 🌱', 25);
        
        setTimeout(() => {
            if (this.gameState.currentPhase === 'soil') {
                this.setupDragAndDrop();
            }
        }, 100);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
            
            if (e.key === 'Enter' && e.target.id === 'trading-answer') {
                e.preventDefault();
                const problemData = this.currentTradingProblem;
                if (problemData) {
                    this.checkTradingAnswer(problemData.problem, problemData.traderId);
                }
            }
        });
    }

    handleGlobalClick(e) {
        console.log('Click detected on:', e.target);
        
        if (e.target.matches('button, .btn, [role="button"], .crop-item, .trader-booth, .harvestable-crop')) {
            e.preventDefault();
        }

        // Homepage navigation
        if (e.target.closest('#farm-cycle-card') || e.target.closest('.farm-cycle-card')) {
            console.log('Farm cycle card clicked');
            this.navigateToSection('farm-cycle');
            return;
        }
        
        if (e.target.closest('#trading-card') || e.target.closest('.trading-card')) {
            console.log('Trading card clicked');
            this.navigateToSection('trading');
            return;
        }
        
        // Back to home buttons - FIXED
        if (e.target.closest('#back-to-home') || e.target.closest('#back-to-home-from-trading')) {
            console.log('Back to home clicked');
            this.navigateToSection('homepage');
            return;
        }
        
        // Phase navigation - FIXED
        if (e.target.closest('#complete-planting')) {
            console.log('Complete planting clicked');
            this.transitionToPhase('irrigation');
            return;
        }
        
        if (e.target.closest('#test-water-system')) {
            console.log('Test water system clicked');
            this.testWaterSystem();
            return;
        }
        
        if (e.target.closest('#speed-up-growth')) {
            console.log('Speed up growth clicked');
            this.accelerateGrowth();
            return;
        }
        
        if (e.target.closest('#start-harvest')) {
            console.log('Start harvest clicked');
            this.transitionToPhase('harvest');
            return;
        }
        
        if (e.target.closest('#go-to-trading')) {
            console.log('Go to trading clicked');
            this.navigateToSection('trading');
            return;
        }

        if (e.target.closest('#complete-cycle')) {
            console.log('Complete cycle clicked');
            this.completeCycle();
            return;
        }
        
        // Modal controls
        if (e.target.closest('#close-modal')) {
            this.closeModal('education-modal');
            return;
        }
        
        if (e.target.closest('#close-trading-modal')) {
            this.closeModal('trading-modal');
            return;
        }

        if (e.target.closest('#close-cycle-modal')) {
            this.closeModal('cycle-complete-modal');
            return;
        }
        
        // Modal backdrop clicks
        if (e.target.classList.contains('modal-backdrop')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                this.closeModal(modal.id);
            }
            return;
        }
        
        // Info buttons
        if (e.target.classList.contains('info-button') || e.target.closest('.info-button')) {
            const button = e.target.closest('.info-button') || e.target;
            const cropType = button.dataset.crop;
            if (cropType) {
                this.showCropNutrition(cropType);
            }
            return;
        }
        
        // Trading booth interactions
        if (e.target.closest('.trade-btn')) {
            const booth = e.target.closest('.trader-booth');
            if (booth.classList.contains('locked')) {
                this.showAchievement('This trader is locked. Complete more cycles to unlock!');
                return;
            }
            const traderId = booth?.dataset?.trader;
            if (traderId) {
                this.openTradingGame(traderId);
            }
            return;
        }
        
        // Geometry answers
        if (e.target.classList.contains('geometry-option')) {
            this.handleGeometryAnswer(e.target);
            return;
        }
        
        // Trading answer submission
        if (e.target.closest('#submit-answer')) {
            const problemData = this.currentTradingProblem;
            if (problemData) {
                this.checkTradingAnswer(problemData.problem, problemData.traderId);
            }
            return;
        }
        
        // Pipe selection
        if (e.target.closest('.pipe-item') && this.gameState.currentPhase === 'irrigation') {
            const pipeItem = e.target.closest('.pipe-item');
            this.selectedPipeType = pipeItem.dataset.pipe;
            document.querySelectorAll('.pipe-item').forEach(p => p.classList.remove('selected'));
            pipeItem.classList.add('selected');
            this.showAchievement(`Selected ${pipeItem.querySelector('span:nth-child(2)').textContent}. Click on grid to place!`);
            return;
        }
        
        // Grid cell clicks
        if (e.target.closest('.grid-cell') && this.selectedPipeType) {
            const cell = e.target.closest('.grid-cell');
            this.placePipe(cell, this.selectedPipeType);
            return;
        }
        
        // Harvest crops
        if (e.target.closest('.harvestable-crop')) {
            const cropDiv = e.target.closest('.harvestable-crop');
            if (!cropDiv.classList.contains('harvested')) {
                const cropType = cropDiv.dataset.crop;
                const quality = cropDiv.dataset.quality;
                const kgAmount = parseFloat(cropDiv.dataset.kg);
                const value = parseInt(cropDiv.dataset.value);
                this.harvestCrop(cropType, quality, kgAmount, value);
            }
            return;
        }

        // Crop selection for mobile - FIXED
        if (e.target.closest('.crop-item') && this.gameState.currentPhase === 'soil') {
            const cropItem = e.target.closest('.crop-item');
            if (!cropItem.classList.contains('planted')) {
                const cropType = cropItem.dataset.crop;
                console.log('Crop selected:', cropType);
                this.draggedCrop = cropType;
                
                document.querySelectorAll('.crop-item').forEach(item => item.classList.remove('selected'));
                cropItem.classList.add('selected');
                
                this.highlightCompatibleSoils(cropType);
                
                // FIXED: Show correct crop name in notification
                const crop = this.expandedCrops[cropType];
                this.showAchievement(`Selected ${crop.name}. Click on a soil plot to plant!`);
            }
            return;
        }

        // Drop zone / soil plot clicks for mobile - improved hit area
        if ((e.target.closest('.drop-zone') || e.target.closest('.soil-plot')) && this.gameState.currentPhase === 'soil') {
            const soilPlot = e.target.closest('.soil-plot');
            const soilType = soilPlot?.dataset?.soil;
            const dropZone = soilPlot?.querySelector('.drop-zone') || soilPlot; // fallback to plot if no zone
            
            console.log('Soil plot clicked:', soilType, 'draggedCrop:', this.draggedCrop);
            
            if (this.draggedCrop && soilType) {
                this.handleCropDrop(this.draggedCrop, dropZone, soilType);
                this.draggedCrop = null;
                document.querySelectorAll('.crop-item').forEach(item => item.classList.remove('selected'));
                this.clearSoilHighlights();
            } else if (!this.draggedCrop) {
                this.showAchievement('Please select a crop first, then click on a soil plot to plant it!');
            }
            return;
        }
    }

    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        
        // Hide all sections
        document.querySelectorAll('.homepage, .section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        if (section === 'homepage') {
            const homepage = document.getElementById('homepage');
            if (homepage) {
                homepage.classList.remove('hidden');
                homepage.classList.add('active');
            }
            this.gameState.currentSection = 'homepage';
            this.updateHomepageDisplay();
        } else if (section === 'farm-cycle') {
            const farmSection = document.getElementById('farm-cycle-section');
            if (farmSection) {
                farmSection.classList.remove('hidden');
                farmSection.classList.add('active');
            }
            this.gameState.currentSection = 'farm-cycle';
            this.initializeFarmCycle();
        } else if (section === 'trading') {
            const tradingSection = document.getElementById('trading-section');
            if (tradingSection) {
                tradingSection.classList.remove('hidden');
                tradingSection.classList.add('active');
            }
            this.gameState.currentSection = 'trading';
            this.initializeTrading();
        }
        
        console.log(`Navigation completed to: ${section}`);
    }

    updateHomepageDisplay() {
        const currentCycleData = this.cycleProgression[this.gameState.currentCycle];
        
        // Update cycle dashboard
        const elements = {
            'current-cycle': this.gameState.currentCycle,
            'cycle-title': currentCycleData.title,
            'total-money': this.gameState.money,
            'total-gc': this.gameState.gcPoints,
            'achievements-count': this.gameState.achievements.length,
            'available-crops-count': currentCycleData.crops.length,
            'math-level': currentCycleData.mathLevel,
            'irrigation-complexity': currentCycleData.irrigationComplexity,
            'cycle-number': this.gameState.currentCycle,
            'trader-count': currentCycleData.traders
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Populate badges gallery in dashboard
        this.setupAchievementGallery();
        
        // Update unlock preview
        const nextCycle = this.gameState.currentCycle + 1;
        const nextUnlock = document.getElementById('next-unlock');
        if (nextUnlock && this.cycleProgression[nextCycle]) {
            const nextCycleData = this.cycleProgression[nextCycle];
            const newCrops = nextCycleData.crops.filter(crop => !currentCycleData.crops.includes(crop));
            nextUnlock.innerHTML = `<small>🔒 Next: Unlock ${newCrops.join(' & ')} (Cycle ${nextCycle})</small>`;
        } else if (nextUnlock) {
            nextUnlock.innerHTML = `<small>🏆 Master Level Achieved!</small>`;
        }
    }

    setupAchievementGallery() {
        const gallery = document.getElementById('achievements-gallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        this.achievementsList.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${this.gameState.achievements.includes(achievement.id) ? 'earned' : 'locked'}`;
            badge.title = this.gameState.achievements.includes(achievement.id) ? `${achievement.name}: ${achievement.description}` : `${achievement.name} (Locked)`;
            
            badge.innerHTML = `
                <div class="badge-icon">${achievement.icon}</div>
                <div class="badge-name">${achievement.name}</div>
            `;
            
            gallery.appendChild(badge);
        });
    }

    initializeFarmCycle() {
        console.log('Initializing farm cycle...');
        
        if (Object.keys(this.gameState.plantedCrops).length === 0) {
            this.transitionToPhase('soil');
        }
        
        this.updateCycleHeader();
        
        setTimeout(() => {
            this.setupDragAndDrop();
        }, 100);
    }

    updateCycleHeader() {
        const currentCycleData = this.cycleProgression[this.gameState.currentCycle];
        
        const sectionTitle = document.getElementById('section-cycle-title');
        if (sectionTitle) {
            sectionTitle.textContent = `Cycle ${this.gameState.currentCycle}: ${currentCycleData.title}`;
        }
        
        const efficiencyPercentage = document.getElementById('efficiency-percentage');
        if (efficiencyPercentage) {
            efficiencyPercentage.textContent = this.gameState.irrigationEfficiency + '%';
        }
        
        const efficiencyFill = document.getElementById('efficiency-fill');
        if (efficiencyFill) {
            efficiencyFill.style.width = this.gameState.irrigationEfficiency + '%';
        }
    }

    transitionToPhase(phase) {
        console.log(`Transitioning to phase: ${phase}`);
        
        // Hide current phase content
        document.querySelectorAll('.phase-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });

        // Show new phase content
        const newPhaseContent = document.getElementById(`${phase}-phase`);
        if (newPhaseContent) {
            newPhaseContent.classList.remove('hidden');
            newPhaseContent.classList.add('active');
            console.log(`Successfully transitioned to ${phase} phase`);
        } else {
            console.error(`Phase content not found: ${phase}-phase`);
        }

        // Update game state
        this.gameState.currentPhase = phase;
        this.updatePhaseProgress();
        this.initializePhase(phase);
        
        console.log(`Phase transition completed: ${phase}`);
    }

    updatePhaseProgress() {
        const phases = ['soil', 'irrigation', 'growth', 'harvest'];
        const currentIndex = phases.indexOf(this.gameState.currentPhase);

        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index < currentIndex) {
                step.classList.add('completed');
            } else if (index === currentIndex) {
                step.classList.add('active');
            }
        });
    }

    initializePhase(phase) {
        console.log(`Initializing phase: ${phase}`);
        switch(phase) {
            case 'soil':
                this.setupSoilPhase();
                break;
            case 'irrigation':
                this.setupIrrigationPhase();
                break;
            case 'growth':
                this.setupGrowthPhase();
                break;
            case 'harvest':
                this.setupHarvestPhase();
                break;
        }
    }

    setupSoilPhase() {
            console.log('Setting up soil phase...');
            const currentCycleData = this.cycleProgression[this.gameState.currentCycle];
            
            // Update cycle display
            const soilCycleEl = document.getElementById('soil-cycle');
            if (soilCycleEl) {
                soilCycleEl.textContent = this.gameState.currentCycle;
            }
            
            // Setup available crops
            const cropContainer = document.getElementById('available-crops');
            if (cropContainer) {
                cropContainer.innerHTML = '';
                
                currentCycleData.crops.forEach(cropType => {
                    const crop = this.expandedCrops[cropType];
                    if (crop) {
                        const cropDiv = document.createElement('div');
                        cropDiv.className = 'crop-item';
                        cropDiv.draggable = true;
                        cropDiv.dataset.crop = cropType;
                        cropDiv.tabIndex = 0;
                        
                        cropDiv.innerHTML = `
                            <div class="crop-emoji">${crop.emoji}</div>
                            <span>${crop.name}</span>
                            <button class="info-button" data-crop="${cropType}" aria-label="${crop.name} nutrition information">ℹ️</button>
                        `;
                        
                        // Add explicit click listener for reliable selection
                        cropDiv.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (cropDiv.classList.contains('planted')) return;
                            
                            this.draggedCrop = cropType;
                            console.log('Crop selected via click:', cropType);
                            
                            document.querySelectorAll('.crop-item').forEach(item => item.classList.remove('selected'));
                            cropDiv.classList.add('selected');
                            
                            this.highlightCompatibleSoils(cropType);
                            
                            const cropName = crop.name;
                            this.showAchievement(`Selected ${cropName}. Click on a soil plot to plant!`);
                        });
                        
                        cropContainer.appendChild(cropDiv);
                    }
                });
            }
            
            // Setup locked crops preview
            const allCrops = Object.keys(this.expandedCrops);
            const lockedCrops = allCrops.filter(crop => !currentCycleData.crops.includes(crop));
            
            const lockedContainer = document.getElementById('locked-crop-list');
            if (lockedContainer) {
                lockedContainer.innerHTML = '';
                
                lockedCrops.slice(0, 6).forEach(cropType => {
                    const crop = this.expandedCrops[cropType];
                    const lockedDiv = document.createElement('div');
                    lockedDiv.className = 'locked-crop';
                    
                    lockedDiv.innerHTML = `
                        <span class="locked-crop-emoji">${crop.emoji}</span>
                        <span>${crop.name}</span>
                    `;
                    
                    lockedContainer.appendChild(lockedDiv);
                });
            }
            
            // Setup soil types
            const soilContainer = document.getElementById('soil-plots-grid');
            if (soilContainer) {
                soilContainer.innerHTML = '';
                
                currentCycleData.soils.forEach(soilType => {
                    const soilDiv = document.createElement('div');
                    soilDiv.className = `soil-plot ${soilType}`;
                    soilDiv.dataset.soil = soilType;
                    
                    const soilNames = {
                        sandy: 'Sandy Soil',
                        clay: 'Clay Soil',
                        loamy: 'Loamy Soil',
                        rocky: 'Rocky Soil',
                        peaty: 'Peaty Soil',
                        saline: 'Saline Soil'
                    };
                    
                    const soilProps = {
                        sandy: ['Drainage: Excellent', 'Best for: Root vegetables'],
                        clay: ['Water retention: High', 'Best for: Leafy greens'],
                        loamy: ['Balance: Perfect', 'Best for: Most crops'],
                        rocky: ['Drainage: Good', 'Best for: Hardy crops'],
                        peaty: ['Organic matter: High', 'Best for: Acid-loving plants'],
                        saline: ['Salt content: High', 'Best for: Salt-tolerant crops']
                    };
                    
                    soilDiv.innerHTML = `
                        <h4>${soilNames[soilType]}</h4>
                        <div class="soil-properties">
                            <span>${soilProps[soilType][0]}</span>
                            <span>${soilProps[soilType][1]}</span>
                        </div>
                        <div class="drop-zone" role="button" tabindex="0" aria-label="${soilNames[soilType]} planting area"></div>
                    `;
                    
                    // Add explicit click listener for reliable planting
                    soilDiv.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (!this.draggedCrop || soilDiv.querySelector('.planted-crop')) return;
                        
                        const dropZone = soilDiv.querySelector('.drop-zone') || soilDiv;
                        this.handleCropDrop(this.draggedCrop, dropZone, soilType);
                        this.draggedCrop = null;
                        document.querySelectorAll('.crop-item').forEach(item => item.classList.remove('selected'));
                        this.clearSoilHighlights();
                    });
                    
                    soilContainer.appendChild(soilDiv);
                });
            }
            
            // Reset state
            this.gameState.plantedCrops = {};
            this.draggedCrop = null;
            
            const completeBtn = document.getElementById('complete-planting');
            if (completeBtn) {
                completeBtn.classList.add('hidden');
            }
            
            this.setupDragAndDrop();
        }

    setupDragAndDrop() {
        if (this.gameState.currentPhase === 'soil') {
            this.setupCropDragging();
            this.setupDropZones();
        }
    }

    setupCropDragging() {
            const cropItems = document.querySelectorAll('.crop-item');
            
            cropItems.forEach(item => {
                // Clone to remove existing listeners
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                
                newItem.addEventListener('dragstart', (e) => {
                    this.handleCropDragStart(e);
                });
                
                newItem.addEventListener('dragend', (e) => {
                    this.handleCropDragEnd(e);
                });
                
                // Add explicit click for reliable selection (after cloning)
                newItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (newItem.classList.contains('planted')) return;
                    
                    this.draggedCrop = newItem.dataset.crop;
                    console.log('Crop selected via click:', this.draggedCrop);
                    
                    document.querySelectorAll('.crop-item').forEach(i => i.classList.remove('selected'));
                    newItem.classList.add('selected');
                    
                    this.highlightCompatibleSoils(this.draggedCrop);
                    
                    const cropType = newItem.dataset.crop;
                    const crop = this.expandedCrops[cropType];
                    if (crop) {
                        this.showAchievement(`Selected ${crop.name}. Click on a soil plot to plant!`);
                    }
                });
            });
        }

    handleCropDragStart(e) {
        const cropItem = e.target.closest('.crop-item');
        if (!cropItem || cropItem.classList.contains('planted')) {
            e.preventDefault();
            return false;
        }
        
        const cropType = cropItem.dataset.crop;
        e.dataTransfer.setData('text/plain', cropType);
        e.dataTransfer.effectAllowed = 'move';
        
        cropItem.classList.add('dragging');
        this.draggedCrop = cropType;
        this.highlightCompatibleSoils(cropType);
    }

    handleCropDragEnd(e) {
        const cropItem = e.target.closest('.crop-item');
        if (cropItem) {
            cropItem.classList.remove('dragging');
        }
        this.clearSoilHighlights();
    }

    setupDropZones() {
        const dropZones = document.querySelectorAll('.drop-zone');
        
        dropZones.forEach(zone => {
            // Clone to remove existing listeners
            const newZone = zone.cloneNode(true);
            zone.parentNode.replaceChild(newZone, zone);
            
            newZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            newZone.addEventListener('dragenter', (e) => {
                e.preventDefault();
                newZone.classList.add('drag-over');
            });
            
            newZone.addEventListener('dragleave', (e) => {
                if (!newZone.contains(e.relatedTarget)) {
                    newZone.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
                }
            });
            
            newZone.addEventListener('drop', (e) => {
                e.preventDefault();
                const cropType = e.dataTransfer.getData('text/plain');
                const soilPlot = newZone.closest('.soil-plot');
                const soilType = soilPlot?.dataset.soil;
                
                if (cropType && soilType) {
                    this.handleCropDrop(cropType, newZone, soilType);
                }
            });
        });
    }

    handleCropDrop(cropType, dropZone, soilType) {
        console.log('handleCropDrop called:', { cropType, soilType });
        
        const crop = this.expandedCrops[cropType];
        if (!crop) {
            console.error('Crop not found:', cropType);
            return;
        }
        
        // Validation checks
        if (dropZone.querySelector('.planted-crop')) {
            this.showEducationalPopup('Already Planted', 'This soil plot already has a crop planted!');
            return;
        }
        
        if (Object.values(this.gameState.plantedCrops).includes(cropType)) {
            this.showEducationalPopup('Already Planted', 'This crop has already been planted in another plot!');
            return;
        }
        
        // Plant the crop
        const plantedCrop = document.createElement('div');
        plantedCrop.className = 'planted-crop';
        plantedCrop.innerHTML = crop.emoji;
        dropZone.appendChild(plantedCrop);
        
        // Update game state
        this.gameState.plantedCrops[soilType] = cropType;
        console.log('Updated planted crops:', this.gameState.plantedCrops);
        
        // Mark crop as planted
        const cropItem = document.querySelector(`.crop-item[data-crop="${cropType}"]`);
        if (cropItem) {
            cropItem.classList.add('planted');
            cropItem.classList.remove('selected');
        }
        
        // Educational feedback
        const compatibility = this.checkSoilCompatibility(cropType, soilType);
        this.showPlantingFeedback(cropType, soilType, compatibility);
        
        // Check completion
        this.checkPlantingComplete();
        
        // Clear highlights and selection
        this.clearSoilHighlights();
        this.draggedCrop = null;
        
        // Achievement
        if (Object.keys(this.gameState.plantedCrops).length === 1) {
            this.showAchievement('First crop planted! 🌱', 10);
        }
        
        console.log('Crop planting completed successfully');
    }

    highlightCompatibleSoils(cropType) {
        const crop = this.expandedCrops[cropType];
        const optimalSoil = crop.soil;
        
        document.querySelectorAll('.soil-plot').forEach(plot => {
            const soilType = plot.dataset.soil;
            const dropZone = plot.querySelector('.drop-zone');
            
            if (dropZone && !dropZone.querySelector('.planted-crop')) {
                if (soilType === optimalSoil) {
                    dropZone.classList.add('valid-drop');
                } else if (soilType === 'loamy') {
                    dropZone.classList.add('valid-drop');
                } else {
                    dropZone.classList.add('invalid-drop');
                }
            }
        });
    }

    clearSoilHighlights() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('valid-drop', 'invalid-drop', 'drag-over');
        });
    }

    checkSoilCompatibility(cropType, soilType) {
        const crop = this.expandedCrops[cropType];
        const optimalSoil = crop.soil;
        
        if (soilType === optimalSoil) {
            return 'optimal';
        } else if (soilType === 'loamy') {
            return 'good';
        } else {
            return 'poor';
        }
    }

    checkPlantingComplete() {
        const plantedCount = Object.keys(this.gameState.plantedCrops).length;
        const requiredCount = Math.min(3, this.cycleProgression[this.gameState.currentCycle].crops.length);
        
        console.log(`Planted count: ${plantedCount}, Required: ${requiredCount}`);
        
        if (plantedCount >= requiredCount) {
            const completeBtn = document.getElementById('complete-planting');
            if (completeBtn) {
                completeBtn.classList.remove('hidden');
                console.log('Complete planting button shown');
            }
            this.showAchievement('All crops planted! Ready for irrigation design! 💧', 15);
        }
    }

    showPlantingFeedback(cropType, soilType, compatibility) {
        const crop = this.expandedCrops[cropType];
        
        let title, content;
        
        if (compatibility === 'optimal') {
            title = 'Perfect Match! 🌟';
            const nutrition = crop.nutrition || crop.industrial;
            content = `
                <div class="nutrition-info">
                    <h4>${nutrition.title}</h4>
                    <ul>
                        <li><strong>Primary Benefit:</strong> ${Object.values(nutrition)[1]}</li>
                        <li><strong>Secondary Benefit:</strong> ${Object.values(nutrition)[2]}</li>
                        <li><strong>Health Impact:</strong> ${Object.values(nutrition)[3]}</li>
                        <li><strong>Fun Fact:</strong> ${nutrition.fun_fact}</li>
                    </ul>
                    <p><strong>Perfect soil match means:</strong> Maximum yield, fastest growth, and highest quality!</p>
                </div>
            `;
        } else if (compatibility === 'good') {
            title = 'Good Choice 👍';
            content = `
                <p><strong>${crop.name}</strong> can grow well in this soil, reaching about 85% of its potential.</p>
                <p><strong>Better choice:</strong> ${crop.name} would thrive even better in ${crop.soil} soil for 100% potential!</p>
            `;
        } else {
            title = 'Poor Match 🤔';
            content = `
                <p><strong>${crop.name}</strong> will struggle in this soil, reaching only 60% of its potential.</p>
                <p><strong>Much better choice:</strong> Plant ${crop.name} in ${crop.soil} soil for optimal results!</p>
                <p>Understanding soil compatibility is crucial for successful farming!</p>
            `;
        }
        
        this.showEducationalPopup(title, content);
    }

    showCropNutrition(cropType) {
        const crop = this.expandedCrops[cropType];
        if (!crop) return;
        
        const info = crop.nutrition || crop.industrial;
        
        const content = `
            <div class="nutrition-details">
                <h4>${info.title}</h4>
                <div class="nutrition-list">
                    ${Object.entries(info).slice(1, -1).map(([key, value]) => `
                        <div class="nutrition-item">
                            <strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong><br>
                            ${value}
                        </div>
                    `).join('')}
                </div>
                <div class="fun-fact">
                    <strong>🤔 Did you know?</strong><br>
                    ${info.fun_fact}
                </div>
            </div>
        `;
        
        this.showEducationalPopup(`${crop.name} Information`, content);
    }

    setupIrrigationPhase() {
        console.log('Setting up irrigation phase...');
        const grid = document.getElementById('irrigation-grid');
        if (!grid) return;
        
        // Increase grid complexity based on cycle
        const gridSizes = {1: 48, 2: 54, 3: 64, 4: 72};
        const gridSize = gridSizes[this.gameState.currentCycle] || 48;
        
        const gridSizeEl = document.getElementById('grid-size');
        if (gridSizeEl) {
            gridSizeEl.textContent = this.gameState.currentCycle <= 2 ? '8x6' : '8x8';
        }
        
        const plotsCountEl = document.getElementById('plots-count');
        if (plotsCountEl) {
            plotsCountEl.textContent = Object.keys(this.gameState.plantedCrops).length;
        }
        
        grid.innerHTML = '';
        
        for (let i = 0; i < gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            cell.setAttribute('tabindex', '0');
            grid.appendChild(cell);
        }
        
        // Place crops
        const cropPositions = this.gameState.currentCycle <= 2 ? [10, 25, 37] : [12, 28, 45, 58];
        let cropIndex = 0;
        
        Object.entries(this.gameState.plantedCrops).forEach(([soilType, cropType]) => {
            const crop = this.expandedCrops[cropType];
            if (crop && cropIndex < cropPositions.length) {
                const cell = grid.children[cropPositions[cropIndex]];
                if (cell) {
                    cell.classList.add('crop-location');
                    cell.innerHTML = crop.emoji;
                    cropIndex++;
                }
            }
        });
        
        // Setup pipe components based on cycle
        this.setupPipeComponents();
        this.setupGeometryChallenge();
        
        this.gameState.irrigationSystem = {};
        this.selectedPipeType = null;
        
        const testBtn = document.getElementById('test-water-system');
        if (testBtn) {
            testBtn.classList.add('hidden');
        }
        
        console.log('Irrigation phase setup completed');
    }

    setupPipeComponents() {
        const pipeContainer = document.getElementById('available-pipes');
        if (!pipeContainer) return;
        
        // Base pipes available to all cycles
        const basePipes = [
            {type: 'straight', symbol: '━', name: 'Straight Pipe', cost: 5},
            {type: 'corner', symbol: '┓', name: 'Corner Pipe', cost: 8},
            {type: 'tjunction', symbol: '┳', name: 'T-Junction', cost: 12}
        ];
        
        // Advanced pipes for higher cycles
        const advancedPipes = [
            {type: 'pump', symbol: '⚡', name: 'Water Pump', cost: 25},
            {type: 'valve', symbol: '🔧', name: 'Control Valve', cost: 15}
        ];
        
        pipeContainer.innerHTML = '';
        
        basePipes.forEach(pipe => {
            const pipeDiv = document.createElement('div');
            pipeDiv.className = 'pipe-item';
            pipeDiv.dataset.pipe = pipe.type;
            pipeDiv.tabIndex = 0;
            
            pipeDiv.innerHTML = `
                <span class="pipe-symbol">${pipe.symbol}</span>
                <span>${pipe.name}</span>
                <span class="cost">₹${pipe.cost}</span>
            `;
            
            pipeContainer.appendChild(pipeDiv);
        });
        
        // Add advanced pipes for cycles 3+
        if (this.gameState.currentCycle >= 3) {
            advancedPipes.forEach(pipe => {
                const pipeDiv = document.createElement('div');
                pipeDiv.className = 'pipe-item';
                pipeDiv.dataset.pipe = pipe.type;
                pipeDiv.tabIndex = 0;
                
                pipeDiv.innerHTML = `
                    <span class="pipe-symbol">${pipe.symbol}</span>
                    <span>${pipe.name}</span>
                    <span class="cost">₹${pipe.cost}</span>
                `;
                
                pipeContainer.appendChild(pipeDiv);
            });
        }
    }

    setupGeometryChallenge() {
        const challengeContainer = document.getElementById('geometry-challenge');
        if (!challengeContainer) return;
        
        const challenges = {
            1: {
                question: "What angle do corner pipes turn?",
                options: [45, 90, 135],
                correct: 90
            },
            2: {
                question: "How many outlets does a T-junction have?",
                options: [2, 3, 4],
                correct: 3
            },
            3: {
                question: "Water pressure decreases by what % every 10 meters?",
                options: [5, 10, 15],
                correct: 10
            },
            4: {
                question: "Optimal pump spacing for maximum efficiency?",
                options: ["20m", "30m", "40m"],
                correct: "30m"
            }
        };
        
        const challenge = challenges[this.gameState.currentCycle];
        
        challengeContainer.innerHTML = `
            <h4>Engineering Challenge</h4>
            <div id="geometry-question">
                <p>${challenge.question} 🤔</p>
                <div class="geometry-options">
                    ${challenge.options.map(option => `
                        <button class="btn btn--secondary geometry-option" data-answer="${option}">${option}${typeof option === 'number' ? (challenge.question.includes('angle') ? '°' : '') : ''}</button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    placePipe(cell, pipeType) {
        if (!cell) return;
        
        if (cell.classList.contains('crop-location')) {
            this.showEducationalPopup('Invalid Placement', 'Cannot place pipes on crop locations!');
            return;
        }
        
        if (cell.classList.contains('pipe-placed')) {
            this.showEducationalPopup('Already Occupied', 'This cell already has a pipe.');
            return;
        }
        
        const pipeSymbols = {
            straight: '━',
            corner: '┓',
            tjunction: '┳',
            pump: '⚡',
            valve: '🔧'
        };
        
        cell.innerHTML = pipeSymbols[pipeType];
        cell.classList.add('pipe-placed');
        cell.dataset.pipe = pipeType;
        
        const index = parseInt(cell.dataset.index);
        this.gameState.irrigationSystem[index] = pipeType;
        
        this.calculateIrrigationEfficiency();
        this.checkIrrigationComplete();
        
        if (Object.keys(this.gameState.irrigationSystem).length === 1) {
            this.showAchievement('First pipe placed! 🔧', 5);
        }
    }

    calculateIrrigationEfficiency() {
        const pipes = this.gameState.irrigationSystem;
        const pipeCount = Object.keys(pipes).length;
        
        if (pipeCount === 0) {
            this.gameState.irrigationEfficiency = 0;
            this.updateEfficiencyDisplay();
            return;
        }
        
        let efficiency = 100;
        
        // Pipe length penalty (more pipes = longer system = lower efficiency)
        const lengthPenalty = Math.max(0, (pipeCount - 5) * 2);
        efficiency -= lengthPenalty;
        
        // T-junction penalty (each reduces flow)
        const tjunctions = Object.values(pipes).filter(pipe => pipe === 'tjunction').length;
        efficiency -= tjunctions * 5;
        
        // Pump bonus (strategic placement increases efficiency)
        const pumps = Object.values(pipes).filter(pipe => pipe === 'pump').length;
        const pumpBonus = Math.min(pumps * 10, 20); // Max 20% bonus
        efficiency += pumpBonus;
        
        // Cycle-based complexity bonus
        if (this.gameState.currentCycle >= 3 && pipeCount >= 8) {
            efficiency += 5; // Complexity handling bonus
        }
        
        // Ensure efficiency is within bounds
        this.gameState.irrigationEfficiency = Math.max(0, Math.min(100, Math.round(efficiency)));
        this.updateEfficiencyDisplay();
    }

    updateEfficiencyDisplay() {
        const efficiencyPercentage = document.getElementById('efficiency-percentage');
        if (efficiencyPercentage) {
            efficiencyPercentage.textContent = this.gameState.irrigationEfficiency + '%';
        }
        
        const efficiencyFill = document.getElementById('efficiency-fill');
        if (efficiencyFill) {
            efficiencyFill.style.width = this.gameState.irrigationEfficiency + '%';
        }
    }

    checkIrrigationComplete() {
        const requiredPipes = this.gameState.currentCycle <= 2 ? 5 : 8;
        const pipesPlaced = Object.keys(this.gameState.irrigationSystem).length;
        
        if (pipesPlaced >= requiredPipes) {
            const testBtn = document.getElementById('test-water-system');
            if (testBtn) {
                testBtn.classList.remove('hidden');
            }
        }
    }

    testWaterSystem() {
        console.log('Testing water system...');
        const requiredPipes = this.gameState.currentCycle <= 2 ? 5 : 8;
        const pipesPlaced = Object.keys(this.gameState.irrigationSystem).length;
        
        if (pipesPlaced >= requiredPipes) {
            document.querySelectorAll('.pipe-placed').forEach(pipe => {
                pipe.classList.add('water-flow');
            });
            
            // Efficiency achievements
            if (this.gameState.irrigationEfficiency >= 90) {
                this.unlockAchievement('efficient_farmer');
            }
            
            this.gameState.gcPoints += Math.round(this.gameState.irrigationEfficiency / 4);
            this.showAchievement(`Water system efficiency: ${this.gameState.irrigationEfficiency}%! 💧`, this.gameState.irrigationEfficiency);
            
            const efficiencyGrade = this.gameState.irrigationEfficiency >= 85 ? 'Excellent' : 
                                   this.gameState.irrigationEfficiency >= 70 ? 'Good' : 
                                   this.gameState.irrigationEfficiency >= 50 ? 'Average' : 'Poor';
            
            this.showEducationalPopup(`Irrigation ${efficiencyGrade}! 💧`, 
                `Your system efficiency is ${this.gameState.irrigationEfficiency}%. This will ${this.gameState.irrigationEfficiency >= 85 ? 'significantly accelerate' : this.gameState.irrigationEfficiency >= 70 ? 'moderately speed up' : 'maintain normal'} crop growth!`);
            
            setTimeout(() => {
                this.transitionToPhase('growth');
            }, 3000);
        } else {
            this.showEducationalPopup('System Incomplete', 
                `Your irrigation system needs at least ${requiredPipes} pipe pieces for this cycle complexity level!`);
        }
    }

    handleGeometryAnswer(button) {
        const answer = button.dataset.answer;
        
        const challenges = {
            1: {correct: '90'},
            2: {correct: '3'},
            3: {correct: '10'},
            4: {correct: '30m'}
        };
        
        const correctAnswer = challenges[this.gameState.currentCycle].correct;
        
        document.querySelectorAll('.geometry-option').forEach(btn => {
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = true;
        });
        
        if (answer === correctAnswer) {
            button.classList.add('correct');
            this.gameState.gcPoints += 15;
            this.showAchievement('Correct engineering knowledge! 📐', 15);
        } else {
            button.classList.add('incorrect');
            const correctBtn = document.querySelector(`.geometry-option[data-answer="${correctAnswer}"]`);
            if (correctBtn) {
                correctBtn.classList.add('correct');
            }
            this.showEducationalPopup('Engineering Lesson', 
                `The correct answer is ${correctAnswer}. Understanding these principles helps design better irrigation systems!`);
        }
        
        setTimeout(() => {
            document.querySelectorAll('.geometry-option').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect');
            });
        }, 3000);
    }

    setupGrowthPhase() {
        console.log('Setting up growth phase...');
        const field = document.getElementById('growth-field');
        if (!field) return;
        
        field.innerHTML = '';
        this.gameState.day = 1;
        this.gameState.growthProgress = {};
        
        // Calculate growth multiplier based on irrigation efficiency
        const efficiencyMultiplier = this.getGrowthMultiplier();
        
        const growthBonusEl = document.getElementById('growth-bonus');
        if (growthBonusEl) {
            growthBonusEl.textContent = 
                this.gameState.irrigationEfficiency >= 85 ? '+30%' : 
                this.gameState.irrigationEfficiency >= 70 ? '+15%' : 
                this.gameState.irrigationEfficiency >= 50 ? '0%' : '-30%';
        }
        
        Object.entries(this.gameState.plantedCrops).forEach(([soilType, cropType]) => {
            const crop = this.expandedCrops[cropType];
            if (!crop) return;
            
            const plantDiv = document.createElement('div');
            plantDiv.className = 'growing-plant';
            plantDiv.innerHTML = `
                <span class="plant-emoji">🌱</span>
                <div class="plant-name">${crop.name}</div>
                <div class="growth-progress">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="growth-percentage">0%</div>
                <div class="growth-time">Days: ${Math.round(crop.growthDays * efficiencyMultiplier)}</div>
            `;
            
            field.appendChild(plantDiv);
            this.gameState.growthProgress[cropType] = 0;
        });
        
        this.startGrowthCycle();
        
        const harvestBtn = document.getElementById('start-harvest');
        if (harvestBtn) {
            harvestBtn.classList.add('hidden');
        }
        
        console.log('Growth phase setup completed');
    }

    getGrowthMultiplier() {
        // Efficiency-dependent growth multipliers
        if (this.gameState.irrigationEfficiency >= 95) return 0.7;  // 30% faster
        if (this.gameState.irrigationEfficiency >= 85) return 0.85; // 15% faster
        if (this.gameState.irrigationEfficiency >= 70) return 1.0;  // Normal speed
        if (this.gameState.irrigationEfficiency >= 50) return 1.3;  // 30% slower
        return 1.8; // 80% slower for poor irrigation
    }

    startGrowthCycle() {
        if (this.growthInterval) {
            clearInterval(this.growthInterval);
        }
        
        this.growthInterval = setInterval(() => {
            this.updateGrowth();
        }, 2000);
        
        this.updateGrowthFacts();
    }

    updateGrowth() {
        let allMature = true;
        const efficiencyMultiplier = this.getGrowthMultiplier();
        
        Object.entries(this.gameState.growthProgress).forEach(([cropType, progress]) => {
            const crop = this.expandedCrops[cropType];
            if (!crop) return;
            
            const adjustedGrowthDays = crop.growthDays * efficiencyMultiplier;
            const dailyGrowth = 100 / adjustedGrowthDays;
            const newProgress = Math.min(progress + dailyGrowth, 100);
            
            this.gameState.growthProgress[cropType] = newProgress;
            
            const plantDiv = Array.from(document.querySelectorAll('.growing-plant'))
                .find(div => div.querySelector('.plant-name')?.textContent === crop.name);
            
            if (plantDiv) {
                const progressFill = plantDiv.querySelector('.progress-fill');
                const percentage = plantDiv.querySelector('.growth-percentage');
                const plantEmoji = plantDiv.querySelector('.plant-emoji');
                
                if (progressFill) progressFill.style.width = newProgress + '%';
                if (percentage) percentage.textContent = Math.round(newProgress) + '%';
                
                if (plantEmoji) {
                    if (newProgress < 25) {
                        plantEmoji.textContent = '🌱';
                    } else if (newProgress < 50) {
                        plantEmoji.textContent = '🌿';
                    } else if (newProgress < 75) {
                        plantEmoji.textContent = '🌾';
                    } else if (newProgress >= 100) {
                        plantEmoji.textContent = crop.emoji;
                        plantDiv.classList.add('celebration');
                    }
                }
            }
            
            if (newProgress < 100) {
                allMature = false;
            }
        });
        
        // Update average growth
        const totalProgress = Object.values(this.gameState.growthProgress).reduce((sum, progress) => sum + progress, 0);
        const averageProgress = Math.round(totalProgress / Object.keys(this.gameState.growthProgress).length);
        const averageGrowthEl = document.getElementById('average-growth');
        if (averageGrowthEl) {
            averageGrowthEl.textContent = averageProgress + '%';
        }
        
        this.gameState.day++;
        const dayElement = document.getElementById('growth-day');
        if (dayElement) {
            dayElement.textContent = this.gameState.day;
        }
        
        if (allMature) {
            clearInterval(this.growthInterval);
            const harvestBtn = document.getElementById('start-harvest');
            if (harvestBtn) {
                harvestBtn.classList.remove('hidden');
            }
            this.showAchievement('All crops are ready to harvest! 🌾', 20);
        }
    }

    accelerateGrowth() {
        Object.keys(this.gameState.growthProgress).forEach(cropType => {
            this.gameState.growthProgress[cropType] = Math.min(
                this.gameState.growthProgress[cropType] + 25, 
                100
            );
        });
        
        this.gameState.gcPoints += 5;
        this.updateGrowth();
        this.updateGrowthFacts();
        this.showAchievement('Time accelerated! ⏰', 5);
    }

    updateGrowthFacts() {
        const facts = [
            'Efficient irrigation delivers optimal water and nutrients to plant roots!',
            'Poor irrigation can slow growth by up to 80% due to water stress!',
            'Root systems grow deeper when water is consistently available!',
            'Plants with good irrigation develop stronger cell walls and better disease resistance!',
            'Proper water management increases crop yields by 200-300%!'
        ];
        
        const factsElement = document.getElementById('growth-facts');
        if (factsElement) {
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            factsElement.textContent = randomFact;
        }
    }

    setupHarvestPhase() {
        console.log('Setting up harvest phase...');
        const field = document.getElementById('harvest-field');
        if (!field) return;
        
        field.innerHTML = '';
        this.gameState.harvestedCrops = {};
        
        // Update harvest header displays
        const cycleMoneyEl = document.getElementById('cycle-money');
        if (cycleMoneyEl) {
            cycleMoneyEl.textContent = this.gameState.money;
        }
        
        const cycleGcEl = document.getElementById('cycle-gc');
        if (cycleGcEl) {
            cycleGcEl.textContent = this.gameState.gcPoints;
        }
        
        Object.entries(this.gameState.plantedCrops).forEach(([soilType, cropType]) => {
            const crop = this.expandedCrops[cropType];
            if (!crop) return;
            
            const compatibility = this.checkSoilCompatibility(cropType, soilType);
            const efficiencyBonus = this.gameState.irrigationEfficiency >= 85 ? 1.3 : 
                                   this.gameState.irrigationEfficiency >= 70 ? 1.15 : 
                                   this.gameState.irrigationEfficiency >= 50 ? 1.0 : 0.8;
            
            let quality, qualityMultiplier, kgAmount;
            
            if (compatibility === 'optimal' && this.gameState.irrigationEfficiency >= 85) {
                quality = 'A';
                qualityMultiplier = 1.5;
                kgAmount = (8 + Math.random() * 4) * efficiencyBonus; // 8-12kg base
            } else if (compatibility === 'optimal' || this.gameState.irrigationEfficiency >= 70) {
                quality = 'B';
                qualityMultiplier = 1.2;
                kgAmount = (6 + Math.random() * 3) * efficiencyBonus; // 6-9kg base
            } else {
                quality = 'C';
                qualityMultiplier = 0.8;
                kgAmount = (3 + Math.random() * 2) * efficiencyBonus; // 3-5kg base
            }
            
            kgAmount = Math.round(kgAmount * 10) / 10; // Round to 1 decimal
            const finalValue = Math.round(crop.value * qualityMultiplier * kgAmount);
            
            const harvestDiv = document.createElement('div');
            harvestDiv.className = 'harvestable-crop';
            harvestDiv.dataset.crop = cropType;
            harvestDiv.dataset.quality = quality;
            harvestDiv.dataset.kg = kgAmount;
            harvestDiv.dataset.value = finalValue;
            harvestDiv.setAttribute('tabindex', '0');
            
            harvestDiv.innerHTML = `
                <div class="crop-emoji">${crop.emoji}</div>
                <div class="crop-name">${crop.name}</div>
                <div class="crop-quantity">${kgAmount}kg</div>
                <div class="crop-quality">Grade ${quality}</div>
                <div class="crop-value">₹${finalValue}</div>
                <div class="harvest-instruction">Click to harvest!</div>
            `;
            
            field.appendChild(harvestDiv);
        });
        
        this.updateHarvestInventory();
        this.updateEfficiencyBonus();
        
        console.log('Harvest phase setup completed');
    }

    updateEfficiencyBonus() {
        const efficiencyBonus = this.gameState.irrigationEfficiency >= 85 ? 30 : 
                               this.gameState.irrigationEfficiency >= 70 ? 15 : 0;
        const harvestEfficiencyBonusEl = document.getElementById('harvest-efficiency-bonus');
        if (harvestEfficiencyBonusEl) {
            harvestEfficiencyBonusEl.textContent = `+${efficiencyBonus}%`;
        }
    }

    harvestCrop(cropType, quality, kgAmount, value) {
        console.log('Harvesting crop:', { cropType, quality, kgAmount, value });
        
        const cropDiv = document.querySelector(`.harvestable-crop[data-crop="${cropType}"]`);
        if (!cropDiv || cropDiv.classList.contains('harvested')) return;
        
        cropDiv.classList.add('harvested');
        const instruction = cropDiv.querySelector('.harvest-instruction');
        if (instruction) {
            instruction.textContent = 'Harvested! ✓';
        }
        
        this.gameState.harvestedCrops[cropType] = {
            quantity: kgAmount,
            quality: quality,
            value: value
        };
        
        this.gameState.cycleStats.totalHarvests++;
        this.gameState.gcPoints += 15;
        this.updateHarvestInventory();
        
        cropDiv.classList.add('celebration');
        
        const crop = this.expandedCrops[cropType];
        if (crop) {
            this.showAchievement(`Harvested ${kgAmount}kg ${crop.name}! Grade ${quality}! ✨`, value);
        }
        
        // Check for achievements
        this.checkHarvestAchievements();
        
        // Check if all crops harvested
        if (Object.keys(this.gameState.harvestedCrops).length === Object.keys(this.gameState.plantedCrops).length) {
            setTimeout(() => {
                const completeBtn = document.getElementById('complete-cycle');
                if (completeBtn) {
                    completeBtn.classList.remove('hidden');
                }
            }, 1000);
        }
    }

    checkHarvestAchievements() {
        // Check if all crops are Grade A
        const allGradeA = Object.values(this.gameState.harvestedCrops).every(crop => crop.quality === 'A');
        if (allGradeA && Object.keys(this.gameState.harvestedCrops).length >= 3) {
            this.unlockAchievement('quality_master');
        }
        
        // Check first harvest
        if (this.gameState.cycleStats.totalHarvests === 1) {
            this.unlockAchievement('first_harvest');
        }
    }

    updateHarvestInventory() {
        const inventory = document.getElementById('harvest-inventory');
        if (!inventory) return;
        
        inventory.innerHTML = '';
        let totalValue = 0;
        
        Object.entries(this.gameState.harvestedCrops).forEach(([cropType, data]) => {
            const crop = this.expandedCrops[cropType];
            if (!crop) return;
            
            totalValue += data.value;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <div class="inventory-item-info">
                    <span class="item-emoji">${crop.emoji}</span>
                    <div>
                        <div class="item-name">${crop.name}</div>
                        <div class="item-quantity">${data.quantity}kg (Grade ${data.quality})</div>
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-value">₹${data.value}</div>
                </div>
            `;
            
            inventory.appendChild(itemDiv);
        });
        
        const totalHarvestValueEl = document.getElementById('total-harvest-value');
        if (totalHarvestValueEl) {
            totalHarvestValueEl.textContent = totalValue;
        }
    }

    initializeTrading() {
        const currentCycleData = this.cycleProgression[this.gameState.currentCycle];
        
        // Update trading display
        const elements = {
            'player-money': this.gameState.money,
            'gc-points': this.gameState.gcPoints,
            'trading-cycle': this.gameState.currentCycle,
            'available-traders': currentCycleData.traders,
            'math-complexity': currentCycleData.mathLevel
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        this.setupTraderBooths();
    }

    setupTraderBooths() {
        const boothsContainer = document.getElementById('trader-booths');
        if (!boothsContainer) return;
        
        const currentCycleData = this.cycleProgression[this.gameState.currentCycle];
        const availableTraders = currentCycleData.traders;
        
        const traders = [
            {
                id: 'rajesh', name: 'Rajesh Singh', title: 'Bulk Buyer', avatar: '../assets/img/trader1.png',
                description: 'Specializes in quantity purchases and basic multiplication',
                specialty: 'Multiplication & Addition'
            },
            {
                id: 'priya', name: 'Priya Sharma', title: 'Premium Trader', avatar: '../assets/img/trader2.png',
                description: 'Pays quality bonuses and teaches percentage calculations',
                specialty: 'Percentages & Quality Bonuses'
            },
            {
                id: 'kumar', name: 'Kumar Patel', title: 'Community Trader', avatar: '../assets/img/trader3.png',
                description: 'Fair community prices and fraction sharing practice',
                specialty: 'Fractions & Fair Trade'
            },
            {
                id: 'anita', name: 'Anita Reddy', title: 'Export Specialist', avatar: '../assets/img/4.png',
                description: 'International markets and complex economics',
                specialty: 'Ratios & Market Analysis'
            },
            {
                id: 'vikram', name: 'Vikram Gupta', title: 'Futures Trader', avatar: '../assets/img/4.png',
                description: 'Advanced contracts and profit optimization',
                specialty: 'Complex Economics & Futures'
            }
        ];
        
        boothsContainer.innerHTML = '';
        
        traders.slice(0, availableTraders + 1).forEach((trader, index) => {
            const boothDiv = document.createElement('div');
            boothDiv.className = `trader-booth ${index >= availableTraders ? 'locked' : ''}`;
            boothDiv.dataset.trader = trader.id;
            boothDiv.setAttribute('tabindex', '0');
            
            boothDiv.innerHTML = `
                <img src="${trader.avatar}" alt="${trader.name}" class="trader-profile-img">
                <h3>${trader.name} - ${trader.title}</h3>
                <p>${trader.description}</p>
                <div class="trader-specialty">Focus: ${trader.specialty}</div>
                <button class="btn btn--secondary btn--lg trade-btn">
                    ${index >= availableTraders ? '🔒 Locked' : 'Start Trading'}
                </button>
            `;
            
            boothsContainer.appendChild(boothDiv);
        });
    }

    openTradingGame(traderId) {
        const problems = this.generateMathProblem(traderId);
        if (!problems) return;
        
        this.currentTradingProblem = {
            problem: problems,
            traderId: traderId
        };
        
        const traders = {
            rajesh: { name: 'Rajesh Singh', avatar: '../assets/img/trader1.png' },
            priya: { name: 'Priya Sharma', avatar: '../assets/img/trader2.png' },
            kumar: { name: 'Kumar Patel', avatar: '../assets/img/trader3.png' },
            anita: { name: 'Anita Reddy', avatar: '../assets/img/4.png' },
            vikram: { name: 'Vikram Gupta', avatar: '../assets/img/4.png' }
        };
        
        const trader = traders[traderId];
        const modal = document.getElementById('trading-modal');
        const title = document.getElementById('trading-modal-title');
        const content = document.getElementById('trading-game-content');
        
        if (!modal || !title || !content) return;
        
        title.textContent = `Trade with ${trader.name} - Cycle ${this.gameState.currentCycle}`;
        
        content.innerHTML = `
            <div class="trader-intro">
                <img src="${trader.avatar}" alt="${trader.name}" class="trader-profile-img modal-trader-img">
                <p><strong>${trader.name} says:</strong><br>"${problems.dialogue}"</p>
            </div>
            <div class="math-problem">
                <div class="math-question">${problems.question}</div>
                <input type="number" class="answer-input" id="trading-answer" placeholder="Enter your answer" step="0.01">
                <button class="btn btn--primary btn--lg" id="submit-answer">Submit Answer</button>
                <div class="feedback" id="trading-feedback"></div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            const answerInput = document.getElementById('trading-answer');
            if (answerInput) {
                answerInput.focus();
            }
        }, 100);
    }

    generateMathProblem(traderId) {
        const harvestedCrops = this.gameState.harvestedCrops;
        if (Object.keys(harvestedCrops).length === 0) {
            this.showAchievement('No crops to trade! Complete harvest first.');
            return null;
        }
        
        const cropTypes = Object.keys(harvestedCrops);
        const randomCrop = cropTypes[Math.floor(Math.random() * cropTypes.length)];
        const cropData = harvestedCrops[randomCrop];
        const crop = this.expandedCrops[randomCrop];
        
        const cycleComplexity = this.gameState.currentCycle;
        
        const problems = {
            rajesh: {
                1: {
                    question: `You have ${cropData.quantity}kg of ${crop.name}. I'll pay ₹${crop.value} per kg. What's the total?`,
                    answer: Math.round(cropData.quantity * crop.value),
                    dialogue: 'I buy in bulk for the cooperative! Let\'s calculate the total value.'
                },
                2: {
                    question: `For ${cropData.quantity}kg of Grade ${cropData.quality} ${crop.name} at ₹${crop.value}/kg, plus 10% bulk bonus, what do you earn?`,
                    answer: Math.round(cropData.quantity * crop.value * 1.1),
                    dialogue: `Grade ${cropData.quality} crops get my special bulk bonus!`
                }
            },
            priya: {
                2: {
                    question: `Your ${cropData.quantity}kg Grade ${cropData.quality} ${crop.name} worth ₹${cropData.value} gets a 25% quality bonus. What's your total?`,
                    answer: Math.round(cropData.value * 1.25),
                    dialogue: 'I pay premium prices for quality! Let\'s calculate your bonus.'
                },
                3: {
                    question: `Base price ₹${crop.value}/kg for ${cropData.quantity}kg, minus 2% processing fee, plus 20% Grade ${cropData.quality} bonus. Final amount?`,
                    answer: Math.round(cropData.quantity * crop.value * 0.98 * 1.2),
                    dialogue: 'Quality matters in international markets!'
                }
            }
        };
        
        const traderProblems = problems[traderId];
        if (!traderProblems) {
            return {
                question: `You have ${cropData.quantity}kg of ${crop.name}. I'll pay ₹${crop.value} per kg. What's the total?`,
                answer: Math.round(cropData.quantity * crop.value),
                dialogue: 'Let\'s do some basic trading math!',
                explanation: `${cropData.quantity} × ${crop.value} = ${Math.round(cropData.quantity * crop.value)}`
            };
        }
        
        const availableComplexity = Math.min(cycleComplexity, Object.keys(traderProblems).length);
        const problem = traderProblems[availableComplexity] || traderProblems[1];
        
        return {
            ...problem,
            explanation: `Working: ${problem.question.includes('bonus') ? 'Base × Bonus = ' + problem.answer : cropData.quantity + ' × ' + crop.value + ' = ' + problem.answer}`
        };
    }

    checkTradingAnswer(problem, traderId) {
        const answerInput = document.getElementById('trading-answer');
        const feedback = document.getElementById('trading-feedback');
        
        if (!answerInput || !feedback) return;
        
        const userAnswer = parseFloat(answerInput.value);
        const tolerance = 0.01;
        
        if (Math.abs(userAnswer - problem.answer) < tolerance || userAnswer === problem.answer) {
            feedback.className = 'feedback correct';
            
            const baseEarnings = 100;
            const cycleMultiplier = 1 + (this.gameState.currentCycle - 1) * 0.3;
            const earnings = Math.round(baseEarnings * cycleMultiplier);
            
            feedback.innerHTML = `
                <div style="margin-bottom: 12px;">🎉 Excellent mathematics! Perfect answer!</div>
                <div style="font-size: 14px; opacity: 0.9;">${problem.explanation}</div>
                <div style="margin-top: 12px; font-weight: bold;">
                    Earned: ₹${earnings} + ${Math.round(earnings/4)} GC Points!
                </div>
            `;
            
            this.gameState.money += earnings;
            this.gameState.gcPoints += Math.round(earnings/4);
            this.gameState.cycleStats.totalEarnings += earnings;
            this.mathCorrectAnswers++;
            
            if (this.mathCorrectAnswers >= 10) {
                this.unlockAchievement('math_wizard');
            }
            
            this.showAchievement(`Great math skills! Earned ₹${earnings}! 🧮`, earnings);
            
            setTimeout(() => {
                this.closeModal('trading-modal');
            }, 3000);
        } else {
            feedback.className = 'feedback incorrect';
            feedback.innerHTML = `
                <div style="margin-bottom: 12px;">Not quite right. Let's learn together!</div>
                <div style="font-size: 14px; opacity: 0.9;"><strong>Correct answer:</strong> ₹${problem.answer}</div>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 8px;"><strong>Solution:</strong> ${problem.explanation}</div>
                <div style="margin-top: 12px;">Practice makes perfect! Try another trader!</div>
            `;
        }
    }

    completeCycle() {
        console.log('Completing cycle...');
        
        // Calculate cycle performance
        const totalHarvestValue = Object.values(this.gameState.harvestedCrops).reduce((sum, crop) => sum + crop.value, 0);
        const averageQuality = this.calculateAverageQuality();
        
        // Update best efficiency
        if (this.gameState.irrigationEfficiency > this.gameState.cycleStats.bestEfficiency) {
            this.gameState.cycleStats.bestEfficiency = this.gameState.irrigationEfficiency;
        }
        
        // Check cycle advancement eligibility
        const canAdvance = this.checkCycleAdvancement();
        
        const modal = document.getElementById('cycle-complete-modal');
        const content = document.getElementById('cycle-results');
        
        if (!modal || !content) {
            console.error('Cycle completion modal not found');
            return;
        }
        
        content.innerHTML = `
            <div class="cycle-summary">
                <h4>🎉 Cycle ${this.gameState.currentCycle} Complete!</h4>
                
                <div class="performance-stats">
                    <div class="stat-row">
                        <span>Irrigation Efficiency:</span>
                        <span>${this.gameState.irrigationEfficiency}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Average Crop Quality:</span>
                        <span>Grade ${averageQuality}</span>
                    </div>
                    <div class="stat-row">
                        <span>Total Harvest Value:</span>
                        <span>₹${totalHarvestValue}</span>
                    </div>
                    <div class="stat-row">
                        <span>GC Points Earned:</span>
                        <span>${this.gameState.gcPoints - 150}</span>
                    </div>
                </div>
                
                <div class="advancement-status">
                    ${canAdvance ? `
                        <div class="advancement-success">
                            <h4>🚀 Ready to Advance!</h4>
                            <p>Excellent work! You've unlocked Cycle ${this.gameState.currentCycle + 1}!</p>
                            <button class="btn btn--primary btn--lg" id="advance-cycle">
                                Advance to Cycle ${this.gameState.currentCycle + 1}
                            </button>
                        </div>
                    ` : `
                        <div class="advancement-locked">
                            <h4>🔒 Advancement Requirements</h4>
                            <p>To unlock the next cycle, you need:</p>
                            <ul>
                                <li>Irrigation efficiency: ${this.getRequiredEfficiency()}%+ (Current: ${this.gameState.irrigationEfficiency}%)</li>
                                <li>Average Grade B+ crops</li>
                            </ul>
                            <button class="btn btn--secondary btn--lg" id="retry-cycle">
                                Retry This Cycle
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Add event listeners for advancement buttons
        const advanceBtn = document.getElementById('advance-cycle');
        const retryBtn = document.getElementById('retry-cycle');
        
        if (advanceBtn) {
            advanceBtn.addEventListener('click', () => {
                this.advanceToNextCycle();
                this.closeModal('cycle-complete-modal');
            });
        }
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.retryCycle();
                this.closeModal('cycle-complete-modal');
            });
        }
        
        // Check cycle achievements
        if (this.gameState.currentCycle >= 3) {
            this.unlockAchievement('cycle_champion');
        }
        
        if (this.gameState.cycleStats.totalEarnings >= 1000) {
            this.unlockAchievement('profit_maximizer');
        }
    }

    calculateAverageQuality() {
        const qualities = Object.values(this.gameState.harvestedCrops).map(crop => crop.quality);
        const qualityScores = {'A': 3, 'B': 2, 'C': 1};
        const averageScore = qualities.reduce((sum, quality) => sum + qualityScores[quality], 0) / qualities.length;
        
        if (averageScore >= 2.5) return 'A';
        if (averageScore >= 1.5) return 'B';
        return 'C';
    }

    checkCycleAdvancement() {
        const requiredEfficiency = this.getRequiredEfficiency();
        const averageQuality = this.calculateAverageQuality();
        
        return this.gameState.irrigationEfficiency >= requiredEfficiency && 
               (averageQuality === 'A' || averageQuality === 'B');
    }

    getRequiredEfficiency() {
        const requirements = {1: 50, 2: 70, 3: 80, 4: 90};
        return requirements[this.gameState.currentCycle] || 90;
    }

    advanceToNextCycle() {
        if (this.gameState.currentCycle < 4) {
            this.gameState.currentCycle++;
            this.gameState.cycleStats.totalCycles++;
            
            // Unlock new crops achievement
            if (this.gameState.currentCycle === 4) {
                this.unlockAchievement('crop_master');
            }
            
            this.showAchievement(`🎉 Advanced to Cycle ${this.gameState.currentCycle}! New crops and challenges await!`, 100);
        } else {
            this.showAchievement('🏆 Congratulations! You\'ve mastered all cycles! You are now a Master Farmer!', 200);
        }
        
        this.resetForNewCycle();
        this.navigateToSection('homepage');
    }

    retryCycle() {
        this.showAchievement('🔄 Retrying cycle with improved strategies!', 25);
        this.resetForNewCycle();
        this.navigateToSection('farm-cycle');
    }

    resetForNewCycle() {
        // Reset phase-specific data
        this.gameState.currentPhase = 'soil';
        this.gameState.plantedCrops = {};
        this.gameState.irrigationSystem = {};
        this.gameState.harvestedCrops = {};
        this.gameState.irrigationEfficiency = 0;
        this.gameState.day = 1;
        this.gameState.growthProgress = {};
        
        // Clear any running intervals
        if (this.growthInterval) {
            clearInterval(this.growthInterval);
        }
        
        // Reset selections
        this.draggedCrop = null;
        this.selectedPipeType = null;
        this.currentTradingProblem = null;
    }

    unlockAchievement(achievementId) {
        if (!this.gameState.achievements.includes(achievementId)) {
            this.gameState.achievements.push(achievementId);
            
            const achievement = this.achievementsList.find(a => a.id === achievementId);
            if (achievement) {
                this.gameState.gcPoints += achievement.reward;
                this.showAchievement(`🏆 ${achievement.name} unlocked! +${achievement.reward} GC`, achievement.reward);

                // Update gallery dynamically - check if current page needs adjustment
                const earnedAchievements = this.achievementsList.filter(a => this.gameState.achievements.includes(a.id));
                const totalPages = Math.ceil(earnedAchievements.length / this.itemsPerPage);
                if (this.currentPage > totalPages) {
                    this.currentPage = totalPages || 1;
                }

                this.setupAchievementGallery();
                this.updateHomepageDisplay(); // Refresh count
            }
        }
    }

    showEducationalPopup(title, content) {
        const modal = document.getElementById('education-modal');
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');
        
        if (!modal || !titleEl || !contentEl) return;
        
        titleEl.textContent = title;
        contentEl.innerHTML = content;
        modal.classList.remove('hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showAchievement(text, points = 0) {
        const notification = document.getElementById('achievement-notification');
        const textEl = notification?.querySelector('.achievement-text');
        const pointsEl = notification?.querySelector('.achievement-points');
        
        if (!notification || !textEl) return;
        
        textEl.textContent = text;
        if (pointsEl && points > 0) {
            pointsEl.textContent = `+${points}`;
            pointsEl.style.display = 'block';
        } else if (pointsEl) {
            pointsEl.style.display = 'none';
        }
        
        notification.classList.remove('hidden');
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('show');
        }, 4000);
    }

    handleKeyboardNavigation(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    this.closeModal(modal.id);
                }
            });
        }
        
        if (e.key === 'h' && e.ctrlKey) {
            e.preventDefault();
            this.navigateToSection('homepage');
        }
    }
}

// Initialize the enhanced game
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Enhanced Smart Farming Simulator...');
    window.enhancedFarmingSimulator = new EnhancedFarmingSimulator();
});