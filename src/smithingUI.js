import Item from "./item";

export default class SmithingUI {
    constructor(manager, options = {}) {
        this.manager = manager;
        this.game = manager.game;
        this.player = manager.game.activePlayer;
        this.repo = manager.repo;

        this.smithingPanel = null;
        this.smithingPanelOpen = false;

        this.hidden = options?.hidden || true;
        this.externalUI = options?.externalUI || {};

        this.intervals = {};

        this.selectedMaterial = null;
        this.selectedDesign = null;

        /**
         * Different to selectedDesign somehow
         */
        this.currentDesign = null;

        this.forgingProgress = 0;
        this.forgingQuality = 1;    // Start at 1 so the item isnt instantly ruined

        this.isOpen = false;
    }

    clearIntervals() {
        Object.values(this.intervals).forEach((interval) => clearInterval(interval));
    }

    closeSmithingPanel() {
        if (!this.isOpen) return;

        this.smithingPanel.classList.add('hidden');
        this.clearIntervals();

        this.isOpen = false;
    }
    
    openSmithingPanel() {
        if (!this.smithingPanel) this.createSmithingPanel();
        else this.smithingPanel.classList.remove('hidden');

        this.externalUI.inventory.show();
        this.showForgeOverview();

        this.isOpen = true;
    }

    getCreatedItemPanelHTML() {
        return `
            <div class="created-item hidden fixed inset-0 flex items-center justify-center z-50 bg-black/50 text-white">
                <div class="w-full max-w-md h-full max-h-64 bg-gray-900 p-3 rounded-lg shadow-lg relative">
                    <div class="relative mb-6">
                        <h2 data-id="item-name" class="text-2xl font-bold mb-2">Finished forging</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <p data-id="item-damage" class="text-lg mb-4"></p>
                    <p data-id="xp-gain" class="text-lg mb-4"></p>
                    <div class="absolute bottom-2 left-0 right-0 px-3">
                        <div class="w-full h-3 flex flex-row bg-gray-700 rounded-full overflow-hidden">
                            <div data-id="old-xp-bar" class="h-full bg-green-500" style="width: 0%;"></div>
                            <div data-id="new-xp-bar" class="h-full bg-green-300 transition-all duration-300" style="width: 0%; left: 0%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSmithingPanel() {
        this.smithingPanel = document.createElement('div');
        this.smithingPanel.id = 'smithing-panel';
        this.smithingPanel.className = 'fixed inset-0 flex items-end justify-center z-40 bg-black/50';
        this.smithingPanel.innerHTML = `
            ${this.getCreatedItemPanelHTML()}
            <div class="forge-overview w-full max-w-3xl bg-gray-900 text-white p-3 rounded-t-2xl shadow-2xl border-t border-gray-700">
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
    }

    closeCreatedItemPanel() {
        this.createdItemPanel.classList.add('hidden');
    }

