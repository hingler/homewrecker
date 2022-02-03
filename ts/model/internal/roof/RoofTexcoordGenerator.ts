import { vec2 } from "gl-matrix";
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
    let maxWidth = ((this.includeTri ? 2 : 0) * this.extrude + this.offsetLong + this.lenLong + BLOCK_TRI_OFFSET);
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
    texLeft.setTexOffset(0.025, 0.025);
    texRight.setTexOffset(0.025, 0.025);

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
}