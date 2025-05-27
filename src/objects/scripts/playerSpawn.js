export async function startupCallback(playerSpawn, game) {
    await playerSpawn.spawnPlayer();
}