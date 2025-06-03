export default class SmithingUI {
    constructor(game) {
        this.game = game;
        this.player = game.activePlayer;
        this.smithingPanel = null;
        this.smithingPanelOpen = false;
        this.missingIngredients = new Set();
    }

    openSmithingPanel() {
        if (this._smithingPanelOpen) return;

        this.smithingPanel = document.createElement('div');
        this.smithingPanel.id = 'smithing-panel';
        this.smithingPanel.className = 'fixed inset-0 flex items-end justify-center z-50 bg-black bg-opacity-75';

        document.body.appendChild(this.smithingPanel);
        this.showForgeOverview();

        document.getElementById('close-smithing-panel').addEventListener('click', () => {
            this.closeSmithingPanel();
        });

        this._smithingPanelOpen = true;
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

        const html = `
            <div class="w-full max-w-3xl bg-gray-900 text-white p-6 rounded-t-2xl shadow-2xl border-t border-gray-700">
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <h2 class="text-2xl font-bold mb-1">Forge Item</h2>
                    <h2 class="text-2xl font-bold mb-1 text-right">🔨🔨🔨</h2>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div id="forge-overview-design" 
                        class="bg-gray-800 p-4 rounded-xl border-4 ${selectedMaterial?.class ?? 'border-gray-600'} cursor-pointer">
                        <h3 class="font-semibold text-lg mb-2">Design</h3>
                        <p>
                            ${selectedMaterial?.label ?? ""} ${selectedDesign?.label ?? ""} 
                            ${selectedDesign && selectedMaterial ? "🗡️" + selectedDesign.baseDamage * selectedMaterial.damageMultiplier : ""}
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
                    </div>
                </div>
            
                <!-- Buttons -->
                <div class="flex justify-end space-x-4">
                <button class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">Cancel</button>
                <button id="begin-button" 
                    class="bg-green-500 hover:bg-green-600 px-6 py-2 font-bold rounded-lg disabled:bg-gray-500 
                        disabled:cursor-not-allowed disabled:font-normal"
                        ${this.missingIngredients.size > 0 ? "disabled" : ""}>
                        ${this.missingIngredients.size > 0 ? "Missing Ingredients: " + Array.from(this.missingIngredients).join(', ') : "Begin"}
                    </button>
                </div>
            </div>`;

        this.smithingPanel.innerHTML = html;
        document.getElementById('forge-overview-design').addEventListener('click', () => {
            this.showDesignSelection();
        });

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
                baseDamage: 5,
                requiredLevelModifier: 0,
                description: 'A sharp blade for quick strikes.',
                allowedMaterials: Object.keys(this.materials),
                requiredIngredients: {
                    material: 1,
                    wood: 1
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
            }
        };
    
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
        let designsHtml = `<div id="designs-container" class="grid grid-cols-${Object.keys(this.designs).length} gap-4">`;
        designsHtml += Object.entries(this.designs).reduce((html, [key, design]) => {
            return html + `
                <div class="design-option bg-gray-600 p-4 rounded-lg text-center border-4 hidden" data-design="${key}">
                    <h3 class="font-semibold"><span class="design-name"></span><span class="damage-display"></span></h3>
                    <p class="ingredients-display"></p>
                </div>
            `;
        }, '');
        designsHtml += `</div>`;
    
        // Combine HTML
        const html = `
            <div class="w-full max-w-3xl bg-gray-900 text-white p-6 rounded-t-2xl shadow-2xl border-t border-gray-700">
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <h2 class="text-2xl font-bold mb-1">Select Design</h2>
                    <h2 class="text-2xl mb-1 text-right">&times;</h2>
                </div>
                <div class="grid grid-cols-1 gap-4 mb-6">
                    ${materialsHtml}
                    ${designsHtml}
                </div>
            </div>`;
    
        // Update the smithing panel
        this.smithingPanel.innerHTML = html;
    
        // Add event listeners to materials
        const materialOptions = document.querySelectorAll('.material-option');
        materialOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                const selectedMaterial = this.materials[event.currentTarget.dataset.material];
                const damageMultiplier = selectedMaterial.damageMultiplier;
    
                // Highlight the selected material
                materialOptions.forEach(opt => opt.classList.remove('bg-gray-800', 'text-white'));
                event.currentTarget.classList.add('bg-gray-800', 'text-white');
    
                // Show/hide designs based on allowed materials
                const designOptions = document.querySelectorAll('.design-option');
                designOptions.forEach(design => {
                    const selectedDesign = this.designs[design.dataset.design];
                    const allowedMaterials = selectedDesign.allowedMaterials;
                    if (allowedMaterials.includes(selectedMaterial.name)) {
                        design.classList.remove('hidden');
                        design.classList.remove('border-amber-600', 'border-gray-300', 'border-blue-500');
                        design.classList.add(selectedMaterial.class);
                        // Update the damage dynamically
                        const baseDamage = parseInt(selectedDesign.baseDamage, 10);
                        const updatedDamage = baseDamage * damageMultiplier;
                        design.querySelector('.design-name').textContent = `${selectedMaterial.label} ${selectedDesign.name}`;
                        design.querySelector('.damage-display').textContent = `🗡️${updatedDamage}`;
                        design.querySelector('.ingredients-display').innerHTML = `
                            ${selectedDesign.requiredIngredients?.material ?? 0} 🪨 ${selectedMaterial.name}<br>
                            ${selectedDesign.requiredIngredients?.wood ?? 0} 🪵 Wood
                        `;
                    } else {
                        design.classList.add('hidden');
                    }
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

    showSmithing() {

    }

    closeSmithingPanel() {
        if (!this._smithingPanelOpen) return;

        document.body.removeChild(this.smithingPanel);
        this._smithingPanelOpen = false;
    }
}