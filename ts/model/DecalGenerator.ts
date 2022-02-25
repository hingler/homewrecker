import { quat, vec2, vec3 } from "gl-matrix";
import { xorshift32, xorshift32_float } from "nekogirl-valhalla/random/Xorshift32";
import { RoofSegmentedCurveBuilder } from "../curve/RoofSegmentedCurveBuilder";
import { DecalObject } from "../decal/DecalObject";
import { DecalType } from "../decal/DecalType";
import { Segment } from "../segment/Segment";
import { RoofPositionGenerator } from "./internal/roof/RoofPositionGenerator";

// ~7.5"
const SINGLE_STAIR_HEIGHT_METERS = 0.19325;

// ~11"
const SINGLE_STAIR_LENGTH_METERS = 0.28;

// ~96"
const MIN_CEILING_HEIGHT = 2.4;

// ~108"
const MAX_CEILING_HEIGHT = 2.7;

// ~80"
const DOOR_HEIGHT = 2.03;

// ~36"
const DOOR_WIDTH = .914;

// ~48"
const HUNG_WINDOW_HEIGHT = 1.2;

// ~24"
const HUNG_WINDOW_WIDTH_MIN = 0.6;

// ~48"
const HUNG_WINDOW_WIDTH_MAX = 1.2;

const PICTURE_WINDOW_WIDTH_MIN = 1.2;

// ~14'
const PICTURE_WINDOW_WIDTH_MAX = 4.27;

// ~40"
const WINDOW_HEIGHT_MIN = 1.025;
// ~60"
const WINDOW_HEIGHT_MAX = 1.55;

// use wall size as approx for room size
const WINDOW_TO_WALL_AREA_RATIO = 0.36;

// ~6in between the roof line and the ceil
const CEILING_BUFFER = 0.152;

// max number of stochastic attempts at putting a window on a wall
const WINDOW_FIT_ATTEMPTS_MAX = 16;

// space between windows
const WINDOW_MIN_BUFFER_SPACE = 1.0;

// favor larger windows for generation
const WINDOW_LIST = [
  DecalType.WINDOW_DOUBLEHUNG,
  DecalType.WINDOW_PICTURE,
  DecalType.WINDOW_PICTURE,
  DecalType.WINDOW_PICTURE
]

export class DecalGenerator {
  // use building height to establish first floor height (say up to a few feet)
  // use remaining height to ceiling to establish number of stories, each w floor height
  // for first floor: create at least one door (with stairs if needed)
  // for each floor: generate windows (for now)
  // roof: generate chimneys, vents

