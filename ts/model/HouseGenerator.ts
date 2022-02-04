import { BodyGenerator } from "./BodyGenerator";
import { RoofGenerator } from "./RoofGenerator";
import { SegmentGenerator } from "./SegmentGenerator";
import { GLModelSpec } from "nekogirl-valhalla/model/GLModelSpec";
import { AttributeType } from "nekogirl-valhalla/model/AttributeType";
import { DataType } from "nekogirl-valhalla/model/DataType";

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

    const bodyModelSpec = new GLModelSpec();
    const roofModelSpec = new GLModelSpec();

    bodyModelSpec.setAttribute(bodyBuf.geometry, AttributeType.POSITION, bodyBuf.POSITION_COMPONENTS, DataType.FLOAT, bodyBuf.vertices, bodyBuf.POSITION_OFFSET, bodyBuf.BYTE_STRIDE);
    bodyModelSpec.setAttribute(bodyBuf.geometry, AttributeType.NORMAL, bodyBuf.NORMAL_COMPONENTS, DataType.FLOAT, bodyBuf.vertices, bodyBuf.NORMAL_OFFSET, bodyBuf.BYTE_STRIDE);
    bodyModelSpec.setAttribute(bodyBuf.geometry, AttributeType.TEXCOORD, bodyBuf.TEXCOORD_COMPONENTS, DataType.FLOAT, bodyBuf.vertices, bodyBuf.TEXCOORD_OFFSET, bodyBuf.BYTE_STRIDE);
    bodyModelSpec.setAttribute(bodyBuf.geometry, AttributeType.TANGENT, bodyBuf.TANGENT_COMPONENTS, DataType.FLOAT, bodyBuf.vertices, bodyBuf.TANGENT_OFFSET, bodyBuf.BYTE_STRIDE);
    
    roofModelSpec.setAttribute(roofBuf.geometry, AttributeType.POSITION, roofBuf.POSITION_COMPONENTS, DataType.FLOAT, roofBuf.vertices, roofBuf.POSITION_OFFSET, roofBuf.BYTE_STRIDE);
    roofModelSpec.setAttribute(roofBuf.geometry, AttributeType.NORMAL, roofBuf.NORMAL_COMPONENTS, DataType.FLOAT, roofBuf.vertices, roofBuf.NORMAL_OFFSET, roofBuf.BYTE_STRIDE);
    roofModelSpec.setAttribute(roofBuf.geometry, AttributeType.TEXCOORD, roofBuf.TEXCOORD_COMPONENTS, DataType.FLOAT, roofBuf.vertices, roofBuf.TEXCOORD_OFFSET, roofBuf.BYTE_STRIDE);
    roofModelSpec.setAttribute(roofBuf.geometry, AttributeType.TANGENT, roofBuf.TANGENT_COMPONENTS, DataType.FLOAT, roofBuf.vertices, roofBuf.TANGENT_OFFSET, roofBuf.BYTE_STRIDE);

    bodyModelSpec.setIndex(bodyBuf.index, DataType.UNSIGNED_SHORT, bodyBuf.indices, 0);
    roofModelSpec.setIndex(roofBuf.index, DataType.UNSIGNED_SHORT, roofBuf.indices, 0);

    // decals should be *much* easier with the generated path

    // todo: generalise sweep code to make some gutters?
  
    return [bodyModelSpec, roofModelSpec];
  }
}