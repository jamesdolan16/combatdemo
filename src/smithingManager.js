import smithingEngine from "./smithingEngine";
import SmithingRepository from "./repositories/smithingRepository";
import SmithingUI from "./smithingUI";
import ItemRepository from "./repositories/itemRepository";


export default class SmithingManager {
    constructor(game, options = {}) {
        this.game = game;
        this.player = game.activePlayer;
        
        this.repo = options.repo ?? new SmithingRepository(this);
        this.itemRepo = options.itemRepo ?? new ItemRepository(this);
        this.engine = options.engine ?? new smithingEngine(this);
        this.ui = options.ui ?? new SmithingUI(this, options.uiOptions ?? {});

        this.workpieceTemperature = {
            value: 15,
            max: 1500,
            min: 15,
            decayRate: 2, // faster decay per tick
            barId: 'workpiece-temp',
            zoneStart: 25,
            zoneEnd: 75,
        }
    }

    async initialise() {
        const [materials, designs, forge] = await Promise.all([
          this.repo.getMaterials(),
          this.repo.getDesigns(),
          this.repo.getForge()
        ]);
      
        this.materials = materials;
        this.designs = designs;
      
        this.materials = materials;
        this.ui.materials = materials;

        this.designs = designs;
        this.ui.designs = designs;
        
        this.forgeTemperature = forge;
        this.ui.forgeTemperature = forge;

        this.ui.workpieceTemperature = this.workpieceTemperature;
    }

    show() {
        this.ui.openSmithingPanel();
    }

    hide() {
        this.ui.closeSmithingPanel();
    }

    stokeForge(amount = 35) {
        this.forgeTemperature.value = Math.min(this.forgeTemperature.max, this.forgeTemperature.value + amount);
    }      
    
    heatWorkpiece() {
        const heatTransfer = 10;
        const newTemp = this.workpieceTemperature.value + heatTransfer;
      
        this.workpieceTemperature.value = Math.min(this.forgeTemperature.value, newTemp);
    }
    
    handleStrike(strikeAngle) {
        const result = this.engine.evaluateStrike({
          angle: strikeAngle,
          zones: this.strikeZones,
          temperature: this.workpieceTemperature.value,
          range: this.selectedMaterial.temperatureRange,
          playerLevel: this.player.skills.smithing.level,
          itemLevel: this.itemLevel
        });
    
        this.ui.applyStrikeResult(result);
    }

    getStrikeCursorSpeed() {
        return this.engine.getStrikeCursorSpeed();
    }

    selectMaterial(key) {
        this.selectedMaterial = this.repo.materials[key];
        this.ui.selectedMaterial = this.selectedMaterial;
        this.ui.updateDesignOptions();
    }

    selectDesign(key) {
        this.selectedDesign = this.repo.designs[key];
        this.itemLevel = this.selectedMaterial.requiredLevel + this.selectedDesign.requiredLevelModifier;
        this.ui.selectedDesign = this.selectedDesign;
    }

    createItem(quality) {
        const {item, xp} = this.engine.craftItem(this.selectedDesign, this.selectedMaterial, quality);
        this.ui.showCreatedItemPanel(item, xp);
        this.player.inventory.push(item);
        this.game.eventEmitter.emit('playerInventoryUpdated');
        this.player.skills.smithing.xp += xp;
        this.game.eventEmitter.emit('playerSkillsUpdated');
    }

    updateIdealTemperatureZone() {
        const range = this.selectedMaterial.temperatureRange;
        const minTemp = this.workpieceTemperature.min;
        const maxTemp = this.workpieceTemperature.max;
      
        const totalRange = maxTemp - minTemp;
        const loPercent = ((range.lo - minTemp) / totalRange) * 100;
        const hiPercent = ((range.hi - minTemp) / totalRange) * 100;
        const width = hiPercent - loPercent;

        this.ui.setIdealTemperatureZone(loPercent, width);
    }

