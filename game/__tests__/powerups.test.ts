import { describe, it, expect, beforeEach } from "vitest";
import { makeGame, initRound, startGame } from "../state";
import { GameState, ST, Ball } from "../types";
import { BallType } from "../balls/types";
import { PowerUpType, POWER_UP_CONFIGS } from "../powerups/types";
import { getAvailablePowerUps, spawnPowerUp, randomSpawnTimer } from "../powerups/factory";
import { applyPowerUp, activateInstantTransmission, completeSpiritBomb, cancelSpiritBomb } from "../powerups/effects";
import { update } from "../update";

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

describe("Power-up types", () => {
  it("should have 10 power-up types", () => {
    const types = Object.values(PowerUpType);
    expect(types).toHaveLength(10);
  });

  it("should have a config for each type", () => {
    for (const type of Object.values(PowerUpType)) {
      expect(POWER_UP_CONFIGS[type]).toBeDefined();
      expect(POWER_UP_CONFIGS[type].label).toBeTruthy();
      expect(POWER_UP_CONFIGS[type].icon).toBeTruthy();
      expect(POWER_UP_CONFIGS[type].color).toBeTruthy();
    }
  });
});

describe("Power-up spawn rules", () => {
  it("should respect 2-4s spawn timer interval", () => {
    for (let i = 0; i < 50; i++) {
      const t = randomSpawnTimer();
      expect(t).toBeGreaterThanOrEqual(2);
      expect(t).toBeLessThanOrEqual(4);
    }
  });

  it("should limit max 3 power-ups on screen", () => {
    const g = makeDodgeState();
    g.round = 5;
    g.powerUpSpawnTimer = 0;

    // Spawn first
    update(g, 0.016);
    const first = g.powerUps.length;
    expect(first).toBeLessThanOrEqual(3);

    // Force-add 3 power-ups
    g.powerUps = [
      spawnPowerUp(g.round, g.balls),
      spawnPowerUp(g.round, g.balls),
      spawnPowerUp(g.round, g.balls),
    ];
    g.powerUpSpawnTimer = -1; // Force spawn attempt

    const beforeCount = g.powerUps.length;
    update(g, 0.016);
    // Should not exceed 3 uncollected
    const uncollected = g.powerUps.filter(p => !p.collected);
    expect(uncollected.length).toBeLessThanOrEqual(3);
    // Total count should be >= what we started with (no loss)
    expect(g.powerUps.length).toBeGreaterThanOrEqual(beforeCount);
  });

  it("should allow power-ups from round 1", () => {
    const g = makeDodgeState();
    g.round = 1;
    g.powerUpSpawnTimer = -1; // Force spawn attempt
    g.powerUps = [];
    update(g, 0.016);
    // Should have spawned a power-up at round 1
    expect(g.powerUps.length).toBeGreaterThanOrEqual(1);
  });

  it("should gate Senzu Bean to round 5+", () => {
    const round1Types = getAvailablePowerUps(1);
    const hasSenzu1 = round1Types.some(c => c.type === PowerUpType.SenzuBean);
    expect(hasSenzu1).toBe(false);

    const round5Types = getAvailablePowerUps(5);
    const hasSenzu5 = round5Types.some(c => c.type === PowerUpType.SenzuBean);
    expect(hasSenzu5).toBe(true);
  });

  it("should gate Spirit Bomb to round 5+", () => {
    const round1Types = getAvailablePowerUps(1);
    const hasSB1 = round1Types.some(c => c.type === PowerUpType.SpiritBombCharge);
    expect(hasSB1).toBe(false);

    const round5Types = getAvailablePowerUps(5);
    const hasSB5 = round5Types.some(c => c.type === PowerUpType.SpiritBombCharge);
    expect(hasSB5).toBe(true);
  });

  it("should make Destructo Disc available from round 3+", () => {
    const round2Types = getAvailablePowerUps(2);
    const hasDD2 = round2Types.some(c => c.type === PowerUpType.DestructoDisc);
    expect(hasDD2).toBe(false);

    const round3Types = getAvailablePowerUps(3);
    const hasDD3 = round3Types.some(c => c.type === PowerUpType.DestructoDisc);
    expect(hasDD3).toBe(true);
  });
});

