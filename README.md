# Ironvolt — 3D robot boxing

A browser robot-boxing game built with Three.js. Open `index.html` in a recent desktop or mobile browser (it loads Three.js from jsDelivr, so it needs an internet connection).

## What's in it

- **Six original fighting robots**, each a procedurally built rig with its own silhouette, colors, stats and AI personality: Bulwark, Onyx, Spectra, Belljar, Warden OD-9 and Mire.
- **Four 3D venues**: Kestrel Hold (tanker cargo hold with a sunlit hatch, hanging chains and containers), Foundry Bay 9 (mech hangar with dormant giant robots and welding sparks), Wonderland Rust (dead amusement park at night with a turning Ferris wheel, roller coaster and carousel) and Helix Core (reactor chamber with rotating containment rings).
- **Boxing system**: jab, cross, hook and uppercut to head or body, blocking with a timed parry, slips with invulnerability frames, counter-hit bonus, stamina, daze, guard breaks, combos and an Overdrive meter.
- **Physics**: two-bone IK arms and legs with planted footsteps, spring-driven hit reactions, knockback with rope bounce, ropes that bow under the robots, a Verlet ragdoll for knockdowns that blends back into a standing pose, and armor plates that break off and tumble around the canvas.
- **Presentation**: PBR materials with per-venue reflections, soft shadows, bloom, hit-stop, slow motion on knockdowns, camera shake, sparks, oil, smoke, punch trails, an instanced crowd that reacts to the fight, synthesized sound effects and music, and a spoken announcer.
- **Modes**: Circuit (five-fight ladder, progress saved), Exhibition, Training (dummy that idles, blocks or fights back).
- **Controls**: keyboard + mouse, gamepad (with rumble) and on-screen touch controls.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move / circle | W A S D | Left stick |
| Jab / Cross | J / K (or left / right mouse) | X / Y |
| Hook / Uppercut | L / I | B / A |
| Body shot | Hold Shift + punch | Hold LT |
| Block (tap to parry) | Space | RB / RT |
| Slip left / right | Q / E | LB or flick right stick |
| Overdrive | F | R3 / D-pad up |
| Camera | C | Back |
| Pause | Esc / P | Start |

## Building

The game source lives in `src/`. `index.html` is generated:

```
node build.mjs
```

`build.mjs` concatenates `src/js/*.js` into the module script in `src/shell.html` and writes `index.html`.
