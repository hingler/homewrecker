import { vec2, vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { generateDirNorm } from "../generateDirNorm";

export class BodyTexcoordGenerator {
  static getTexScale(segment: Segment, height: number, extrude: number) {
    const {startRef, endRef} = generateDirNorm(segment);
    const temp = vec3.create();
    vec3.sub(temp, endRef, startRef);
    let dirLength = vec3.length(temp);
    // build a pair of simple boxes with mins and maxes, separated by 0.5 vertically
    // scale down the pair to fit
    
    if (segment.startJoin) {
      dirLength -= extrude;
    }

    const boxWide = [0.125, 0.125, 0.125 + dirLength + 2 * extrude, 0.125 + height];
    const boxThin = [0.125, 0.125, 0.125 + 2 * extrude, 0.125 + height];

    const boxMaxX = boxWide[2];
    const boxMaxY = boxThin[3];

    const scale = 0.98 / Math.max(boxMaxX, boxMaxY);

    return scale;
  }

  static generateBodyTexcoords(segment: Segment, height: number, extrude: number, texScale?: number) {
    // we can reuse texcoords!
    // only one pair of faces will be visible at a time...
    // so we can just recycle!

    // create two bounding boxes, one just below the other
    // fit them into [0, 1] by scaling down

    const {startRef, endRef} = generateDirNorm(segment);
    const temp = vec3.create();
    vec3.sub(temp, endRef, startRef);
    let dirLength = vec3.length(temp);
    // build a pair of simple boxes with mins and maxes, separated by 0.5 vertically
    // scale down the pair to fit
    
    if (segment.startJoin) {
      dirLength -= extrude;
    }

    const boxWide = [0.125, 0.125, 0.125 + dirLength + 2 * extrude, 0.125 + height];
    const boxThin = [0.125, 0.125, 0.125 + 2 * extrude, 0.125 + height];

    const boxMaxX = boxWide[2];
    const boxMaxY = boxThin[3];

    const scale = texScale !== undefined ? texScale : (0.98 / Math.max(boxMaxX, boxMaxY));

    for (let i = 0; i < 4; i++) {
      boxWide[i] *= scale;
      boxThin[i] *= scale;
    }

    const res = [] as number[];

    for (let i = 0; i < 4; i++) {
      const box = (i & 1 ? boxThin : boxWide);
      res.push(box[0], box[1]);
      res.push(box[0], box[3]);
      res.push(box[2], box[3]);
      res.push(box[2], box[1]);
    }

    return res;
  }

  static generateBodyTexcoordsFromCurve(points: Array<number>, height: number, texScale?: number) {
    // figure out length of our curve
    // scale down
    // map texcoords by just multiplying coords by a scale factor
    // note: top is 0, bottom is val!

    let texHeight = height;
    let texBase = 0.5;

    let scaleFactor : number;

    const res : Array<number> = [];
    const start = vec3.create();
    const end = vec3.create();
    const temp = vec3.create();

    let texLength = 0;
    if (texScale === undefined) {
  
      for (let i = 0; i < points.length; i += 2) {
        const indStart = i;
        const indEnd = (i + 2) % points.length;
  
        start[0] = points[indStart];
        start[2] = points[indStart + 1];
        end[0]   = points[indEnd];
        end[2]   = points[indEnd + 1];
  
        texLength += vec3.length(vec3.sub(temp, end, start));
      }

      scaleFactor = 0.975 / texLength;
    } else {
      scaleFactor = texScale;
    }


    texBase *= scaleFactor;
    texHeight *= scaleFactor;

    let rollingLength = 0.0125 * scaleFactor;

    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];

      const len = vec3.length(vec3.sub(temp, end, start)) * scaleFactor;

      res.push(rollingLength + len, texBase);
      res.push(rollingLength + len, texHeight);
      res.push(rollingLength, texHeight);
      res.push(rollingLength, texBase);

      rollingLength += len;
    }

    return res;
  }
}