describe("Power-up effects", () => {
  describe("Instant Transmission", () => {
    it("should grant 3 uses on collection", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.InstantTransmission);
      expect(g.instantTransmissionUses).toBe(3);
    });

    it("should decrement uses on teleport", () => {
      const g = makeDodgeState();
      g.instantTransmissionUses = 3;
      const used = activateInstantTransmission(g);
      expect(used).toBe(true);
      expect(g.instantTransmissionUses).toBe(2);
    });

    it("should fail when no uses remaining", () => {
      const g = makeDodgeState();
      g.instantTransmissionUses = 0;
      const used = activateInstantTransmission(g);
      expect(used).toBe(false);
      expect(g.instantTransmissionUses).toBe(0);
    });

    it("should teleport player to a new position", () => {
      const g = makeDodgeState();
      g.instantTransmissionUses = 1;
      const oldX = g.px;
      const oldY = g.py;
      activateInstantTransmission(g);
      // Position should change (very unlikely to land on exact same spot)
      const moved = g.px !== oldX || g.py !== oldY;
      expect(moved).toBe(true);
    });
  });

  describe("Ki Shield", () => {
    it("should set shield to true without timer", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.KiShield);
      expect(g.shield).toBe(true);
      expect(g.shieldTimer).toBe(0);
    });

    it("should consume shield on hit instead of losing life", () => {
      const g = makeDodgeState();
      g.shield = true;
      g.lives = 3;
      // Place a ball right on the player
      g.balls = [makeBall({ x: g.px, y: g.py })];

      update(g, 0.016);

      expect(g.shield).toBe(false);
      expect(g.lives).toBe(3); // No life lost
    });
  });

  describe("Kaioken", () => {
    it("should activate 2x speed for 5 seconds", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.Kaioken);
      expect(g.kaioken).toBe(true);
      expect(g.kaiokenTimer).toBe(5);
    });

    it("should deactivate after timer expires", () => {
      const g = makeDodgeState();
      g.kaioken = true;
      g.kaiokenTimer = 0.01;
      update(g, 0.02);
      expect(g.kaioken).toBe(false);
    });
  });

  describe("Solar Flare", () => {
    it("should freeze all balls", () => {
      const g = makeDodgeState();
      g.balls = [makeBall({ x: 100, y: 100, vx: 5, vy: 5 })];
      applyPowerUp(g, PowerUpType.SolarFlare);
      expect(g.solarFlare).toBe(true);
      expect(g.solarFlareTimer).toBe(3);
      // Balls should have saved velocities and be frozen
      expect(g.balls[0].vx).toBe(0);
      expect(g.balls[0].vy).toBe(0);
      expect(g.balls[0].savedVx).toBe(5);
      expect(g.balls[0].savedVy).toBe(5);
    });

    it("should restore ball velocities after timer expires", () => {
      const g = makeDodgeState();
      g.balls = [makeBall({ x: 100, y: 100, vx: 0, vy: 0, savedVx: 5, savedVy: 5 })];
      g.solarFlare = true;
      g.solarFlareTimer = 0.01;
      update(g, 0.02);
      expect(g.solarFlare).toBe(false);
      expect(g.balls[0].vx).toBe(5);
      expect(g.balls[0].vy).toBe(5);
    });
  });

  describe("Senzu Bean", () => {
    it("should add 1 life", () => {
      const g = makeDodgeState();
      g.lives = 2;
      applyPowerUp(g, PowerUpType.SenzuBean);
      expect(g.lives).toBe(3);
    });
  });

  describe("Time Skip", () => {
    it("should slow balls to 0.3x speed for 4 seconds", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.TimeSkip);
      expect(g.slow).toBe(true);
      expect(g.slowTimer).toBe(4);
    });
  });

  describe("Destructo Disc", () => {
    it("should destroy one random special ball", () => {
      const g = makeDodgeState();
      g.balls = [
        makeBall({ type: BallType.Dodgeball, x: 100, y: 100 }),
        makeBall({ type: BallType.Tracker, x: 150, y: 150 }),
        makeBall({ type: BallType.Ghost, x: 200, y: 200 }),
      ];
      applyPowerUp(g, PowerUpType.DestructoDisc);
      const deadCount = g.balls.filter(b => b.dead).length;
      expect(deadCount).toBe(1);
      // Dodgeball should survive
      const dodgeballs = g.balls.filter(b => b.type === BallType.Dodgeball);
      expect(dodgeballs.every(b => !b.dead)).toBe(true);
    });

    it("should do nothing when no special balls exist", () => {
      const g = makeDodgeState();
      g.balls = [makeBall({ type: BallType.Dodgeball, x: 100, y: 100 })];
      applyPowerUp(g, PowerUpType.DestructoDisc);
      expect(g.balls.every(b => !b.dead)).toBe(true);
    });
  });

  describe("Afterimage", () => {
    it("should create a decoy at player position", () => {
      const g = makeDodgeState();
      g.px = 150;
      g.py = 250;
      applyPowerUp(g, PowerUpType.Afterimage);
      expect(g.afterimageDecoy).toEqual({ x: 150, y: 250 });
      expect(g.afterimageTimer).toBe(4);
    });

    it("should expire after timer runs out", () => {
      const g = makeDodgeState();
      g.afterimageDecoy = { x: 100, y: 100 };
      g.afterimageTimer = 0.01;
      update(g, 0.02);
      expect(g.afterimageDecoy).toBeNull();
    });
  });

  describe("Shrink", () => {
    it("should halve hitbox for 5 seconds", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.Shrink);
      expect(g.shrink).toBe(true);
      expect(g.shrinkTimer).toBe(5);
    });

    it("should deactivate after timer expires", () => {
      const g = makeDodgeState();
      g.shrink = true;
      g.shrinkTimer = 0.01;
      update(g, 0.02);
      expect(g.shrink).toBe(false);
    });
  });

  describe("Spirit Bomb", () => {
    it("should start channeling on collection", () => {
      const g = makeDodgeState();
      applyPowerUp(g, PowerUpType.SpiritBombCharge);
      expect(g.spiritBombCharging).toBe(true);
      expect(g.spiritBombTimer).toBe(3);
    });

    it("should cancel if player moves during channeling", () => {
      const g = makeDodgeState();
      g.spiritBombCharging = true;
      g.spiritBombTimer = 2;
      g.spiritBombX = g.px;
      g.spiritBombY = g.py;
      // Move player significantly
      g.pvx = 10;
      g.pvy = 10;
      update(g, 0.016);
      expect(g.spiritBombCharging).toBe(false);
    });

    it("should destroy all non-Dodgeball balls on completion", () => {
      const g = makeDodgeState();
      g.balls = [
        makeBall({ type: BallType.Dodgeball, x: 100, y: 100 }),
        makeBall({ type: BallType.Tracker, x: 200, y: 200 }),
        makeBall({ type: BallType.Ghost, x: 300, y: 300 }),
      ];
      completeSpiritBomb(g);
      expect(g.balls[0].dead).toBe(false); // Dodgeball survives
      expect(g.balls[1].dead).toBe(true);
      expect(g.balls[2].dead).toBe(true);
      expect(g.spiritBombCharging).toBe(false);
    });

    it("should complete when timer reaches 0", () => {
      const g = makeDodgeState();
      g.spiritBombCharging = true;
      g.spiritBombTimer = 0.01;
      g.spiritBombX = g.px;
      g.spiritBombY = g.py;
      g.pvx = 0;
      g.pvy = 0;
      g.balls = [
        makeBall({ type: BallType.Tracker, x: 100, y: 100, vx: 0, vy: 0 }),
      ];
      update(g, 0.02);
      expect(g.spiritBombCharging).toBe(false);
      // The tracker should have been marked dead
      // (it gets filtered out during update, so check it's gone)
      expect(g.balls.length).toBe(0);
    });

    it("should cancel Spirit Bomb and set message", () => {
      const g = makeDodgeState();
      g.spiritBombCharging = true;
      g.spiritBombTimer = 2;
      cancelSpiritBomb(g);
      expect(g.spiritBombCharging).toBe(false);
      expect(g.spiritBombTimer).toBe(0);
      expect(g.msg).toBe("SPIRIT BOMB CANCELLED!");
    });
  });
});

