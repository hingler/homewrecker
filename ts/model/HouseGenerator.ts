import { BodyGenerator } from "./BodyGenerator";
import { RoofGenerator } from "./RoofGenerator";
import { SegmentGenerator } from "./SegmentGenerator";

export class HouseGenerator {
  static generateHouse(heightBody: number, heightRoof: number, extrude: number, overhang: number, seed?: number) {
    const overhangActual = Math.max(overhang, 0.0);

    const tOverhang = overhangActual / (extrude + overhangActual);

    const heightBodyActual = heightBody + tOverhang * heightRoof;
    
    const segs = SegmentGenerator.generateSegments(extrude + overhangActual, seed);



    const bodyBuf = BodyGenerator.generateBody(segs, heightBodyActual, extrude);
    const roofBuf = RoofGenerator.generateRoof(segs, heightRoof, extrude + overhangActual, heightBody);
  
    return [bodyBuf, roofBuf];
  }
}