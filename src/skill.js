export default class Skill {
    constructor(name, options = {}) {
        this.name = name;
        
        const {
            xp = xp || 0,
        } = options;

        this.xp = xp;
    }

    get level() {
        return Math.floor(0.1 * Math.sqrt(this.xp)); 
    }

    get xpToNextLevel() {
        return this.levelXp(this.level + 1) - this.xp;
    }

    levelXp(l) {
        return Math.pow((l / 0.1), 2);
    }
}