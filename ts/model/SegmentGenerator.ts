import { vec2 } from "gl-matrix";
import { xorshift32, xorshift32_float, xorshift32_seed } from "nekogirl-valhalla/random/Xorshift32";
import { Segment } from "../segment/Segment";
import { BodyGenerator } from "./BodyGenerator";
import { distanceBetweenLines } from "./internal/distanceBetweenLines";
import { generateDirNorm } from "./internal/generateDirNorm";
import { RoofGenerator } from "./RoofGenerator";

export interface ProceduralSegment extends Segment {
  // reference to a parent segment's number, or -1
  parent: number;
}

const EDGE_BRANCH_PROBABILITY = 0.125;

export class SegmentGenerator {
  private static getSegmentLength(seg: Segment) {
    const len = vec2.create();
    vec2.sub(len, seg.end, seg.start);
    return vec2.len(len);
  }

  static generateSegments(extrude: number, seed?: number) {
    if (seed !== undefined) {
      xorshift32_seed(seed);
    }

    // create a random initial segment
    // center it and have it sit on an axis


    // 2.5 - 10.0
    const length = 6.0 + xorshift32_float() * 5.0;
    // pull int values from this
    const seed_axis = xorshift32();

    // pull higher ord bits
    const axisHoriz = (seed_axis & 8192 ? 1 : 0);
    const axisVert  = 1 - axisHoriz;

    const rootSegment : ProceduralSegment = {
      start: [-axisHoriz * (length / 2), -axisVert * (length / 2)],
      end: [axisHoriz * (length / 2), axisVert * (length / 2)],
      flat: false,
      startJoin: false,
      parent: -1
    };

    let segmentList : Array<ProceduralSegment> = [ rootSegment ];

    const temp = vec2.create();

    // then, 0 - 3 times:
    // - pick a segment
    // - pick a random spot on that segment to create an orthogonal wing
    // - if there are any parallel segments which also branch off of that wing, skip
    // - determine an arbitrary length (let's cap it at the length of the base segment)

    const wingCount = Math.floor(3.0 * xorshift32_float() + 1.0);
    for (let i = 0; i < wingCount; i++) {
      let placeSegment = false;
      let tries = 0;
      while (!placeSegment && tries < 24) {
        placeSegment = true;
        const index = Math.abs(xorshift32() >>> 12) % segmentList.length;
        // pick random parent
        const parent = segmentList[index];
  
        // boost the probability slightly of branching off the ends
        const branchPos = Math.min(1.0, Math.max(xorshift32_float() * (1.0 + EDGE_BRANCH_PROBABILITY) - 0.5 * EDGE_BRANCH_PROBABILITY, 0.0));
        const startPoint = vec2.create();
  
        // look at parent's params
        const {dir, norm} = generateDirNorm(parent);
        const dir2 = [dir[0], dir[2]] as vec2;
        const norm2 = [norm[0], norm[2]] as vec2;
        vec2.scale(dir2, dir2, this.getSegmentLength(parent));
        // add
        vec2.copy(startPoint, parent.start);
        // startpoint is somewhere along the line
        vec2.scaleAndAdd(startPoint, startPoint, dir2, branchPos);
        const flip = Math.round(xorshift32_float()) * 2 - 1;
        // norm2 is in one of the orthogonal directions
        vec2.scale(norm2, norm2, flip);      
        
        const childLength = 3.5 + xorshift32_float() * 4.5;
        vec2.scale(norm2, norm2, childLength);
        const segChild : ProceduralSegment = {
          start: startPoint,
          end: [startPoint[0] + norm2[0], startPoint[1] + norm2[1]] as vec2,
          flat: false,
          startJoin: true,
          parent: index
        }
  
        for (let j = 0; j < segmentList.length; j++) {
          if (j === index) {
            continue;
          }
  
          const segConflictCheck = segmentList[j];
        
          if (distanceBetweenLines(segConflictCheck.start, segConflictCheck.end, segChild.start, segChild.end) < extrude) {
            placeSegment = false;
            break;
          }

        }

        tries++;

        if (placeSegment) {
          segmentList.push(segChild);
        }
      }

    }

    return segmentList as Array<Segment>;
  }
}