    showCreatedItemPanel(item, xp) {
        if (!item) return;

        const itemName = this.createdItemPanel.querySelector('[data-id="item-name"]');
        const itemDamage = this.createdItemPanel.querySelector('[data-id="item-damage"]');
        const xpGain = this.createdItemPanel.querySelector('[data-id="xp-gain"]');
        const oldXpBar = this.createdItemPanel.querySelector('[data-id="old-xp-bar"]');
        const newXpBar = this.createdItemPanel.querySelector('[data-id="new-xp-bar"]');

        itemName.textContent = item.label;
        itemName.classList.remove("ruined", "damaged", "workable", "refined", "masterful", "mythic");
        itemName.classList.add(item.craftsmanshipModifier);
        itemDamage.innerHTML = `🗡️ ${item.damage}`;
        if (item.damageBuff && item.damageBuff !== 0) {
            let style = "";
            let prefix = "";
            if (item.damageBuff > 0) {
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

        const currentXP = this.player.skills.smithing.xp;
        const gainedXP = xp;
        const xpToNext = this.player.skills.smithing.xpToNextLevel;
        
        // Percentages
        const oldPercent = Math.min(100, (currentXP / xpToNext) * 100);
        const gainedPercent = Math.min(100 - oldPercent, (gainedXP / xpToNext) * 100);

        oldXpBar.style.width = `${oldPercent}%`;
        newXpBar.style.left = `${oldPercent}%`;
        newXpBar.style.width = `${gainedPercent}%`;

        this.createdItemPanel.classList.remove('hidden');
    }

    displayRequiredIngredients() {
        let element = document.createElement('div');
        element.classList.add('flex', 'flex-row', 'flex-wrap');
        
        if (this.currentDesign) {
            Object.values(this.currentDesign.extraData.ingredients).forEach(
                ingredient => element.appendChild(ingredient.generateDOMElement())
            );
        }
        
        return element;
    }

    showForgeOverview(options = {}) {
        const smithingAllowed = this.manager.smithingAllowed();
        const html = `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div id="forge-overview-design" 
                    class="bg-gray-800 p-4 rounded-xl border-4 ${this.selectedMaterial?.class ?? 'border-gray-600'} cursor-pointer">
                    <h3 class="font-semibold text-lg mb-2">Design</h3>
                    <p>
                        ${this.selectedMaterial?.label ?? ""} ${this.selectedDesign?.label ?? ""} 
                        ${this.selectedDesign && this.selectedMaterial ? "🗡️" + this.selectedDesign.baseDamage * this.selectedMaterial.damageMultiplier : ""}
                    </p>
                    <p data-id="level-requirement" class="italic text-blue-400">
                        ${this.selectedDesign ? `Requires Smithing Level ${this.selectedDesign.requiredLevelModifier + this.selectedMaterial?.requiredLevel}` : ""}
                    </p>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl">
                    <h3 class="font-semibold text-lg mb-2">Requires</h3>
                    <div data-id="required-ingredients"></div>
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
                    ${smithingAllowed.allowed ? "" : "disabled"}>
                    Auto ⚙️
                </button>
                <button data-id="begin-button" 
                    class="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg disabled:bg-gray-500 
                        disabled:cursor-not-allowed disabled:font-normal"
                    ${smithingAllowed.allowed ? "" : "disabled"}>
                    ${smithingAllowed.reasons?.length > 0 ? smithingAllowed.reasons.join(' ') : "Begin 🔨"}
                </button>
            </div>`;

        this.smithingPanelContent.innerHTML = html;
        this.smithingPanel.querySelector('.panel-heading').textContent = 'Basic Forge';
        this.smithingPanelContent.querySelector('#forge-overview-design').addEventListener('click', () => {
            this.showDesignSelection();
        });

        this.smithingPanelContent.querySelector('[data-id="auto-button"]').addEventListener('click', () => {
            if (smithingAllowed) {
                this.autoForge(this.selectedDesign, this.selectedMaterial);
            }
        });

        this.smithingPanelContent.querySelector('[data-id="begin-button"]').addEventListener('click', () => {
            if (smithingAllowed) {
                this.showForgeMinigame(this.selectedDesign, this.selectedMaterial);
            }
        });

        this.smithingPanelRequiredIngredients = this.smithingPanelContent.querySelector('[data-id="required-ingredients"]');
        this.smithingPanelRequiredIngredients.replaceChildren(
            this.displayRequiredIngredients(this.selectedDesign, this.selectedMaterial));
        this.game.eventEmitter.on("playerInventoryUpdated", () => {
            this.smithingPanelRequiredIngredients.replaceChildren(
                this.displayRequiredIngredients(this.selectedDesign, this.selectedMaterial));
        });

        this.smithingPanelSkillImpact = this.smithingPanelContent.querySelector('[data-id="skill-impact"]');
        this.smithingPanelSkillImpact.innerHTML = this.displaySkillImpact(this.selectedDesign, this.selectedMaterial);
        this.game.eventEmitter.on("playerSkillsUpdated", () => {
            this.smithingPanelSkillImpact.innerHTML = this.displaySkillImpact(this.selectedDesign, this.selectedMaterial);
        });
    }

    displaySkillImpact(design, material) {
        if (!design || !material) return "";

        const smithing = this.manager.getXP();
        return `
            <p>Smithing: 
                <span class="text-purple-400">
                    Lvl  ${smithing.current} [${smithing.xpNextLevel} xp to next level]
                </span>
            </p>
            ${this.displayAutoChance(design, material)}
        `;
    }

    async showForgeMinigame() {
        const html = `
            <div class="bg-gray-900 text-white p-4 rounded-lg shadow-xl space-y-6 max-w-5xl mx-auto mb-4">
                <label class="block text-sm font-bold mb-1">
                    Forge Temperature: <span id="forge-temp-label">100</span>°
                </label>
                <div class="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-sky-400 via-orange-400 to-red-600 opacity-80"></div>
                    <div id="forge-temp-cursor" class="absolute top-0 w-1 h-full bg-white transition-all duration-50"></div>
                </div>

                <label class="block text-sm font-bold mb-1">
                    Workpiece Temperature: <span id="workpiece-temp-label">100</span>°
                </label>
                <div class="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden mt-2">
                    <div id="ideal-temp-zone" class="absolute h-full bg-green-500 opacity-50 rounded"></div>
                    <div id="workpiece-temp-cursor" class="absolute top-0 w-1 h-full bg-white transition-all duration-50"></div>
                </div>
            </div>

            <div class="flex justify-center">
                <div data-id="strike-button" class="relative w-40 h-40 rounded-full border-4 border-gray-600 flex items-center justify-center cursor-crosshair">
                    <div class="w-48 h-48 mx-auto relative">
                        <svg viewBox="0 0 100 100" class="w-full h-full transform" id="strike-ring">
                            <line data-id="strike-cursor"
                                x1="50" y1="50" x2="50" y2="5"
                                stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="mt-4 space-x-2">
                <button data-id="stoke-forge" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Stoke Forge</button>
                <button data-id="heat-workpiece" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">Heat Workpiece</button>
            </div>

            <div class="mt-4">
                <label class="block text-sm font-bold mb-1">Forging Progress</label>
                <div class="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div id="progress-bar" class="h-full bg-green-500 rounded-full transition-all" style="width: 0%;"></div>
                </div>
            </div>

            <div class="mt-2">
                <label class="block text-sm font-bold mb-1">Item Quality</label>
                <div class="relative w-full h-4 rounded overflow-hidden bg-gray-800">
                    <div class="absolute left-0 w-[10%] h-full bg-ruined"></div>
                    <div class="absolute left-[10%] w-[24%] h-full bg-damaged"></div>
                    <div class="absolute left-[34%] w-[30%] h-full bg-workable"></div>
                    <div class="absolute left-[64%] w-[20%] h-full bg-refined"></div>
                    <div class="absolute left-[84%] w-[15%] h-full bg-masterful"></div>
                    <div class="absolute left-[98%] w-[2%] h-full bg-mythic"></div>

                    <div id="quality-bar" 
                        class="absolute top-0 h-full w-1 px-[2px] transform -translate-x-1/2 border-x-2 border-black bg-white/80"></div>
                </div>
            </div>`;

        this.smithingPanelContent.innerHTML = html;
        
        this.strikeCursor = this.smithingPanelContent.querySelector('[data-id="strike-cursor"]');
        
        this.resetForge();
        this.manager.updateIdealTemperatureZone();
        this.setupStokeForgeButton();
        this.setupStrikeButton();
        this.setupStrikeCircle();
        this.setupHeatWorkpieceButton();

        this.manager.consumeIngredients();
    }
     
    resetForge() {
        this.strikeCursorAngle = 0;
        this.forgingProgress = 0;
        this.forgingQuality = 1;
        this.forgeTemperature.value = 15;
        this.workpieceTemperature.value = 15;
        this.clearIntervals();
    }

    setupStrikeButton() {
        this.strikeButton = this.smithingPanelContent.querySelector('[data-id="strike-button"]');
        this.strikeButton.addEventListener('click', () => {
            this.manager.handleStrike(this.strikeCursorAngle);
        });

        this.rotateCursor();
        this.intervals.decayTemp = setInterval(() => {
            this.updateTempCursor(this.forgeTemperature);
            this.updateTempCursor(this.workpieceTemperature);
        }, 50); 
    }
    
    setupStrikeCircle() {
        const svg = document.getElementById("strike-ring");
        const zones = this.manager.generateStrikeZones();

        zones.forEach(zone => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", this.describeArc(50, 50, 45, zone.start, zone.end));
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", zone.color);
            path.setAttribute("stroke-width", "10");
            svg.insertBefore(path, svg.firstChild); // ensure cursor is on top
        });
    }

    setupStokeForgeButton() {
        this.stokeForgeButton = this.smithingPanelContent.querySelector('[data-id="stoke-forge"]');
        this.stokeForgeButton.addEventListener('click', () => {
            this.manager.stokeForge();
        });
    }

    setupHeatWorkpieceButton() {
        this.heatWorkpieceButton = this.smithingPanelContent.querySelector('[data-id="heat-workpiece"]');
        this.heatWorkpieceButton.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;                 // Must be left click
            this.intervals.heatHold = setInterval(() => {
                this.manager.heatWorkpiece();
            }, 100);
        });

