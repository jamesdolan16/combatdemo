export default class Skill {
    constructor(name, eventEmitter, options = {}) {
        this.name = name;
        this.eventEmitter = eventEmitter;
        
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

    get nextLevelProgress() {
        return this.xp - this.levelXp(this.level);
    }

    levelXp(l) {
        return Math.pow((l / 0.1), 2);
    }

    addXp(xpGain) {
        const oldLevel = this.level;
        this.xp += xpGain;
        
        if (oldLevel < this.level) {
            this.eventEmitter.emit('playerSkillsUpdated', {
                levelUp: true,
                skill: this
            });
        }
    }
}