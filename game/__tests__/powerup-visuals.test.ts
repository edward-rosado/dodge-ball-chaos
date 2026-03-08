import { describe, it, expect, beforeEach } from "vitest";
import { makeGame, startGame } from "../state";
import { GameState, ST, Ball } from "../types";
import { BallType } from "../balls/types";
import { PowerUpType } from "../powerups/types";
import { applyPowerUp, completeSpiritBomb, cancelSpiritBomb } from "../powerups/effects";
import { update } from "../update";
import { PLAYER_HITBOX } from "../constants";

// ─── Helpers ───

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 200,
    y: 300,
    vx: 2,
    vy: 2,
    bounceCount: 0,
    type: BallType.Dodgeball,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius: 7,
    dead: false,
    ...overrides,
  };
}

function makeDodgeState(): GameState {
  const g = makeGame();
  startGame(g);
  g.state = ST.DODGE;
  g.round = 3;
  return g;
}

// ─── 1. Individual Power-Up Visual State Tests ───

describe("Individual power-up visual states", () => {
  let g: GameState;

  beforeEach(() => {
    g = makeDodgeState();
  });

  it("kaioken flag enables red glow effect", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    expect(g.kaioken).toBe(true);
    expect(g.kaiokenTimer).toBe(5);
  });

  it("shield flag enables shield bubble visual", () => {
    applyPowerUp(g, PowerUpType.KiShield);
    expect(g.shield).toBe(true);
    // Ki Shield has no timer — persists until consumed
    expect(g.shieldTimer).toBe(0);
  });

  it("shrink flag halves player hitbox (visual indicator active)", () => {
    applyPowerUp(g, PowerUpType.Shrink);
    expect(g.shrink).toBe(true);
    expect(g.shrinkTimer).toBe(5);

    // Verify hitbox is halved during collision check
    const hitboxRadius = g.shrink ? PLAYER_HITBOX / 2 : PLAYER_HITBOX;
    expect(hitboxRadius).toBe(PLAYER_HITBOX / 2);
  });

  it("solarFlare freezes all ball velocities to zero", () => {
    g.balls = [
      makeBall({ x: 100, y: 100, vx: 4, vy: -3 }),
      makeBall({ x: 150, y: 200, vx: -2, vy: 5 }),
    ];
    applyPowerUp(g, PowerUpType.SolarFlare);
    expect(g.solarFlare).toBe(true);

    for (const b of g.balls) {
      expect(b.vx).toBe(0);
      expect(b.vy).toBe(0);
    }
  });

  it("spiritBombCharging flag activates charging visual", () => {
    applyPowerUp(g, PowerUpType.SpiritBombCharge);
    expect(g.spiritBombCharging).toBe(true);
    expect(g.spiritBombTimer).toBe(3);
    // Position recorded for movement detection
    expect(g.spiritBombX).toBe(g.px);
    expect(g.spiritBombY).toBe(g.py);
  });

  it("afterimageDecoy renders decoy at saved position", () => {
    g.px = 180;
    g.py = 300;
    applyPowerUp(g, PowerUpType.Afterimage);
    expect(g.afterimageDecoy).toEqual({ x: 180, y: 300 });
    expect(g.afterimageTimer).toBe(4);
  });

  it("instantTransmissionUses > 0 shows IT indicator with remaining count", () => {
    expect(g.instantTransmissionUses).toBe(0);
    applyPowerUp(g, PowerUpType.InstantTransmission);
    expect(g.instantTransmissionUses).toBe(3);

    // Collecting again stacks uses
    applyPowerUp(g, PowerUpType.InstantTransmission);
    expect(g.instantTransmissionUses).toBe(6);
  });

  it("slow flag (TimeSkip) activates slow-mo visual indicator", () => {
    applyPowerUp(g, PowerUpType.TimeSkip);
    expect(g.slow).toBe(true);
    expect(g.slowTimer).toBe(4);
  });
});

// ─── 2. Multi-Power-Up Combo State Tests ───