        this.heatWorkpieceButton.addEventListener('mouseup', () => {
            clearInterval(this.intervals.heatHold);
        });
        
        this.heatWorkpieceButton.addEventListener('mouseleave', () => {
            clearInterval(this.intervals.heatHold); // safety net for dragging out
        });
    }

    applyStrikeResult({ progressMod, qualityMod }) {
        this.forgingProgress = Math.min(100, Math.max(0, this.forgingProgress + progressMod));
        this.forgingQuality = Math.min(100, Math.max(0, this.forgingQuality + qualityMod));
      
        document.getElementById('progress-bar').style.width = `${this.forgingProgress}%`;
        
        const qualityBar = document.getElementById('quality-bar');
        qualityBar.style.left = `${this.forgingQuality}%`;

        this.workpieceTemperature.value = Math.max(0, this.workpieceTemperature.value - 50);

        if (this.forgingQuality === 0) {
            alert('The workpiece is ruined!');
            this.showForgeOverview();
        }

        if (this.forgingProgress === 100) {
            this.manager.createItem(this.forgingQuality);
            this.showForgeOverview();
        }
    }

    setIdealTemperatureZone(loPercent, width) {
        const zone = document.getElementById('ideal-temp-zone');
        zone.style.left = `${loPercent}%`;
        zone.style.width = `${width}%`;
    }

    updateTempCursor(tempObj) {
        tempObj.value = Math.max(tempObj.min, tempObj.value - tempObj.decayRate);
      
        const percentage = (tempObj.value - tempObj.min) / (tempObj.max - tempObj.min);
        const position = percentage * 100;
      
        const cursor = document.getElementById(`${tempObj.barId}-cursor`);
        if (cursor?.style) cursor.style.left = `${position}%`;
        const label = document.getElementById(`${tempObj.barId}-label`);
        if (label) label.textContent = Math.round(tempObj.value);
    }

    inRange (pos, start, end) {
        pos >= start && pos <= end;
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

    normalizeAngle(angle) {
        return (angle + 360) % 360;
    }
      
    rotateCursor() {
        this.intervals.cursorInterval = setInterval(() => {
            let angle = this.strikeCursorAngle;

            this.strikeCursorAngle = (angle + this.manager.getStrikeCursorSpeed()) % 360;
            this.strikeCursor.setAttribute('transform', `rotate(${angle} 50 50)`);
        }, 1);
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

    async showDesignSelection() {
        let materialsHtml = `<div class="grid grid-cols-${Object.keys(this.materials).length} gap-4">`;
        materialsHtml += Object.entries(this.materials).reduce((html, [key, material]) => {
            return html + `
                <div class="material-option bg-gray-600 p-4 rounded-lg text-center cursor-pointer 
                        border-4 ${material.class} hover:bg-gray-700 transition-colors duration-200"
                    data-material="${key}">
                    ${material.label}
                </div>
            `;
        }, '');
        materialsHtml += `</div>`;

        let designsHtml = `<div id="designs-container" 
                                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 
                                        gap-4 overflow-y-auto max-h-96">`;
        designsHtml += Object.entries(this.designs).reduce((html, [key, design]) => {
            return html + `
                <div class="relative design-option bg-gray-600 p-4 rounded-lg min-h-42 text-center 
                        border-4 cursor-pointer hidden" data-design="${key}">
                    <div class="absolute -top-1 -left-1 z-50 w-[105%] h-[105%] -inset-1 flex items-center justify-center 
                            mb-2 p-2 bg-black/70 cursor-default" 
                        onclick="event.stopPropagation();" 
                        data-id="requirementBlock">
                    </div>
                    <h3 class="font-semibold">
                        <span class="design-name"></span><br><span class="damage-display"></span>
                    </h3>
                    <div class="ingredients-display absolute w-[90%] 
                            grid grid-cols-2 gap-0 justify-items-center left-[5%] bottom-1"></div>
                </div>
            `;
        }, '');
        designsHtml += `</div>`;

        const html = `
            <div class="grid grid-cols-1 gap-4 mb-6">
                ${materialsHtml}
                ${designsHtml}
            </div>`;

        this.smithingPanelContent.innerHTML = html;
        this.smithingPanel.querySelector('.panel-heading').textContent = 'Design Selection';

        const materialOptions = document.querySelectorAll('.material-option');
        materialOptions.forEach(materialElement => {
            materialElement.addEventListener('click', (event) => {
                this.manager.selectMaterial(materialElement.dataset.material);

                materialOptions.forEach(opt => opt.classList.remove('bg-gray-800', 'text-white'));
                event.currentTarget.classList.add('bg-gray-800', 'text-white');
            });
        });
    }

    updateDesignOptions() {
        const designOptions = document.querySelectorAll('.design-option');
        designOptions.forEach(designElement => {
            this.setDesignOption(designElement, this.selectedMaterial);
            designElement.addEventListener('click', (event) => {
                this.manager.selectDesign(designElement.dataset.design);
                this.showForgeOverview();
            });
        });
    }

    setDesignOption(designElement, material) {
        const design = this.designs[designElement.dataset.design];
        const allowedMaterials = design.allowedMaterials;
        if (allowedMaterials.includes(material.name)) {
            const requirementBlock = designElement.querySelector('[data-id="requirementBlock"]');

            designElement.classList.remove('hidden');
            designElement.classList.remove('border-amber-600', 'border-gray-300', 'border-blue-500');
            designElement.classList.add(material.class);
            
            this.currentDesign = new Item(`${material.name}-${design.name}`, {
                label: `${material.label} ${design.label}`,
                extraData: {
                    ingredients: {
                        material: new Item(`${material.name}-ingot`, {
                            label: `${material.label} Ingot`,
                            stackLimit: 64,
                            quantity: design.requiredIngredients.material,
                            icon: `${material.name}-ingot.png`
                        }),
                        wood: new Item(`Wood`, {
                            label: 'Wood',
                            stackLimit: 64,
                            quantity: design.requiredIngredients.wood
                        })
                    }
                }         
            });

            this.currentDesign.baseDamage = design.baseDamage;
            this.currentDesign.updatedDamage = design.baseDamage * material.damageMultiplier;
            designElement.querySelector('.design-name').textContent = this.currentDesign.label;
            designElement.querySelector('.damage-display').textContent = `🗡️${this.currentDesign.updatedDamage}`;
            const ingredientsDisplay = designElement.querySelector('.ingredients-display');
            ingredientsDisplay.innerHTML = '';
            ingredientsDisplay.appendChild(this.currentDesign.extraData.ingredients.material.generateDOMElement());
            ingredientsDisplay.appendChild(this.currentDesign.extraData.ingredients.wood.generateDOMElement());

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
}