  static generateDecals(segs: Array<Segment>, heightBody: number, extrude: number) {
    // determine buildingheight from provided height
    // come up with a ceiling height based on how much wiggle room we have

    // subtract ~8ft
    const stairRoom = (heightBody - MAX_CEILING_HEIGHT - CEILING_BUFFER);

    // 0 - 3 stairs for now
    const stairCount = Math.floor(Math.min(Math.max(stairRoom / SINGLE_STAIR_HEIGHT_METERS, 0), 3) * xorshift32_float());
    const stairHeight = stairCount * (SINGLE_STAIR_HEIGHT_METERS * (0.92 + 0.08 * xorshift32_float()));
    
    const floorHeight = stairHeight;
    const upwardRoom = (heightBody - floorHeight - CEILING_BUFFER);

    // first floor height?

    const storiesMin = Math.floor(upwardRoom / MIN_CEILING_HEIGHT);
    const storiesMax = Math.floor(upwardRoom / MAX_CEILING_HEIGHT);

    const storiesActual = Math.floor(xorshift32_float() * (storiesMax - storiesMin) + storiesMin);

    const ceilingHeight = upwardRoom / storiesActual;

    const firstFloorCeilingHeight = floorHeight + ceilingHeight;

    
    const curve = RoofSegmentedCurveBuilder.getSegmentList(segs, extrude);

    const root = new DecalObject(DecalType.ROOT);

    // choose a door position
    // moves clockwise...
    // so we want to pick an interval whose absolute x component is largest...
    // ... and negative.

    const targetSegment = this.getRandomFrontFacingSegment(curve.points);

    // todo:
    // - create a door
    // - if elevated...
    //  - create a platform for said door
    //  - create stairs in front of the platform
    
    const doorPos = vec2.add(vec2.create(), targetSegment[0], targetSegment[1]);
    vec2.scale(doorPos, doorPos, 0.5);

    // door
    const door = new DecalObject(DecalType.DOOR, targetSegment[2]);
    door.setPosition(doorPos[0], floorHeight + DOOR_HEIGHT * 0.5, doorPos[1]);
    door.setScale(DOOR_WIDTH, DOOR_HEIGHT, 0.25);
    
    if (stairCount > 0) {
      // platform
      const platform = new DecalObject(DecalType.PLATFORM, targetSegment[2]);
      const platformWidth = DOOR_WIDTH + 0.5 + xorshift32_float() * 0.5;
      const platformLength = DOOR_HEIGHT * (0.4 + 0.4 * xorshift32_float());
      platform.setScale(platformWidth, stairHeight, platformLength);
      platform.setPosition(doorPos[0], stairHeight / 2, doorPos[1] - platformLength / 2);
      root.addChild(platform);
  
      // stairs
      if (stairCount > 1) {
        const stairs = new DecalObject(DecalType.STAIRS, targetSegment[2]);
        const stairLength = SINGLE_STAIR_LENGTH_METERS * (stairCount - 1);
        stairs.setScale(platformWidth, stairHeight, stairLength);
        stairs.setPosition(doorPos[0], stairHeight / 2, doorPos[1] - platformLength - stairLength / 2);
        root.addChild(stairs);
      }
      
    }

    root.addChild(door);


    // then, for each floor:
    // - generate some windows!
    // - windows always line up, with the door replaced by a window on addl floors

    // window template
    const windowList = this.generateWindows(curve.points, floorHeight + DOOR_HEIGHT, firstFloorCeilingHeight, targetSegment[2]);

    for (let window of windowList) {
      root.addChild(window);
    }

    for (let i = 1; i < storiesActual; i++) {
      const delta = ceilingHeight * i;

      for (let window of windowList) {
        const win = new DecalObject(window.type, window.segmentIndex);
        const pos = vec3.copy(vec3.create(), window.getPosition());
        pos[1] += delta;
        win.setPosition(pos);
        win.setRotationQuat(window.getRotation());
        win.setScale(window.getScale());
        root.addChild(win);
      }
    }


    // lastly, on the roof:
    // - add some vents
    // - add a chimney near one of the roof points

    // also todo:
    // - merge nearby points in our segment list
    // - later points take precedence over older ones, if they are suff. close

    return root;
  
  }

  private static generateWindows(points: Array<number>, heightWindow: number, heightCeiling: number, doorSegment: number) {
    // pass the door segment so that we don't place windows over it
    // for each segment:
    // - check if the segment is long enough to fit a window (lets say min window length w wiggle room)
    // - see how many of the same window size can fit
    // - choose a random number of windows (biased towards a larger number, possibly 0)
    // - evenly space these windows across the segment

    // this is just the ground floor for now

    const start = vec2.create();
    const end = vec2.create();

    const temp = vec2.create();

    const res : Array<DecalObject> = [];

    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[1] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[1]   = points[indEnd + 1];

      if (doorSegment !== indStart) {
        console.log(doorSegment);
        console.log(indStart);
        // no windows on door segment (for now :()
        res.push(...this.generateWindowsOnSegment(start, end, temp, heightWindow, heightCeiling, indStart));
      }
    }