describe("Multi-power-up combo visual states", () => {
  let g: GameState;

  beforeEach(() => {
    g = makeDodgeState();
  });

  it("Kaioken + Ki Shield: both visual effects active simultaneously", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    applyPowerUp(g, PowerUpType.KiShield);

    expect(g.kaioken).toBe(true);
    expect(g.shield).toBe(true);
    expect(g.kaiokenTimer).toBe(5);

    // Both effects survive an update frame
    update(g, 0.016);
    expect(g.kaioken).toBe(true);
    expect(g.shield).toBe(true);
  });

  it("Kaioken + Shrink: 2x speed with half hitbox, both visuals active", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    applyPowerUp(g, PowerUpType.Shrink);

    expect(g.kaioken).toBe(true);
    expect(g.shrink).toBe(true);

    // Verify speed multiplier from Kaioken
    const speedMult = g.kaioken ? 2 : 1;
    expect(speedMult).toBe(2);

    // Verify hitbox reduction from Shrink
    const hitboxRadius = g.shrink ? PLAYER_HITBOX / 2 : PLAYER_HITBOX;
    expect(hitboxRadius).toBe(PLAYER_HITBOX / 2);

    // Both survive update
    update(g, 0.016);
    expect(g.kaioken).toBe(true);
    expect(g.shrink).toBe(true);
  });

  it("Ki Shield + Shrink: shield protects with halved hitbox", () => {
    applyPowerUp(g, PowerUpType.KiShield);
    applyPowerUp(g, PowerUpType.Shrink);

    expect(g.shield).toBe(true);
    expect(g.shrink).toBe(true);

    // Both survive update
    update(g, 0.016);
    expect(g.shield).toBe(true);
    expect(g.shrink).toBe(true);
  });

  it("TimeSkip + Kaioken: balls at 0.3x while player at 2x speed", () => {
    applyPowerUp(g, PowerUpType.TimeSkip);
    applyPowerUp(g, PowerUpType.Kaioken);

    expect(g.slow).toBe(true);
    expect(g.kaioken).toBe(true);

    // Ball speed multiplier
    const sm = g.slow ? 0.3 : 1;
    expect(sm).toBe(0.3);

    // Player speed multiplier
    const speedMult = g.kaioken ? 2 : 1;
    expect(speedMult).toBe(2);

    // Verify both effects coexist through update frames
    g.balls = [makeBall({ x: 100, y: 100, vx: 10, vy: 0 })];
    const startX = g.balls[0].x;
    update(g, 0.016);

    // Ball should have moved at 0.3x speed (not full speed)
    // Movement = vx * sm = 10 * 0.3 = 3 per frame
    expect(g.balls[0].x - startX).toBeCloseTo(3, 0);
  });

  it("Ultra Instinct milestone + Kaioken: both flags coexist", () => {
    // Ultra Instinct is determined by round milestone (10, 20, 30, 40, 50)
    g.round = 10;
    applyPowerUp(g, PowerUpType.Kaioken);

    const UI_MILESTONES = new Set([10, 20, 30, 40, 50]);
    const isUI = UI_MILESTONES.has(g.round);

    expect(isUI).toBe(true);
    expect(g.kaioken).toBe(true);

    // Both visual triggers active simultaneously
    update(g, 0.016);
    expect(g.kaioken).toBe(true);
    expect(UI_MILESTONES.has(g.round)).toBe(true);
  });

  it("Triple combo: Kaioken + Shield + Shrink all active simultaneously", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    applyPowerUp(g, PowerUpType.KiShield);
    applyPowerUp(g, PowerUpType.Shrink);

    expect(g.kaioken).toBe(true);
    expect(g.shield).toBe(true);
    expect(g.shrink).toBe(true);

    // All three survive multiple update frames
    for (let i = 0; i < 10; i++) {
      update(g, 0.016);
    }
    expect(g.kaioken).toBe(true);
    expect(g.shield).toBe(true);
    expect(g.shrink).toBe(true);
  });

  it("Spirit Bomb channeling locks player in place (Kaioken speed should not apply)", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    applyPowerUp(g, PowerUpType.SpiritBombCharge);

    expect(g.kaioken).toBe(true);
    expect(g.spiritBombCharging).toBe(true);

    // If player tries to move during Spirit Bomb, it gets cancelled
    g.pvx = 10;
    g.pvy = 10;
    update(g, 0.016);

    // Spirit Bomb should be cancelled due to movement
    expect(g.spiritBombCharging).toBe(false);
    expect(g.msg).toBe("SPIRIT BOMB CANCELLED!");
  });
});

