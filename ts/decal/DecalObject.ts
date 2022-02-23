import { TransformableNestable } from "nekogirl-valhalla/object/TransformableNestable";
import { NestableComponent } from "nekogirl-valhalla/object/NestableComponent";
import { TransformableBase, TransformableComponent } from "nekogirl-valhalla/object/TransformableBase";
import { TransformableNestableComponent } from "nekogirl-valhalla/object/TransformableNestableComponent";
import { IDGenerator } from "nekogirl-valhalla/object/IDGenerator";
import { quat, ReadonlyMat4, ReadonlyQuat, ReadonlyVec3, vec3 } from "gl-matrix";
import { DecalType } from "./DecalType";

/**
 * Object used to represent a simple decal.
 * Decals are applied to houses to give them some flair :D
 */
export class DecalObject implements TransformableNestable<DecalObject> {
  private nest : NestableComponent<DecalObject>;
  private transform : TransformableComponent;
  private nesttransform : TransformableNestableComponent<DecalObject>;

  readonly type : DecalType;

  private dirty: boolean;

  private static gen = new IDGenerator();

  constructor(type: DecalType) {
    this.nest = new NestableComponent(DecalObject.gen.getNewID(), this);
    this.transform = new TransformableBase();
    this.nesttransform = new TransformableNestableComponent(this as DecalObject);

    this.type = type;
  }

  getParent() {
    return this.nest.getParent();
  }

  getChild(id: number) {
    return this.nest.getChild(id);
  }

  getChildren() {
    return this.nest.getChildren();
  }

  getId() {
    return this.nest.getId();
  }

  setId(id: number) {
    return this.nest.setId(id);
  }

  removeChild(id: number) {
    const child = this.nest.removeChild(id);
    if (child) {
      child.invalidateTransformCache_();
    }

    return child;
  }

  addChild(elem: DecalObject) {
    const res = this.nest.addChild(elem.nest);
    elem.invalidateTransformCache_();
    return res;
  }

  getRotation() {
    return this.transform.getRotation();
  }

  getPosition() {
    return this.transform.getPosition();
  }

  getScale() {
    return this.transform.getScale();
  }

  setRotationEuler(x: number | ReadonlyVec3, y?: number, z?: number) {
    this.transform.setRotationEuler(x, y, z);
    this.invalidateTransformCache_();
  }

  setRotationQuat(x: number | ReadonlyQuat, y?: number, z?: number, w?: number) {
    this.transform.setRotationQuat(x, y, z, w);
    this.invalidateTransformCache_();
  }

  setScale(x: number | ReadonlyVec3, y?: number, z?: number) {
    this.transform.setScale(x, y, z);
    this.invalidateTransformCache_();
  }

  setPosition(x: number | ReadonlyVec3, y?: number, z?: number) {
    this.transform.setPosition(x, y, z);
    this.invalidateTransformCache_();
  }

  getGlobalPosition() {
    return this.nesttransform.getGlobalPosition();
  }

  lookAt(x: number | vec3, y?: number, z?: number) {
    this.nesttransform.lookAt(x, y, z);
    this.invalidateTransformCache_();
  }

  private invalidateTransformCache_() {
    this.nesttransform.invalidateTransformCache();

    if (!this.dirty) {
      this.dirty = true;
      for (let child of this.nest.getChildren()) {
        child.invalidateTransformCache_();
      }
    }
  }

  getTransformationMatrix() : ReadonlyMat4 {
    this.dirty = false;
    return this.nesttransform.getTransformationMatrix();
  }
}