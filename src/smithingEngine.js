import Item from "./item";

export default class SmithingEngine {
    constructor(manager) {
        this.itemRepo = manager.itemRepo;
        this.craftsmanshipQuality = {
            'ruined': 0,
            'damaged': 10,
            'workable': 34,
            'refined': 64,
            'masterful': 84,
            'mythic': 98
        }
    }

    getDifficultyIndex(playerLevel, itemLevel) {
        const maxEase = 20;
        const overage = playerLevel - itemLevel;
        return 1 - Math.min(overage / maxEase, 1); // 0 (easy) → 1 (barely qualified)
    }

    evaluateStrike({ angle, zones, temperature, range, playerLevel, itemLevel }) {
        const difficultyIndex = this.getDifficultyIndex(playerLevel, itemLevel);
        const qualityScaling = 1 - difficultyIndex;

        const strikeResult = this.getZoneResult(angle, zones);
        const tempResult = this.getTempResult(temperature, range);

        let progressMod = 0;
        let qualityMod = 0;
        let xpGain = 0;

        if (tempResult === 'hi') progressMod -= 5;
        if (tempResult === 'lo') qualityMod -= 15;

        switch (strikeResult) {
            case 'perfect':
                progressMod += 15;
                qualityMod += 7 + Math.round(15 * qualityScaling);
                xpGain = (itemLevel + 1);
                break;
            case 'good':
                progressMod += 5;
                break;
            case 'bad':
                progressMod -= 15;
                qualityMod -= 10 + Math.round(5 * difficultyIndex);
                break;
        }

        return { progressMod, qualityMod, strikeResult, tempResult, xpGain };
    }

    calculateAutoChance(playerLevel, itemLevel) {
        const scalingFactor = 5; // 5% change per level difference
        let chance = 20 + (playerLevel - itemLevel) * scalingFactor;

        // Clamp the chance between 0% and 100%
        chance = Math.max(0, Math.min(100, chance));

        return chance;
    }

    getZoneResult(angle, zones) {
        angle = (angle + 360) % 360;

        for (let zone of zones) {
            let { start, end, } = zone;
            start = this.normalizeAngle(zone.start);
            end = this.normalizeAngle(zone.end);

            if (start < end && angle >= start && angle <= end) {
                if (zone.color === "#22c55e") return "perfect";
                if (zone.color === "#f97316") return "good";
                return "bad";
            }

            // Handle wraparound (e.g., 350–10 degrees)
            if (start > end && (angle >= start || angle <= end)) {
                if (zone.color === "#22c55e") return "perfect";
                if (zone.color === "#f97316") return "good";
                return "bad";
            }
        }

        return "bad";
    }

    normalizeAngle(angle) {
        return (angle + 360) % 360;
    }

    getTempResult(temp, range) {
        if (temp < range.lo) return "lo";
        if (temp > range.hi) return "hi";
        return "in";
    }

    getStrikeCursorSpeed() {
        return 6;
    }

    getDesignState(design, material, playerLevel) {
        const requiredLevel = design.requiredLevelModifier + material.requiredLevel;
        return {
            meetsLevel: playerLevel >= requiredLevel,
            requiredLevel,
            allowed: design.allowedMaterials.includes(material.name),
            damage: design.baseDamage * material.damageMultiplier,
        };
    }

    smithingAllowed(design, material, playerLevel) {
        if (!design || !material) return { allowed: false, reasons: ['No design selected']};

        let allowed = true;
        let reasons = [];
        
        const requiredLevel = design.requiredLevelModifier + material.requiredLevel;
        if (this.player.skills.smithing.level < requiredLevel) {
            allowed = false; 
            reasons.push("Insufficient Smithing Level");
        }

        const requiredIngredients = design.requiredIngredients;
        const materialInInventory = this.player.inventory.find(item => item.name === `${material.name}-ingot`)?.quantity ?? 0;
        const woodInInventory = this.player.inventory.find(item => item.name === 'wood')?.quantity ?? 0;

        if (requiredIngredients.material && materialInInventory < requiredIngredients.material) {
            allowed = false;
            reasons.push(`Missing ${material.label}`);
        } 
        if (requiredIngredients.wood && woodInInventory < requiredIngredients.wood) {
            allowed = false;
            reasons.push(`Missing Wood`);
        }

        return {allowed, reasons}
    }

    determineCraftsmanship(quality) {
        // I think this is stupid 
        const thresholds = Object.entries(this.craftsmanshipQuality).sort(([, a], [, b]) => a - b); // sort by value ascending

        let tier = 'ruined'; // default fallback

        for (const [name, threshold] of thresholds) {
            if (quality >= threshold) {
                tier = name;
            } else {
                break;
            }
        }

        return tier;
    }

    async craftItem(selectedDesign, selectedMaterial, quality) {
        if (quality === 0) {
            const item = await this.itemRepo.getItem('forge-scrap');
            return {item, xp: 0};
        }

        const itemLevel = selectedMaterial.requiredLevel + selectedDesign.requiredLevelModifier;
        const craftsmanship = this.determineCraftsmanship(quality);

        const item = new Item(`${selectedMaterial.name}-${selectedDesign.name}`, {
            label: `${selectedMaterial.label} ${selectedDesign.label}`
        });

        item.damage = selectedDesign.baseDamage * selectedMaterial.damageMultiplier;
        item.craftsmanshipModifier = craftsmanship;

        let xp = 0;
        const baseXP = (itemLevel + 1) * 3;

        switch (craftsmanship) {
            case 'ruined':
                item.damageBuff = -2 * (item.damage / 3);   // -2/3
                xp = baseXP * 0.25;
                break;
            case 'damaged':
                item.damageBuff = -1 * (item.damage / 3);   // -1/3
                xp = baseXP * 0.5;
                break;
            case 'workable':
                xp = baseXP * 1;
                break;
            case 'refined':
                item.damageBuff = (item.damage / 3);        // +1/3
                xp = baseXP * 2;
                break;
            case 'masterful':
                item.damageBuff = 2 * (item.damage / 3);    // +2/3
                xp = baseXP * 3;
                break;
            case 'mythic':
                item.damageBuff = item.damage;              // * 2
                xp = baseXP * 5;
                break;
        }

        xp = Math.ceil(xp);
        item.damageBuff = Math.round(item.damageBuff);

        return Promise.resolve({item, xp});
    }
}
