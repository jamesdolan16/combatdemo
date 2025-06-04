export default class SmithingUI {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        this.smithingPanel = null;
        this.smithingPanelOpen = false;
        this.missingIngredients = new Set();
        this.hidden = options?.hidden || true;
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

        this.smithingPanel = document.createElement('div');
        this.smithingPanel.id = 'smithing-panel';
        this.smithingPanel.className = 'fixed inset-0 flex items-end justify-center z-40 bg-black bg-opacity-75';
        this.smithingPanel.innerHTML = `
            <div class="created-item hidden fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-90 text-white">
                <div class="w-full max-w-md h-full max-h-64 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div class="relative mb-6">
                        <h2 class="item-name text-2xl font-bold mb-2">Finished forging</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <h2 class="item-name text-2xl font-bold mb-2"></h2>
                    <p class="item-damage text-lg mb-4"></p>
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
        createdItemPanel.classList.add('hidden');
    }

    showCreatedItemPanel(item) {
        if (!item) return;

        const itemName = this.createdItemPanel.querySelector('.item-name');
        const itemDamage = this.createdItemPanel.querySelector('.item-damage');

        itemName.textContent = item.label;
        itemDamage.innerHTML = `🗡️ ${item.damage} <span class="italic text-green-400">+3</span>`;

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
                    ${this.displayRequiredIngredients(selectedDesign, selectedMaterial)}
                </div>
            </div>
        
            <div class="grid grid-cols-1 gap-4 mb-6">
                <div class="bg-gray-800 p-4 rounded-xl">
                    <h3 class="font-semibold text-lg mb-2">📊 Skill Impact</h3>
                    <p>Smithing: 
                        <span class="text-purple-400">
                            Lvl  ${this.player.skills.smithing.level} [${this.getXpToNextLevel()} xp to next level]
                        </span>
                    </p>
                    ${this.displayAutoChance(selectedDesign, selectedMaterial)}
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
        if (Math.random() * 100 < chance) {
            // Successful forge
            const forgedItem = {
                label: `${material.label} ${design.label}`,
                damage: design.baseDamage * material.damageMultiplier,
                type: design.name,
                material: material.name
            };
            this.showCreatedItemPanel(forgedItem);
            // Update player's inventory
            this.player.inventory.push(forgedItem);
            // Deduct ingredients
            this.player.inventory.find(item => item.item === material.name).quantity -= requiredIngredients.material;
            this.player.inventory.find(item => item.item === 'wood').quantity -= requiredIngredients.wood;
        } else {
            alert("Forging failed! Better luck next time.");
        }
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

    getXpToNextLevel() {
        this.levelBoundaries = [
            -1, 0, 50, 120, 200, 300, 420, 560, 720, 900, 
            1100, 1320, 1560, 1820, 2100, 2400, 2720, 3060, 3420, 3800, 
            4200, 4620, 5060, 5520, 6000, 6500, 7020, 7560, 8120, 8700, 9300
        ];

        // Find the current level
        let currentLevel = 0;
        for (let i = 0; i < this.levelBoundaries.length; i++) {
            if (this.player.skills.smithing.xp < this.levelBoundaries[i]) {
                break;
            }
            currentLevel = i;
        }

        // Get the XP this.levelBoundaries for the current and next levels
        const currentLevelXp = this.levelBoundaries[currentLevel];
        const nextLevelXp = this.levelBoundaries[currentLevel + 1] || this.levelBoundaries[this.levelBoundaries.length - 1]; // Handle max level

        // Calculate progress
        const progress = this.player.skills.smithing.xp - currentLevelXp;
        const totalToNextLevel = nextLevelXp - currentLevelXp;

        return totalToNextLevel - progress; // Return the XP needed to reach the next level
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