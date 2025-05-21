export function update(enemy, game, delta) {
    if (enemy.canSee(game.activePlayer) || enemy._targetLastKnownPosition) {
        enemy.pursue(game.activePlayer);
    }
}