    return res;
  }

  private static generateWindowsOnSegment(start: vec2, end: vec2, temp: vec2, heightWindow: number, heightCeiling: number, index: number) {
    vec2.sub(temp, end, start);

    const len = vec2.len(temp);

    // flip temp so our axes are correct
    vec2.scale(temp, temp, -1);

    const rot = Math.atan2(temp[1], temp[0]) * (180 / Math.PI);

    vec2.scale(temp, temp, -1);

    let winType : DecalType;
    let windowCountTarget = -1;
    let winDims : vec2;
    

    // determine a window type
    let tryCount = 0;
    while (windowCountTarget <= 0 && tryCount < WINDOW_FIT_ATTEMPTS_MAX) {
      winType = WINDOW_LIST[Math.floor(xorshift32_float() * WINDOW_LIST.length)];
      winDims = this.getWindowDims(winType);
  
      const wallArea = len * heightCeiling;
      const windowArea = winDims[0] * winDims[1];
  
      // sometimes it spits out large windows
      windowCountTarget = Math.floor((wallArea * WINDOW_TO_WALL_AREA_RATIO) / windowArea);
      windowCountTarget = Math.min(windowCountTarget, Math.floor(len / (winDims[0] + WINDOW_MIN_BUFFER_SPACE)));
      tryCount++;
    }

    windowCountTarget = Math.round(Math.pow(xorshift32_float(), 0.6) * windowCountTarget);

    vec2.scale(temp, temp, (1.0 / (windowCountTarget + 1)));
    
    const windowPosCursor = vec2.create();
    vec2.add(windowPosCursor, start, temp);

    const res : Array<DecalObject> = [];

    for (let i = 0; i < windowCountTarget; i++) {
      const decal = new DecalObject(winType, index);
      decal.setRotationEuler(0, rot, 0);
      decal.setPosition(windowPosCursor[0], heightWindow - winDims[1] / 2, windowPosCursor[1]);
      decal.setScale(winDims[0], winDims[1], 0.25);

      res.push(decal);
      
      vec2.add(windowPosCursor, windowPosCursor, temp);
    }

    return res;
  }

  private static getWindowDims(type: DecalType) : [number, number] {
    const height = xorshift32_float() * (WINDOW_HEIGHT_MAX - WINDOW_HEIGHT_MIN) + WINDOW_HEIGHT_MIN;
    switch (type) {
      case DecalType.WINDOW_PICTURE:
        // nudge towards smaller values
        return [Math.pow(xorshift32_float(), 0.5) * (PICTURE_WINDOW_WIDTH_MAX - PICTURE_WINDOW_WIDTH_MIN) + PICTURE_WINDOW_WIDTH_MIN, height]
      case DecalType.WINDOW_DOUBLEHUNG:
        return [Math.pow(xorshift32_float(), 0.6) * (HUNG_WINDOW_WIDTH_MAX - HUNG_WINDOW_WIDTH_MIN) + HUNG_WINDOW_WIDTH_MIN, HUNG_WINDOW_HEIGHT];
      default:
        // reuse HUNG_WINDOW_HEIGHT as a default height
        return [HUNG_WINDOW_HEIGHT, height];
    }
  }

  private static getRandomFrontFacingSegment(points: Array<number>) : [vec2, vec2, number] {
    const start = vec2.create();
    const end = vec2.create();

    const temp = vec2.create();

    const candidates : Array<number> = [];

    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[1] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[1]   = points[indEnd + 1];

      vec2.sub(temp, end, start);

      // this introduces a hazardous condition if no segments pass
      if (temp[0] > 0 && Math.abs(temp[0]) >= Math.abs(temp[1]) && vec2.length(temp) > 1.5) {
        candidates.push(i);
      }
    }

    const segStartIndex = candidates[xorshift32() % candidates.length];
    const segEndIndex = (segStartIndex + 2) % points.length;
    
    start[0] = points[segStartIndex];
    start[1] = points[segStartIndex + 1];
    end[0]   = points[segEndIndex];
    end[1]   = points[segEndIndex + 1];

    // note: length could be too short?
    // limiting it is not a viable condition right now so lets just ignore it :D
    return [ start, end, segStartIndex ];
  }
};