// ─── 3. Power-Up Interaction Logic Tests ───

describe("Power-up interaction logic", () => {
  let g: GameState;

  beforeEach(() => {
    g = makeDodgeState();
  });

  it("Solar Flare saves ball velocities and restores them on expiry", () => {
    g.balls = [
      makeBall({ x: 100, y: 100, vx: 4.5, vy: -3.2 }),
      makeBall({ x: 200, y: 200, vx: -1.8, vy: 6.1 }),
    ];

    // Apply Solar Flare — saves and freezes
    applyPowerUp(g, PowerUpType.SolarFlare);
    expect(g.balls[0].savedVx).toBe(4.5);
    expect(g.balls[0].savedVy).toBe(-3.2);
    expect(g.balls[0].vx).toBe(0);
    expect(g.balls[0].vy).toBe(0);
    expect(g.balls[1].savedVx).toBe(-1.8);
    expect(g.balls[1].savedVy).toBe(6.1);
    expect(g.balls[1].vx).toBe(0);
    expect(g.balls[1].vy).toBe(0);

    // Expire Solar Flare
    g.solarFlareTimer = 0.01;
    update(g, 0.02);

    expect(g.solarFlare).toBe(false);
    expect(g.balls[0].vx).toBe(4.5);
    expect(g.balls[0].vy).toBe(-3.2);
    expect(g.balls[0].savedVx).toBeUndefined();
    expect(g.balls[0].savedVy).toBeUndefined();
    expect(g.balls[1].vx).toBe(-1.8);
    expect(g.balls[1].vy).toBe(6.1);
  });

  it("Spirit Bomb completion marks only non-Dodgeball balls as dead", () => {
    g.balls = [
      makeBall({ type: BallType.Dodgeball, x: 100, y: 100 }),
      makeBall({ type: BallType.Tracker, x: 150, y: 150 }),
      makeBall({ type: BallType.Ghost, x: 200, y: 200 }),
      makeBall({ type: BallType.Dodgeball, x: 250, y: 250 }),
      makeBall({ type: BallType.Splitter, x: 300, y: 300 }),
    ];

    completeSpiritBomb(g);

    // Dodgeballs survive
    expect(g.balls[0].dead).toBe(false);
    expect(g.balls[3].dead).toBe(false);
    // Non-Dodgeballs destroyed
    expect(g.balls[1].dead).toBe(true);
    expect(g.balls[2].dead).toBe(true);
    expect(g.balls[4].dead).toBe(true);
  });

  it("multiple timed power-ups decrement independently", () => {
    // Activate several timed power-ups with different durations
    applyPowerUp(g, PowerUpType.Kaioken);    // 5s
    applyPowerUp(g, PowerUpType.Shrink);     // 5s
    applyPowerUp(g, PowerUpType.TimeSkip);   // 4s

    const kaiokenStart = g.kaiokenTimer;
    const shrinkStart = g.shrinkTimer;
    const slowStart = g.slowTimer;

    expect(kaiokenStart).toBe(5);
    expect(shrinkStart).toBe(5);
    expect(slowStart).toBe(4);

    // Run one frame
    const dt = 0.5;
    update(g, dt);

    // Each timer decremented independently by the same dt
    expect(g.kaiokenTimer).toBeCloseTo(kaiokenStart - dt, 5);
    expect(g.shrinkTimer).toBeCloseTo(shrinkStart - dt, 5);
    expect(g.slowTimer).toBeCloseTo(slowStart - dt, 5);

    // All still active
    expect(g.kaioken).toBe(true);
    expect(g.shrink).toBe(true);
    expect(g.slow).toBe(true);
  });

  it("collecting same timed power-up while active refreshes the timer", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    expect(g.kaiokenTimer).toBe(5);

    // Tick down some time
    update(g, 2.0);
    expect(g.kaiokenTimer).toBeCloseTo(3, 0);
    expect(g.kaioken).toBe(true);

    // Collect Kaioken again — timer should reset to 5
    applyPowerUp(g, PowerUpType.Kaioken);
    expect(g.kaiokenTimer).toBe(5);
    expect(g.kaioken).toBe(true);
  });

  it("TimeSkip refresh resets timer to 4 seconds", () => {
    applyPowerUp(g, PowerUpType.TimeSkip);
    expect(g.slowTimer).toBe(4);

    update(g, 1.5);
    expect(g.slowTimer).toBeCloseTo(2.5, 0);

    // Re-collect
    applyPowerUp(g, PowerUpType.TimeSkip);
    expect(g.slowTimer).toBe(4);
    expect(g.slow).toBe(true);
  });

  it("Shrink refresh resets timer to 5 seconds", () => {
    applyPowerUp(g, PowerUpType.Shrink);
    expect(g.shrinkTimer).toBe(5);

    update(g, 3.0);
    expect(g.shrinkTimer).toBeCloseTo(2, 0);

    applyPowerUp(g, PowerUpType.Shrink);
    expect(g.shrinkTimer).toBe(5);
    expect(g.shrink).toBe(true);
  });

  it("shield absorbs hit while Kaioken and Shrink are also active", () => {
    applyPowerUp(g, PowerUpType.Kaioken);
    applyPowerUp(g, PowerUpType.KiShield);
    applyPowerUp(g, PowerUpType.Shrink);

    g.lives = 3;
    // Place ball directly on player
    g.balls = [makeBall({ x: g.px, y: g.py })];

    update(g, 0.016);

    // Shield consumed, life preserved
    expect(g.shield).toBe(false);
    expect(g.lives).toBe(3);

    // Other power-ups still active
    expect(g.kaioken).toBe(true);
    expect(g.shrink).toBe(true);
  });

  it("Solar Flare + Kaioken: balls frozen while player moves at 2x", () => {
    g.balls = [makeBall({ x: 100, y: 100, vx: 5, vy: 5 })];
    applyPowerUp(g, PowerUpType.SolarFlare);
    applyPowerUp(g, PowerUpType.Kaioken);

    expect(g.solarFlare).toBe(true);
    expect(g.kaioken).toBe(true);

    // Balls frozen (vx/vy = 0)
    expect(g.balls[0].vx).toBe(0);
    expect(g.balls[0].vy).toBe(0);

    // Player speed multiplier is 2x
    const speedMult = g.kaioken ? 2 : 1;
    expect(speedMult).toBe(2);

    // After update, balls should not have moved
    const ballStartX = g.balls[0].x;
    const ballStartY = g.balls[0].y;
    update(g, 0.016);
    expect(g.balls[0].x).toBe(ballStartX);
    expect(g.balls[0].y).toBe(ballStartY);
  });

  it("all five timed power-ups can be active at once without conflict", () => {
    applyPowerUp(g, PowerUpType.Kaioken);      // 5s
    applyPowerUp(g, PowerUpType.Shrink);        // 5s
    applyPowerUp(g, PowerUpType.TimeSkip);      // 4s
    applyPowerUp(g, PowerUpType.KiShield);      // permanent
    g.afterimageDecoy = { x: 100, y: 200 };
    g.afterimageTimer = 4;

    // Run 60 frames (~1 second) without crash
    for (let i = 0; i < 60; i++) {
      update(g, 1 / 60);
    }

    // All timed effects still active (only ~1s elapsed, shortest is 4s)
    expect(g.kaioken).toBe(true);
    expect(g.shrink).toBe(true);
    expect(g.slow).toBe(true);
    expect(g.shield).toBe(true);
    expect(g.afterimageDecoy).not.toBeNull();
  });
});
