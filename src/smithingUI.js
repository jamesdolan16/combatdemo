export default class SmithingUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.smithingPanel = null;
        this.smithingPanelOpen = false;
        this.missingIngredients = new Set();
        this.hidden = options?.hidden || true;
        this.externalUI = options?.externalUI || {};
        this.materials = {
            'bronze': {
                name: 'bronze',
                label: 'Bronze',
                description: 'A strong alloy of copper and tin, suitable for basic weapons.',
                damageMultiplier: 1,
                requiredLevel: 1,
                class: 'border-amber-600'
            },
            'iron': {
                name: 'iron',
                label: 'Iron',
                description: 'A common metal known for its strength and durability.',
                damageMultiplier: 2,
                requiredLevel: 10,
                class: 'border-gray-300'
            },
            'steel': {
                name: 'steel',
                label: 'Steel',
                description: 'A refined metal known for its superior strength and sharpness.',
                damageMultiplier: 3,
                requiredLevel: 20,
                class: 'border-blue-500'
            }
        };
    
        this.designs = {
            'dagger': {
                name: 'dagger',
                label: 'Dagger',
                baseDamage: 3,
                requiredLevelModifier: 0,
                description: 'A sharp blade for quick strikes.',
                allowedMaterials: Object.keys(this.materials),
                requiredIngredients: {
                    material: 1,
                    wood: 1
                }
            },
            'spear': {
                name: 'spear',
                label: 'Spear',
                baseDamage: 5,
                requiredLevelModifier: 0,
                description: 'A pole weapon with a pointed tip for thrusting attacks.',
                allowedMaterials: Object.keys(this.materials),
                requiredIngredients: {
                    material: 1,
                    wood: 2
                }
            },
            'shortsword': {
                name: 'shortsword',
                label: 'Shortsword',
                baseDamage: 7,
                requiredLevelModifier: 3,
                description: 'A compact sword for close combat.',
                allowedMaterials: Object.keys(this.materials),
                requiredIngredients: {
                    material: 2,
                    wood: 1
                }
            },
            'mace': {
                name: 'mace',
                label: 'Mace',
                baseDamage: 6,
                requiredLevelModifier: 3,
                description: 'A blunt weapon for crushing blows.',
                allowedMaterials: Object.keys(this.materials),
                requiredIngredients: {
                    material: 2,
                    wood: 1
                }
            },
            'longsword': {
                name: 'longsword',
                label: 'Longsword',
                baseDamage: 10,
                requiredLevelModifier: 7,
                description: 'A balanced sword for versatile combat.',
                allowedMaterials: ['iron', 'steel'],
                requiredIngredients: {
                    material: 3,
                    wood: 1
                }
            },
            'falx1h': {
                name: 'falx1h',
                label: '1H Falx',
                baseDamage: 11,
                requiredLevelModifier: 7,
                description: 'A single-handed falx with a forward-curved blade for hacking.',
                allowedMaterials: ['steel'],
                requiredIngredients: {
                    material: 3,
                    wood: 1
                }
            },
            'greatsword': {
                name: 'greatsword',
                label: 'Greatsword',
                baseDamage: 13,
                requiredLevelModifier: 10,
                description: 'A large sword designed for powerful two-handed strikes.',
                allowedMaterials: ['iron', 'steel'],
                requiredIngredients: {
                    material: 4,
                    wood: 2
                }
            },
            'falx2h': {
                name: 'falx2h',
                label: '2H Falx',
                baseDamage: 15,
                requiredLevelModifier: 10,
                description: 'A two-handed falx with a long, curved blade for devastating blows.',
                allowedMaterials: ['steel'],
                requiredIngredients: {
                    material: 4,
                    wood: 2
                }
            },
            'warhammer': {
                name: 'warhammer',
                label: 'Warhammer',
                baseDamage: 18,
                requiredLevelModifier: 10,
                description: 'A slow heavy weapon designed for smashing through armor.',
                allowedMaterials: ['iron', 'steel'],
                requiredIngredients: {
                    material: 5,
                    wood: 3
                }
            }
        };
    }

    openSmithingPanel() {
        if (this._smithingPanelOpen) return;

        this.externalUI.inventory.show();

        this.smithingPanel = document.createElement('div');
        this.smithingPanel.id = 'smithing-panel';
        this.smithingPanel.className = 'fixed inset-0 flex items-end justify-center z-40 bg-black/50';
        this.smithingPanel.innerHTML = `
            <div class="created-item hidden fixed inset-0 flex items-center justify-center z-50 bg-black/50 text-white">
                <div class="w-full max-w-md h-full max-h-64 bg-gray-900 p-6 rounded-lg shadow-lg">
                    <div class="relative mb-6">
                        <h2 data-id="item-name" class="text-2xl font-bold mb-2">Finished forging</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <p data-id="item-damage" class="text-lg mb-4"></p>
                    <p data-id="xp-gain" class="text-lg mb-4"></p>
                </div>
            </div>
            <div class="forge-overview w-full max-w-3xl bg-gray-900 text-white p-6 rounded-t-2xl shadow-2xl border-t border-gray-700">
                <div class="relative mb-6">
                    <h2 class="panel-heading text-2xl font-bold mb-1"></h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="panel-content"></div>
            </div>
        `;
        this.smithingPanelContent = this.smithingPanel.querySelector('.panel-content');
        this.createdItemPanel = this.smithingPanel.querySelector('.created-item');
        
        this.smithingPanel.querySelector('.forge-overview .close-button').addEventListener('click', () => {
            this.closeSmithingPanel();
        });

        this.createdItemPanel.querySelector('.close-button').addEventListener('click', () => {
            this.closeCreatedItemPanel();
        });

        document.body.appendChild(this.smithingPanel);
        this.showForgeOverview();

        this._smithingPanelOpen = true;
    }

    closeCreatedItemPanel() {
        this.createdItemPanel.classList.add('hidden');
    }

    showCreatedItemPanel(item, xp) {
        if (!item) return;

        const itemName = this.createdItemPanel.querySelector('[data-id="item-name"]');
        const itemDamage = this.createdItemPanel.querySelector('[data-id="item-damage"]');
        const xpGain = this.createdItemPanel.querySelector('[data-id="xp-gain"]');
        
        itemName.textContent = item.label;
        itemName.classList.remove("ruined", "damaged", "workable", "refined", "masterful", "mythic");
        itemName.classList.add(item.craftsmanshipModifier);
        itemDamage.innerHTML = `🗡️ ${item.damage}`;
        if (item.damageBuff && item.damageBuff !== 0){
            let style = "";
            let prefix = "";
            if(item.damageBuff > 0) {
                style = "buff";
                prefix = "+";
            } else {
                style = "debuff";
            }
            itemDamage.innerHTML += `
                <span class="italic ${style}">
                    ${prefix}${item.damageBuff}
                </span>`;
        }
        xpGain.innerHTML = `
            <span class="xp-icon">XP</span>
            <span class="xp">+${xp}</span>`;

        this.createdItemPanel.classList.remove('hidden');
    }

    displayRequiredIngredients(design, material) {
        if (!design || !material) return "";

        const requiredIngredients = design.requiredIngredients;
        let ingredientsHtml = "";

        this.missingIngredients.clear();

        if (requiredIngredients.material) {
            ingredientsHtml += `${requiredIngredients.material} 🪨 ${material.label}`;
            const materialInInventory = this.player.inventory.find(item => item.item === material.name)?.quantity ?? 0;
            ingredientsHtml += `, You have ${materialInInventory}`;
            if (materialInInventory < requiredIngredients.material) {
                this.missingIngredients.add(material.label);
            }
        }

        if (requiredIngredients.wood) {
            ingredientsHtml += `<br>${requiredIngredients.wood} 🪵 Wood`;
            const woodInInventory = this.player.inventory.find(item => item.item === 'wood')?.quantity ?? 0;
            ingredientsHtml += `, You have ${woodInInventory}`;
            if (woodInInventory < requiredIngredients.wood) {
                this.missingIngredients.add('Wood');
            }
        }

        return `<p>${ingredientsHtml}</p>`;
    }   

    showForgeOverview(options = {}) {
        const selectedDesign = this.designs?.[options.selectedDesign] || null;
        const selectedMaterial = this.materials?.[options.selectedMaterial] || null;
        const smithingAllowed = this.smithingAllowed(selectedDesign, selectedMaterial);
        const html = `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div id="forge-overview-design" 
                    class="bg-gray-800 p-4 rounded-xl border-4 ${selectedMaterial?.class ?? 'border-gray-600'} cursor-pointer">
                    <h3 class="font-semibold text-lg mb-2">Design</h3>
                    <p>
                        ${selectedMaterial?.label ?? ""} ${selectedDesign?.label ?? ""} 
                        ${selectedDesign && selectedMaterial ? "🗡️" + selectedDesign.baseDamage * selectedMaterial.damageMultiplier : ""}
                    </p>
                    <p data-id="level-requirement" class="italic text-blue-400">
                        ${selectedDesign ? `Requires Smithing Level ${selectedDesign.requiredLevelModifier + selectedMaterial?.requiredLevel}` : ""}
                    </p>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl">
                    <h3 class="font-semibold text-lg mb-2">Requires</h3>
                    <span data-id="required-ingredients"></span>
                </div>
            </div>
        
            <div class="grid grid-cols-1 gap-4 mb-6">
                <div class="bg-gray-800 p-4 rounded-xl">
                    <h3 class="font-semibold text-lg mb-2">📊 Skill Impact</h3>
                    <div data-id="skill-impact"></div>
                </div>
            </div>
        
            <div class="flex justify-end space-x-4">
                <button data-id="auto-button"
                    class="bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-lg disabled:bg-gray-500 
                        disabled:cursor-not-allowed disabled:font-normal"
                    ${smithingAllowed ? "": "disabled"}>
                    Auto ⚙️
                </button>
                <button data-id="begin-button" 
                    class="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg disabled:bg-gray-500 
                        disabled:cursor-not-allowed disabled:font-normal"
                    ${smithingAllowed ? "": "disabled"}>
                    ${this.missingIngredients.size > 0 ? "Missing Ingredients: " + Array.from(this.missingIngredients).join(', ') : "Begin 🔨"}
                </button>
            </div>`;

        this.smithingPanelContent.innerHTML = html;
        this.smithingPanel.querySelector('.panel-heading').textContent = 'Basic Forge';
        this.smithingPanelContent.querySelector('#forge-overview-design').addEventListener('click', () => {
            this.showDesignSelection();
        });

        this.smithingPanelContent.querySelector('[data-id="auto-button"]').addEventListener('click', () => {
            if (smithingAllowed) {
                this.autoForge(selectedDesign, selectedMaterial);
            }
        });

        this.smithingPanelContent.querySelector('[data-id="begin-button"]').addEventListener('click', () => {
            if (smithingAllowed) {
                this.showForgeMinigame(selectedDesign, selectedMaterial);
            }
        });

        this.smithingPanelRequiredIngredients = this.smithingPanelContent.querySelector('[data-id="required-ingredients"]');
        this.smithingPanelRequiredIngredients.innerHTML = this.displayRequiredIngredients(selectedDesign, selectedMaterial);
        this.game.eventEmitter.on("playerInventoryUpdated", () => {
            this.smithingPanelRequiredIngredients.innerHTML = this.displayRequiredIngredients(selectedDesign, selectedMaterial);
        });

        this.smithingPanelSkillImpact = this.smithingPanelContent.querySelector('[data-id="skill-impact"]');
        this.smithingPanelSkillImpact.innerHTML = this.displaySkillImpact(selectedDesign, selectedMaterial);
        this.game.eventEmitter.on("playerSkillsUpdated", () => {
            this.smithingPanelSkillImpact.innerHTML = this.displaySkillImpact(selectedDesign, selectedMaterial);
        });
    }

    displaySkillImpact(design, material) {
        const smithing = this.getXP();
        return `
            <p>Smithing: 
                <span class="text-purple-400">
                    Lvl  ${smithing.current} [${smithing.xpNextLevel} xp to next level]
                </span>
            </p>
            ${this.displayAutoChance(design, material)}`;
    }

    beginForging(design, material) {
        
    }

    showForgeMinigame(design, material) {
        const html = `
            <div class="bg-gray-900 text-white p-4 rounded-lg shadow-xl space-y-6 max-w-5xl mx-auto">
                <!-- Temperature Bar -->
                <div>
                    <label class="block text-sm font-bold mb-1">Maintain Temperature</label>
                    <div class="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div class="absolute left-1/3 w-1/3 h-full bg-orange-400 opacity-80"></div>
                        <div class="absolute left-1/2 w-1 h-full bg-white"></div> <!-- cursor -->
                    </div>
                </div>

                <!-- Strike Minigame Ring -->
                <div class="flex justify-center">
                    <div class="relative w-40 h-40 rounded-full border-4 border-gray-600 flex items-center justify-center">
                        <div class="w-48 h-48 mx-auto relative">
                            <svg viewBox="0 0 100 100" class="w-full h-full transform" id="strike-ring">
                                <line id="strike-cursor"
                                    x1="50" y1="50" x2="50" y2="5"
                                    stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Temperature Control + Quench Options -->
                <div class="grid grid-cols-2 gap-6">
                    <!-- Heat Workpiece -->
                    <div>
                        <label class="block text-sm font-bold mb-1">Heat Workpiece</label>
                        <div class="h-40 w-10 bg-gray-700 rounded-lg relative mx-auto">
                            <div class="absolute bottom-0 w-full bg-yellow-500 h-1/2 rounded-b-lg"></div>
                        </div>
                        <div class="text-center mt-2 text-xs text-gray-400">Current Temp</div>
                    </div>

                    <!-- Quenching -->
                    <div>
                        <label class="block text-sm font-bold mb-1">Quenching</label>
                        <div class="w-full h-6 bg-gray-700 rounded-full overflow-hidden mb-2">
                            <div class="w-1/3 h-full bg-blue-500 opacity-70"></div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">Water</button>
                            <button class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">Oil</button>
                            <button class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">Enchanted</button>
                        </div>
                    </div>
                </div>
            </div>`;

        this.smithingPanelContent.innerHTML = html;
        this.createStrikeZones();
    }

    polarToCartesian(cx, cy, r, angleDeg) {
        const angleRad = (angleDeg - 90) * Math.PI / 180.0;
        return {
          x: cx + r * Math.cos(angleRad),
          y: cy + r * Math.sin(angleRad)
        };
      }
      
    describeArc(cx, cy, r, startAngle, endAngle) {
        const start = this.polarToCartesian(cx, cy, r, endAngle);
        const end = this.polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
        return [
          "M", start.x, start.y,
          "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    }
      
    createStrikeZones() {
        const svg = document.getElementById("strike-ring");
        const zones = [
            { start: 0, end: 100, color: "#ef4444" },     // Red
            { start: 100, end: 150, color: "#f97316" },   // Orange
            { start: 150, end: 170, color: "#22c55e" },   // Green (tight!)
            { start: 170, end: 220, color: "#f97316" },   // Orange
            { start: 220, end: 360, color: "#ef4444" },   // Red
        ];
      
        zones.forEach(zone => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", this.describeArc(50, 50, 45, zone.start, zone.end));
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", zone.color);
          path.setAttribute("stroke-width", "10");
          svg.insertBefore(path, svg.firstChild); // ensure cursor is on top
        });
    }

    autoForge(design, material) {
        if (!design || !material) return;

        const requiredLevel = design.requiredLevelModifier + material.requiredLevel;
        if (this.player.skills.smithing.level < requiredLevel) {
            alert(`You need Smithing Level ${requiredLevel} to forge this item.`);
            return;
        }

        const requiredIngredients = design.requiredIngredients;
        const materialInInventory = this.player.inventory.find(item => item.item === material.name)?.quantity ?? 0;
        const woodInInventory = this.player.inventory.find(item => item.item === 'wood')?.quantity ?? 0;

        if ((requiredIngredients.material && materialInInventory < requiredIngredients.material) ||
            (requiredIngredients.wood && woodInInventory < requiredIngredients.wood)) {
            alert("You do not have enough ingredients to forge this item.");
            return;
        }

        // Simulate forging process
        const chance = this.calculateAutoChance(this.player.skills.smithing.level, requiredLevel);
        let forgedItem = {
            damage: design.baseDamage * material.damageMultiplier,
            type: design.name,
            material: material.name
        };
        let xp = 0;
        
        if (Math.random() * 100 < chance) {
            // Successful forge
            forgedItem.craftsmanshipModifier = 'workable';
            forgedItem.damageBuff = 3;
            xp = 10;
        } else {
            forgedItem.craftsmanshipModifier = 'ruined';
            forgedItem.damageBuff = -forgedItem.damage;
        }
        forgedItem.item = `${forgedItem.material} ${forgedItem.type}`;
        forgedItem.label = `${forgedItem.material} ${forgedItem.type}`;

        this.showCreatedItemPanel(forgedItem, xp);

        this.player.inventory.push(forgedItem);
        this.player.inventory.find(item => item.item === material.name).quantity -= requiredIngredients.material;
        this.player.inventory.find(item => item.item === 'wood').quantity -= requiredIngredients.wood;
        this.game.eventEmitter.emit('playerInventoryUpdated');

        this.player.skills.smithing.xp += xp;
        this.game.eventEmitter.emit('playerSkillsUpdated');
    }

    smithingAllowed(design, material) {
        if (!design || !material) return false;

        const requiredLevel = design.requiredLevelModifier + material.requiredLevel;
        if (this.player.skills.smithing.level < requiredLevel) {
            return false;
        }

        const requiredIngredients = design.requiredIngredients;
        const materialInInventory = this.player.inventory.find(item => item.item === material.name)?.quantity ?? 0;
        const woodInInventory = this.player.inventory.find(item => item.item === 'wood')?.quantity ?? 0;

        if ((requiredIngredients.material && materialInInventory < requiredIngredients.material) ||
            (requiredIngredients.wood && woodInInventory < requiredIngredients.wood)) {
            return false;
        }

        return true;
    }

    displayAutoChance(design, material) {
        if (!design || !material) return "";

        const chance = this.calculateAutoChance(this.player.skills.smithing.level, design.requiredLevelModifier + material.requiredLevel);
        return `<p>Chance of successful auto: <span class="text-purple-400">${chance}%</span></p>`;
    }

    calculateAutoChance(playerLevel, itemLevel) {
        const scalingFactor = 5; // 5% change per level difference
        let chance = 20 + (playerLevel - itemLevel) * scalingFactor;

        // Clamp the chance between 0% and 100%
        chance = Math.max(0, Math.min(100, chance));

        return chance;
    }

    getXP() {
        const levelBoundaries = this.player.skills.smithing.levelBoundaries;
        const currentLevel = this.player.skills.smithing.level;

        // Get the XP this.levelBoundaries for the current and next levels
        const currentLevelXp = levelBoundaries[currentLevel];
        const nextLevelXp = levelBoundaries[currentLevel + 1] || this.levelBoundaries[levelBoundaries.length - 1]; // Handle max level

        // Calculate progress
        const progress = this.player.skills.smithing.xp - currentLevelXp;
        const totalToNextLevel = nextLevelXp - currentLevelXp;

        return {
            current: currentLevel, 
            xpNextLevel: totalToNextLevel - progress // Return the XP needed to reach the next level
        }
    }
    
    showDesignSelection() {
        // Generate materials HTML
        let materialsHtml = `<div class="grid grid-cols-${Object.keys(this.materials).length} gap-4">`;
        materialsHtml += Object.entries(this.materials).reduce((html, [key, material]) => {
            return html + `
                <div class="material-option bg-gray-600 p-4 rounded-lg text-center cursor-pointer border-4 ${material.class} hover:bg-gray-700 transition-colors duration-200"
                    data-material="${key}">
                    ${material.label}
                </div>
            `;
        }, '');
        materialsHtml += `</div>`;
    
        // Generate designs HTML
        let designsHtml = `<div id="designs-container" 
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-96">`;
        designsHtml += Object.entries(this.designs).reduce((html, [key, design]) => {
            return html + `
                <div class="relative design-option bg-gray-600 p-4 rounded-lg text-center border-4 cursor-pointer hidden" data-design="${key}">
                    <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center mb-2 bg-black/70 cursor-default" 
                        onclick="event.stopPropagation();" 
                        data-id="requirementBlock">
                    </div>
                    <h3 class="font-semibold"><span class="design-name"></span><br><span class="damage-display"></span></h3>
                    <p class="ingredients-display"></p>
                </div>
            `;
        }, '');
        designsHtml += `</div>`;
    
        // Combine HTML
        const html = `
            <div class="grid grid-cols-1 gap-4 mb-6">
                ${materialsHtml}
                ${designsHtml}
            </div>`;
    
        // Update the smithing panel
        this.smithingPanelContent.innerHTML = html;
        this.smithingPanel.querySelector('.panel-heading').textContent = 'Design Selection';
    
        // Add event listeners to materials
        const materialOptions = document.querySelectorAll('.material-option');
        materialOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const selectedMaterial = this.materials[event.currentTarget.dataset.material];
    
                // Highlight the selected material
                materialOptions.forEach(opt => opt.classList.remove('bg-gray-800', 'text-white'));
                event.currentTarget.classList.add('bg-gray-800', 'text-white');
    
                // Show/hide designs based on allowed materials
                const designOptions = document.querySelectorAll('.design-option');
                designOptions.forEach(design => {
                    const selectedDesign = this.designs[design.dataset.design];
                    this.setDesignOption(design, selectedMaterial);
                });
            });
        });

        const designOptions = document.querySelectorAll('.design-option');
        designOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const selectedDesign = event.currentTarget.dataset.design;
                const selectedMaterial = document.querySelector('.material-option.bg-gray-800').dataset.material;
                this.showForgeOverview({
                    selectedDesign, 
                    selectedMaterial
                });
            });
        });
    }

    setDesignOption(designElement, material) {
        const design = this.designs[designElement.dataset.design];
        const allowedMaterials = design.allowedMaterials;
        if (allowedMaterials.includes(material.name)) {
            const requirementBlock = designElement.querySelector('[data-id="requirementBlock"]');
            const damageMultiplier = material.damageMultiplier;

            designElement.classList.remove('hidden');
            designElement.classList.remove('border-amber-600', 'border-gray-300', 'border-blue-500');
            designElement.classList.add(material.class);
            // Update the damage dynamically
            const baseDamage = parseInt(design.baseDamage, 10);
            const updatedDamage = baseDamage * damageMultiplier;
            designElement.querySelector('.design-name').textContent = `${material.label} ${design.label}`;
            designElement.querySelector('.damage-display').textContent = `🗡️${updatedDamage}`;
            designElement.querySelector('.ingredients-display').innerHTML = `
                ${design.requiredIngredients?.material ?? 0} 🪨 ${material.label}<br>
                ${design.requiredIngredients?.wood ?? 0} 🪵 Wood
            `;

            if (this.player.skills.smithing.level < design.requiredLevelModifier + material.requiredLevel) {
                requirementBlock.textContent = `Requires Smithing Level ${design.requiredLevelModifier + material.requiredLevel}`;
                requirementBlock.classList.remove('hidden');
            } else {
                requirementBlock.classList.add('hidden');
                designElement.classList.remove('cursor-not-allowed');
            }
        } else {
            designElement.classList.add('hidden');
        }
    }

    showSmithing() {

    }

    closeSmithingPanel() {
        if (!this._smithingPanelOpen) return;

        document.body.removeChild(this.smithingPanel);
        this._smithingPanelOpen = false;
    }
}