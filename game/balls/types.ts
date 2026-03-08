export enum BallType {
  Dodgeball = "dodgeball",
  Tracker = "tracker",
  Splitter = "splitter",
  Ghost = "ghost",
  Bomber = "bomber",
  Zigzag = "zigzag",
  Giant = "giant",
  SpeedDemon = "speedDemon",
  GravityWell = "gravityWell",
  Mirage = "mirage",
  Ricochet = "ricochet",
}

/** Colors for each ball type */
export const BALL_COLORS: Record<BallType, string> = {
  [BallType.Dodgeball]: "#e63946",
  [BallType.Tracker]: "#9b59b6",
  [BallType.Splitter]: "#2ecc71",
  [BallType.Ghost]: "#ecf0f1",
  [BallType.Bomber]: "#e67e22",
  [BallType.Zigzag]: "#f1c40f",
  [BallType.Giant]: "#8b0000",
  [BallType.SpeedDemon]: "#3498db",
  [BallType.GravityWell]: "#2c0033",
  [BallType.Mirage]: "#ff8c00",
  [BallType.Ricochet]: "#00ced1",
};
