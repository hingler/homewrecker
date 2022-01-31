import { expect } from "chai";
import { vec2 } from "gl-matrix";
import { distanceBetweenLines } from "../ts/model/internal/distanceBetweenLines";

describe("distanceBetweenLines", function() {
  it("Should detect intersecting lines", function() {
    const lineA = [[-1, 0], [1, 0]] as vec2[];
    const lineB = [[0, -1], [0, 1]] as vec2[];
    for (let i = 1; i < 20; i++) {
      lineB[1][1] = i;
      const dist = distanceBetweenLines(lineA[0], lineA[1], lineB[0], lineB[1]);
      expect(dist).to.approximately(0, 0.0001);
    }
  });

  it("Should return the correct distance when lines to not intersect", function() {
    const lineA = [[-1, 2], [1, 2]] as vec2[];
    const lineB = [[0, -1], [0, 1]] as vec2[];
    for (let i = 2; i < 20; i++) {
      lineA[1][1] = i;
      lineA[0][1] = i;
      const dist = distanceBetweenLines(lineA[0], lineA[1], lineB[0], lineB[1]);
      expect(dist).to.approximately(i - 1, 0.0001);
    }
  })
})