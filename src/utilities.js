import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export const WALKSPEED = 4;
export const JUMPVELOCITY = 5;
export const VIEWDISTANCE = 32;
export const STUCKTHRESHOLD = 0.9;

export function debugRaycaster(raycaster, scene, length, color) {
    const origin = raycaster.ray.origin.clone();
    const direction = raycaster.ray.direction.clone().normalize().multiplyScalar(length);
    const points = [origin, origin.clone().add(direction)];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    setTimeout(() => scene.remove(line), 1000);
}