    generateStrikeZones() {
        const totalDegrees = 360;
        const difficultyIndex = this.engine.getDifficultyIndex(
            this.player.skills.smithing.level, this.itemLevel); // 1 = exact level, 0 = 20+ over

        // Base sizes shrink with difficulty
        const perfectBase = 40;
        const okayBase = 80;

        const perfectSize = Math.max(20, perfectBase * (1 - difficultyIndex));
        const okaySize = Math.max(30, okayBase * (1 - difficultyIndex));

        const zones = [];

        // Determine number of zones: 1 to 3 depending on how overleveled the player is
        const maxZones = 3;
        const count = 1 + Math.floor((1 - difficultyIndex) * (maxZones - 1)); // 1–3 zones
        const spacing = totalDegrees / count;

        for (let i = 0; i < count; i++) {
            const center = i * spacing + spacing / 2;
            const greenStart = center - perfectSize / 2;
            const greenEnd = center + perfectSize / 2;
            const orangeStart1 = greenStart - okaySize;
            const orangeEnd1 = greenStart;
            const orangeStart2 = greenEnd;
            const orangeEnd2 = greenEnd + okaySize;

            zones.push(
                { 
                    start: this.engine.normalizeAngle(orangeStart1), 
                    end: this.engine.normalizeAngle(orangeEnd1), 
                    color: "#f97316" 
                },
                { 
                    start: this.engine.normalizeAngle(greenStart), 
                    end: this.engine.normalizeAngle(greenEnd), 
                    color: "#22c55e" 
                },
                { 
                    start: this.engine.normalizeAngle(orangeStart2), 
                    end: this.engine.normalizeAngle(orangeEnd2), 
                    color: "#f97316" 
                }
            );
        }

        // Fill in red zones between all active segments
        zones.sort((a, b) => a.start - b.start);

        const fullZones = [];
        for (let i = 0; i < zones.length; i++) {
            const current = zones[i];
            fullZones.push(current);
        
            const currentEnd = current.end;
            const nextStart = (i === zones.length - 1)
                ? zones[0].start + 360  // wraparound continuation
                : zones[i + 1].start;
        
            // Only add red zone if there's a visible gap
            if (nextStart > currentEnd) {
                fullZones.push({
                    start: currentEnd,
                    end: nextStart,
                    color: "#ef4444"
                });
            }
        }
        
        // // Normalize at the very end
        // this.strikeZones = fullZones.map(zone => ({
        //     start: this.normalizeAngle(zone.start),
        //     end: this.normalizeAngle(zone.end),
        //     color: zone.color
        // }));

        this.strikeZones = fullZones;

        return fullZones;
    }

    smithingAllowed() {
        if (!this.selectedDesign || !this.selectedMaterial) return { allowed: false, reasons: ['No design selected']};

        let allowed = true;
        let reasons = [];
        
        const requiredLevel = this.selectedDesign.requiredLevelModifier + this.selectedMaterial.requiredLevel;
        if (this.player.skills.smithing.level < requiredLevel) {
            allowed = false; 
            reasons.push("Insufficient Smithing Level");
        }

        const requiredIngredients = this.selectedDesign.requiredIngredients;
        this.materialInInventory = this.player.inventory.find(item => item.name === `${this.selectedMaterial.name}-ingot`);
        this.woodInInventory = this.player.inventory.find(item => item.name === 'wood');

        if (requiredIngredients.material && this.materialInInventory?.quantity < requiredIngredients.material) {
            allowed = false;
            reasons.push(`Missing ${this.selectedMaterial.label}`);
        } 
        if (requiredIngredients.wood && this.woodInInventory?.quantity < requiredIngredients.wood) {
            allowed = false;
            reasons.push(`Missing Wood`);
        }

        return {allowed, reasons}
    }

    consumeIngredients() {
        this.materialInInventory.quantity -= this.selectedDesign.requiredIngredients.material;
        this.woodInInventory.quantity -= this.selectedDesign.requiredIngredients.wood;
        this.game.eventEmitter.emit('playerInventoryUpdated');
    }

    getXP() {
        return {
            current: this.player.skills.smithing.level,
            xpNextLevel: this.player.skills.smithing.xpToNextLevel
        }
    }
}