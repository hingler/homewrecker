import { vec3 } from "gl-matrix";
import { Segment } from "../../segment/Segment";
import { RoofPolyData } from "./RoofPolyData";

export class RoofPositionGenerator {
  /**
   * Generates position data for a roof.
   * @param segment - segment being generated.
   * @param height - height of roof at peak (0 is edge)
   * @param extrude - distance from segment to extrude roof.
   * @returns a list of unindexed tri positions which will build the model.
   */
  static generateRoofPositions(segment: Segment, height: number, extrude: number) : RoofPolyData {
    const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
    const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
    const dir = vec3.subtract(vec3.create(), endRef, startRef);
    vec3.normalize(dir, dir);

    const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
    vec3.normalize(norm, norm);

    const temp = vec3.create();
    const temp2 = vec3.create();

    const res = {} as RoofPolyData;
    res.longPlus = [];
    res.longMinus = [];
    res.shortEnd = null;
    res.shortStart = null;

    vec3.copy(temp, endRef);
    temp[1] += height;
    res.longMinus.push(...temp);

    vec3.subtract(temp, temp, vec3.scale(temp2, norm, extrude));
    temp[1] = 0;
    vec3.add(temp, temp, vec3.scale(temp2, dir, (segment.flat ? 0 : extrude)));
    res.longMinus.push(...temp);

    vec3.copy(temp, startRef);
    vec3.subtract(temp, temp, vec3.scale(temp2, norm, extrude));
    vec3.add(temp, temp, vec3.scale(temp2, dir, (segment.startJoin ? extrude : (segment.flat ? 0 : -extrude))));
    res.longMinus.push(...temp);

    vec3.copy(temp, startRef);
    temp[1] += height;
    res.longMinus.push(...temp);

    // copy to right quad by mirroring and reversing vertex order
    for (let i = 9; i >= 0; i -= 3) {
      temp[0] = res.longMinus[i];
      temp[1] = res.longMinus[i + 1];
      temp[2] = res.longMinus[i + 2];

      if (temp[1] === 0) {
        // flip only our 0-height values
        // we specifically assign to 0 so should be fine
        vec3.add(temp, temp, vec3.scale(temp2, norm, 2 * extrude));
      }

      res.longPlus.push(...temp);
    }

    if (!segment.flat) {
      res.shortEnd = [];
      vec3.copy(temp, endRef);
      temp[1] += height;
      res.shortEnd.push(...temp); 
      
      temp[1] = 0;
      vec3.add(temp, temp, vec3.scale(temp2, norm, extrude));
      vec3.add(temp, temp, vec3.scale(temp2, dir, extrude));
      res.shortEnd.push(...temp);
      vec3.sub(temp, temp, vec3.scale(temp2, norm, 2 * extrude));
      res.shortEnd.push(...temp);
      if (!segment.startJoin) {
        res.shortStart = [];
        const len = vec3.len(vec3.sub(temp, endRef, startRef));

        vec3.add(temp2, startRef, vec3.scale(temp, dir, len / 2));
        // copy by rotating 180deg about center
        for (let i = 0; i < res.shortEnd.length; i += 3) {
          temp[0] = res.shortEnd[i];
          temp[1] = res.shortEnd[i + 1];
          temp[2] = res.shortEnd[i + 2];

          vec3.sub(temp, temp, temp2);
          vec3.sub(temp, temp2, temp);
          // flips on Y -- unflip
          temp[1] = -temp[1];
          res.shortStart.push(...temp);
        }
      }
    }
    
    return res;
  }
}