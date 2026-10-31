import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import house from '../../../house_r1.json';
import world from '../../../packs/gh18/world.json';
import interactions from '../../../packs/gh18/interactions.json';
import { createMaterials } from '../materials.js';
import { buildHouse } from '../build.js';
import './style.css';

// P0 deliberately uses the same house builders as the tour. Gameplay systems stay isolated here.
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.querySelector('#app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9d9e5);
scene.fog = new THREE.Fog(0xc9d9e5, 45, 150);
const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, 0.1, 250);
camera.position.set(25, 19, 37);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(4.7, 3.6, 12);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.maxDistance = 100;

const sun = new THREE.DirectionalLight(0xfff0d5, 2.2);
sun.position.set(30, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
scene.add(sun, sun.target, new THREE.HemisphereLight(0xdcecff, 0x6a5340, 1.3));

const play = {
  ready: false,
  world,
  interactions,
  time: { ...world.time },
  setTime(hour, minute = 0, dateISO = play.time.date) {
    play.time = { hour: Number(hour), minute: Number(minute), date: dateISO };
    const progress = THREE.MathUtils.clamp((play.time.hour + play.time.minute / 60 - 15) / 4, 0, 1);
    sun.position.set(30 - progress * 58, 22 - progress * 20, 15 + progress * 12);
    sun.intensity = 2.2 - progress * 1.35;
    scene.background.setHSL(0.57 - progress * 0.49, 0.42, 0.84 - progress * 0.43);
    scene.fog.color.copy(scene.background);
    return { ...play.time };
  },
  teleport(xMm, yMm, floor = 'GF') {
    controls.target.set(xMm / 1000, floor === 'GF' ? 1.6 : floor === 'FF' ? 4.9 : 8.2, yMm / 1000);
    camera.position.copy(controls.target).add(new THREE.Vector3(7, 5, 9));
    return { xMm, yMm, floor };
  },
  sit: (furnitureId) => ({ queued: true, furnitureId }),
  lie: (furnitureId) => ({ queued: true, furnitureId }),
  enterCar: () => ({ queued: true }),
  radio: (on) => ({ queued: true, on: !!on }),
  photo() {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'gh18-play.png'; link.href = renderer.domElement.toDataURL('image/png'); link.click();
  },
  settle(frames = 1) { for (let i = 0; i < frames; i++) render(); },
};
window.play = play;

function render() { controls.update(); renderer.render(scene, camera); }
function animate() { requestAnimationFrame(animate); render(); }
async function init() {
  const materials = await createMaterials(renderer);
  const data = buildHouse(house, materials);
  for (const mesh of data.meshes) scene.add(mesh);
  sun.target.position.set(4.7, 0, 12);
  play.setTime(world.time.hour, world.time.minute, world.time.date);
  play.ready = true;
  document.querySelector('#loading').remove();
  animate();
}
document.querySelector('#sunset').addEventListener('click', () => play.setTime(17, 35));
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
init().catch((error) => { console.error(error); document.querySelector('#loading').textContent = 'Unable to open the home.'; });
