# Ironvolt: giant mech combat

A browser game about 60–90 metre fighting mechs wrecking a city or a desert outpost while they wreck each other. Built with Three.js. Open `index.html` in a recent desktop or mobile browser (it loads Three.js from jsDelivr, so it needs an internet connection).

## What's in it

- **Seven mechs** built from concept sheets, each with its own height, weight, stats, AI personality and two signature abilities:
  - Bulwark: Wrecking Ball, Quake Slam
  - Onyx: Boulder Rip, Ground Pound
  - Torque: Nitro Rush, Shadow Clones
  - Spectra: Phase Step, Plasma Fist
  - Belljar: Battering Ram, Blast Dome
  - Warden OD-9: Missile Salvo, Harpoon Claw
  - Mire: Pounce, Rend
  - Every mech also has deployable arm blades.
- **Two battlegrounds**: Harbor City at dusk (skyline, streets, cars, cranes, a harbor) and Red Mesa (desert outpost, rock spires, mesas, fuel tanks).
- **Destruction**: every building is made of chunks. Punches, throws, slams and missiles knock pieces out; take out the lower floors and the floors above collapse. Rubble stays where it lands and can be picked up.
- **Combat**: jab, cross, hook, uppercut, kick, dive punch, block and parry, dashes, sprint, jump, grabs with knees and directional throws (mash Space to break free), clashes when both mechs throw the same strike at once (mash punch to win), lifting and throwing rocks, cars, containers, statues, fuel tanks and pieces of buildings, or smashing them over the opponent.
- **Physics**: two-bone IK limbs with planted footsteps and hydraulic pistons, Verlet ragdolls that fly through buildings, weight-based knockback and throws, debris, crushed cars.
- **Random entrances**: helicopter air drop, an incoming mech landing out of the sky, or both mechs surfacing from the harbor or out of the sand.
- **Modes**: Circuit (five-fight ladder, progress saved), Versus, Training.
- **Controls**: keyboard + mouse, gamepad (with rumble), touch.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | W A S D | Left stick |
| Sprint | Shift | L3 toggle |
| Jump (mash to break a grab) | Space | A |
| Jab / Cross / Hook / Uppercut | J / K / L / I | X / Y / RT / LT |
| Kick | U | B |
| Block (tap to parry) | F or right mouse | RB |
| Grab, then throw | G (J knees while holding) | LB |
| Lift / throw an object | R | D-pad down / R3 |
| Abilities 1 / 2 / Blades | 1 / 2 / 3 | D-pad left / right / up |
| Dash | Q / E | Right stick flick |
| Camera | C | Back |
| Pause | Esc / P | Start |

## Building

The source lives in `src/`; `index.html` is generated with `node build.mjs`, which concatenates `src/js/*.js` into the module script in `src/shell.html`.
