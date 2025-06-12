export default class SmithingRepository {
    constructor(manager) {
        this.manager = manager;
        this.game = manager.game;

        this.materials = {
            'bronze': {
                name: 'bronze',
                label: 'Bronze',
                description: 'An alloy of copper and tin, suitable for basic weapons.',
                damageMultiplier: 1,
                requiredLevel: 0,
                class: 'border-amber-600',
                temperatureRange: { lo: 300, hi: 900 },
                quench: "none"
            },
            'iron': {
                name: 'iron',
                label: 'Iron',
                description: 'A common metal known for its strength and durability.',
                damageMultiplier: 2,
                requiredLevel: 10,
                class: 'border-gray-300',
                temperatureRange: { lo: 800, hi: 1200 },
                quench: "minor"
            },
            'steel': {
                name: 'steel',
                label: 'Steel',
                description: 'A refined metal known for its superior strength and sharpness.',
                damageMultiplier: 3,
                requiredLevel: 20,
                class: 'border-blue-500',
                temperatureRange: { lo: 900, hi: 1250 },
                quench: "major"
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

        this.forgeTemperature = {
            value: 15,
            max: 1500,
            min: 15,
            decayRate: 0.5, // slow decay per tick
            barId: 'forge-temp',
            zoneStart: 33, // % left
            zoneEnd: 66,   // % right
        }
    }

    async getMaterials() {
        return Promise.resolve(this.materials);
    }

    async getDesigns() {
        return Promise.resolve(this.designs);
    }

    async getAllowedCombinations() {
        return Promise.resolve(
            Object.values(this.materials).reduce((acc, material) => {
                const allowedDesigns = Object.values(this.designs)
                    .filter(design => design.allowedMaterials.includes(material.name));
                acc[material.name] = allowedDesigns;
                return acc;
            }, {})
        );
    }

    async getForge() {
        return Promise.resolve(structuredClone(this.forgeTemperature))
    }
}