describe("initRound power-up reset", () => {
  it("should clear power-ups array on new round", () => {
    const g = makeDodgeState();
    g.powerUps = [spawnPowerUp(3, [])];
    initRound(g);
    expect(g.powerUps).toHaveLength(0);
  });

  it("should reset timed effects but keep shield", () => {
    const g = makeDodgeState();
    g.shield = true;
    g.kaioken = true;
    g.shrink = true;
    g.slow = true;
    g.solarFlare = true;
    g.spiritBombCharging = true;
    g.afterimageDecoy = { x: 100, y: 100 };
    g.instantTransmissionUses = 2;
    initRound(g);

    // Shield and IT uses persist
    expect(g.shield).toBe(true);
    expect(g.instantTransmissionUses).toBe(2);

    // Timed effects reset
    expect(g.kaioken).toBe(false);
    expect(g.shrink).toBe(false);
    expect(g.slow).toBe(false);
    expect(g.solarFlare).toBe(false);
    expect(g.spiritBombCharging).toBe(false);
    expect(g.afterimageDecoy).toBeNull();
  });

  it("should set a new power-up spawn timer", () => {
    const g = makeDodgeState();
    g.powerUpSpawnTimer = 0;
    initRound(g);
    // randomSpawnTimer() returns 2-4s, scaled by (1 - powerUpChance * 0.5)
    // At round 3, powerUpChance ≈ 0.12, scale ≈ 0.94, so min ≈ 1.88
    expect(g.powerUpSpawnTimer).toBeGreaterThanOrEqual(1.5);
    expect(g.powerUpSpawnTimer).toBeLessThanOrEqual(4.5);
  });
});

describe("Power-up collection in update", () => {
  it("should collect power-up when player is within 20px", () => {
    const g = makeDodgeState();
    g.powerUps = [{
      x: g.px + 10,
      y: g.py,
      type: PowerUpType.Kaioken,
      collected: false,
    }];
    update(g, 0.016);
    expect(g.kaioken).toBe(true);
    // Collected power-ups get removed
    expect(g.powerUps.length).toBe(0);
  });
});
