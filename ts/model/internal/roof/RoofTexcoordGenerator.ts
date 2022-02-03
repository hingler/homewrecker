import { vec2, vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { RoofPolyData } from "../RoofPolyData";

const BLOCK_TRI_OFFSET = 0.5;

class TexcoordBlock {
  private texHeight: number;
  private lenShort: number;
  private lenLong: number;
  private offsetLong: number;
  private offsetShort: number;
  private extrude: number;
  private includeTri: boolean;

  private texOffset: vec2;

  scale: number;
  constructor(segment: Segment, height: number, extrude: number, includeTri: boolean, flip: boolean) {
    this.texHeight = Math.sqrt(height * height + extrude * extrude);
    this.extrude = extrude;

    this.lenShort = vec2.len(vec2.sub(vec2.create(), segment.end, segment.start));
    this.lenLong = this.lenShort + (segment.startJoin ? -extrude : (segment.flat ? 0 : extrude)) + (segment.flat ? 0 : extrude);
    this.offsetLong = (segment.startJoin ? 2 * extrude : (segment.flat ? extrude : 0));
    this.offsetShort = extrude;

    if (flip) {
      const short = this.offsetShort;
      this.offsetShort = this.offsetLong;
      this.offsetLong = short;
    }
    
    this.scale = 1.0;
    this.includeTri = includeTri;

    this.texOffset = vec2.create();
  }

  setTexOffset(x: number, y: number) {
    this.texOffset[0] = x;
    this.texOffset[1] = y;
  }

  getBoundingBoxDimensions() : [number, number] {
    const max = Math.max(this.offsetLong, this.offsetShort);
    let maxWidth = ((this.includeTri ? 2 : 0) * this.extrude + max + this.lenLong + BLOCK_TRI_OFFSET);
    const maxHeight = this.texHeight;

    return [maxWidth * this.scale, maxHeight * this.scale];
  }

  getTexcoordData() {
    const res : Array<number> = [];
    res.push(this.offsetShort + this.texOffset[0], this.texOffset[1]);
    res.push(this.offsetLong + this.texOffset[0], this.texHeight + this.texOffset[1]);
    res.push(this.offsetLong + this.texOffset[0] + this.lenLong, this.texHeight + this.texOffset[1]);
    res.push(this.offsetShort + this.lenShort + this.texOffset[0], this.texOffset[1]);

    if (this.includeTri) {
      const max = Math.max(this.offsetLong, this.offsetShort);
      res.push(max + this.lenLong + BLOCK_TRI_OFFSET + this.texOffset[0] + this.extrude,     this.texOffset[1]);
      res.push(max + this.lenLong + BLOCK_TRI_OFFSET + this.texOffset[0],                    this.texHeight + this.texOffset[1]);
      res.push(max + this.lenLong + BLOCK_TRI_OFFSET + this.texOffset[0] + 2 * this.extrude, this.texHeight + this.texOffset[1]);
    }

    for (let i = 0; i < res.length; i++) {
      res[i] *= this.scale;
      if (i % 2) {
        // flip back to texcoord 00 TL, 11 BR
        // res[i] = 1.0 - res[i];
      }
    }

    return res;
  }
}

export class RoofTexcoordGenerator {
  // create two texcoord boxes
  // get the bounding box, of their bounding box
  // scale it up so that it fits inside (0.0, 1.0)
  // reorient texcoord data acc'g to established order
  // return
  static getTexScale(segment: Segment, height: number, extrude: number) {
    // longminus and start
    const texLeft = new TexcoordBlock(segment, height, extrude, (segment.startJoin || segment.flat), segment.startJoin);
    // longplus and end
    const texRight = new TexcoordBlock(segment, height, extrude, segment.flat, false);

    // we apply the same scale factor to both
    let boundLeft = texLeft.getBoundingBoxDimensions();
    let boundRight = texRight.getBoundingBoxDimensions();

    const bindingContainer = [Math.max(boundLeft[0], boundRight[0]), boundLeft[1] + boundRight[1] + BLOCK_TRI_OFFSET];
    const scaleFactor = 0.95 / Math.max(bindingContainer[0], bindingContainer[1]);

    return scaleFactor;
  }

  static generateRoofTexcoords(segment: Segment, height: number, extrude: number, forceScale?: number) : RoofPolyData {
    let res = {} as RoofPolyData;

    res.longPlus = [];
    res.longMinus = [];
    res.shortEnd = (segment.flat ? null : []);
    res.shortStart = (segment.startJoin || segment.flat ? null : []);

    const texLeft = new TexcoordBlock(segment, height, extrude, (res.shortStart !== null), segment.startJoin);
    const texRight = new TexcoordBlock(segment, height, extrude, (res.shortEnd !== null), false);

    // we apply the same scale factor to both
    let boundLeft = texLeft.getBoundingBoxDimensions();
    let boundRight = texRight.getBoundingBoxDimensions();

    const bindingContainer = [Math.max(boundLeft[0], boundRight[0]), boundLeft[1] + boundRight[1] + BLOCK_TRI_OFFSET];
    const scaleFactor = (forceScale !== undefined ? forceScale : 0.95 / Math.max(bindingContainer[0], bindingContainer[1]));
    texLeft.scale = scaleFactor;
    texRight.scale = scaleFactor;

    boundLeft = texLeft.getBoundingBoxDimensions();
    texLeft.setTexOffset(0.0125, 0.0125);
    texRight.setTexOffset(0.0125, 0.0125);

    const dataLeft = texLeft.getTexcoordData();
    const dataRight = texRight.getTexcoordData();
    for (let i = 0; i < 8; i++) {
      // reading backwards works...
      // but we also need to flip on 2s
      res.longMinus.push(dataLeft[i]);
      res.longPlus.push(dataRight[i]);
    }

    for (let i = 8; i < 14; i++) {
      if (res.shortStart !== null) {
        res.shortStart.push(dataLeft[i]);
      }

      if (res.shortEnd !== null) {
        res.shortEnd.push(dataRight[i]);
      }
    }

    return res;
  }

  static generateRoofTexcoordsFromCurve(points: Array<number>, roofPoints: Array<number>, height: number, extrude: number, texScale: number) : Array<Array<number>> {
    const res : Array<Array<number>> = [];
    const start = vec3.create();
    const end = vec3.create();
    const roofStart = vec3.create();
    const roofEnd = vec3.create();
    const temp = vec3.create();

    const tan = vec3.create();
    const bitan = vec3.create();

    for (let i = 0; i < points.length; i += 2) {
      const data : Array<number> = [];
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];

      roofStart[0] = roofPoints[indStart];
      roofStart[1] = height;
      roofStart[2] = roofPoints[indStart + 1];

      roofEnd[0] = roofPoints[indEnd];
      roofEnd[1] = height;
      roofEnd[2] = roofPoints[indEnd + 1];

      // calculate tangent
      vec3.sub(tan, end, start);
      vec3.normalize(tan, tan);

      // placeholder bitangent
      vec3.sub(bitan, start, roofStart);
      vec3.normalize(bitan, bitan);

      // project onto tangent and sub
      vec3.scale(temp, tan, vec3.dot(tan, bitan));
      vec3.sub(bitan, bitan, temp);
      vec3.normalize(bitan, bitan);

      const minMaxTan = [999999999, -999999999];
      const minMaxBitan = [99999999, -999999999];

      for (let point of [end, start, roofStart, roofEnd]) {
        // project x onto tangent
        // project y onto bitangent
        // store in arr
        const tanCoord = vec3.dot(tan, vec3.sub(temp, point, start));
        const bitanCoord = vec3.dot(bitan, vec3.sub(temp, point, start));
        data.push(tanCoord, bitanCoord);
        minMaxTan[0] = Math.min(tanCoord, minMaxTan[0]);
        minMaxTan[1] = Math.max(tanCoord, minMaxTan[1]);
        minMaxBitan[0] = Math.min(bitanCoord, minMaxBitan[0]);
        minMaxBitan[1] = Math.max(bitanCoord, minMaxBitan[1]);
      }

      for (let i = 0; i < 4; i++) {
        const off = 2 * i;
        data[off] -= minMaxTan[0];
        data[off] *= texScale;
        data[off] += 0.0125

        data[off + 1] -= minMaxBitan[0];
        data[off + 1] *= texScale;
        data[off + 1] += 0.0125;
      }

      res.push(data);
    }

    // sides: share y data for both points
    for (let i = 0; i < points.length; i += 2) {
      const data : Array<number> = [];
      // copy from corner pieces
      const resOld = res[Math.round(i / 2)];
      data.push(resOld[0], resOld[1]);
      data.push(resOld[2], resOld[3]);
      data.push(resOld[2], resOld[3]);
      data.push(resOld[0], resOld[1]);
      res.push(data);
    }

    // bottom: tough
    // fuck it lets just reuse it
    // there's little reason to look and tiles dont make sense under there anyway
    for (let i = 0; i < points.length; i += 2) {
      const data : Array<number> = [];
      const resOld = res[Math.round(i / 2)];
      data.push(resOld[2], resOld[3]);
      data.push(resOld[0], resOld[1]);
      data.push(resOld[6], resOld[7]);
      data.push(resOld[4], resOld[5]);
      res.push(data);
    }

    return res;
  }
}