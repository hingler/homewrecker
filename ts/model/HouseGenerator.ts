import { BodyGenerator } from "./BodyGenerator";
import { RoofGenerator } from "./RoofGenerator";
import { SegmentGenerator } from "./SegmentGenerator";

export interface HouseOptions {
  seed?: number,
  texScaleRoof?: number,
  texScaleBody?: number
}

export class HouseGenerator {
  static generateHouse(heightBody: number, heightRoof: number, extrude: number, overhang: number, opts?: HouseOptions) {
    const overhangActual = Math.max(overhang, 0.0);

    const tOverhang = overhangActual / (extrude + overhangActual);

    const heightBodyActual = heightBody + tOverhang * heightRoof;
    
    const segs = SegmentGenerator.generateSegments(extrude + overhangActual, opts ? opts.seed : undefined);

    const bodyBuf = BodyGenerator.generateBody(segs, heightBodyActual, extrude, opts ? opts.texScaleBody : undefined);
    const roofBuf = RoofGenerator.generateRoof(segs, heightRoof, extrude + overhangActual, heightBody, opts ? opts.texScaleRoof : undefined);

    // decals should be *much* easier with the generated path

    // todo: generalise sweep code to make some gutters?
  
    return [bodyBuf, roofBuf];
  }
}