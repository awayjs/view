import {
	Vector3D,
	Matrix3D,
	Box, Sphere,
	AbstractionBase,
	AssetEvent,
	Plane3D,
	Point
} from '@awayjs/core';

import { PartitionBase } from '../partition/PartitionBase';
import { IPartitionTraverser } from '../partition/IPartitionTraverser';
import { INode } from '../partition/INode';

import { BoundsPickerPool, PickGroup } from '../PickGroup';
import { BoundingVolumePool } from '../bounds/BoundingVolumePool';
import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { BoundingVolumeBase } from '../bounds/BoundingVolumeBase';
import { BoundingBox } from '../bounds/BoundingBox';
import { BoundingSphere } from '../bounds/BoundingSphere';
import { IBoundsPicker } from './IBoundsPicker';
import { BoundsPickerEvent } from '../events/BoundsPickerEvent';
import { PickEntity } from '../base/PickEntity';
import { EntityNode } from '../partition/EntityNode';
import { ContainerNode } from '../partition/ContainerNode';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset
 * of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable
 * objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export class BoundsPicker extends AbstractionBase implements IPartitionTraverser, IBoundsPicker {
	private static tmpMatrix: Matrix3D = new Matrix3D();
	private static tmpPoint: Point = new Point();
	private static tmpBox: Box = new Box();

	public static MINIMAL_SCALE = 0.00001;

	protected _partition: PartitionBase;
	protected _node: ContainerNode;

	private _boundingVolumePools: Partial<Record<BoundingVolumeType, BoundingVolumePool>> = {};

	private _boundingVolumes: BoundingVolumeBase[] = [];

	public get partition(): PartitionBase {
		return this._partition;
	}

	/**
     *
     * @returns {IPartitionEntity}
     */
	public get node(): ContainerNode {
		return this._node;
	}

	private readonly _pickGroup: PickGroup;

	private readonly _boundsPickers: IBoundsPicker[] = [];

	/**
	 * Indicates the width of the display object, in pixels. The width is
	 * calculated based on the bounds of the content of the display object. When
	 * you set the <code>width</code> property, the <code>scaleX</code> property
	 * is adjusted accordingly, as shown in the following code:
	 *
	 * <p>Except for TextField and Video objects, a display object with no
	 * content(such as an empty sprite) has a width of 0, even if you try to set
	 * <code>width</code> to a different value.</p>
	 */
	public get width(): number {
		const box: Box = this.getBoxBounds();

		if (box == null)
			return 0;

		// scale already should be applied, because we request width relative self
		return box.width;
	}

	public set width(val: number) {
		const transform = this._node.container.transform;
		const selfBox = this.getBoxBounds();

		//return if box is empty ie setting width for no content is impossible
		if (selfBox == null)
			return;

		const rotation = transform.rotation;
		const baseMatrix = transform.matrix3D;

		const box = baseMatrix.transformBox(selfBox, BoundsPicker.tmpBox);

		const scaleFactor = box.width > 0 ? val / box.width : 1;

		// without rotation, fast case
		if (rotation.z === 0) {
			const s = transform.scale;
			transform.scaleTo(
				s.x * scaleFactor || BoundsPicker.MINIMAL_SCALE,
				s.y,
				s.z
			);

			return;
		}

		const matrix = BoundsPicker.tmpMatrix;

		matrix.copyFrom(baseMatrix);
		matrix.appendScale(
			scaleFactor || BoundsPicker.MINIMAL_SCALE,
			1,
			1
		);

		// decompose matrix for grabbing transformed scale of transform
		// this is target scale that applied (real?) by width
		const realScale = matrix.decompose()[3];

		transform.scaleTo(
			realScale.x,
			realScale.y,
			realScale.z
		);
	}

	/**
	 * Indicates the height of the display object, in pixels. The height is
	 * calculated based on the bounds of the content of the display object. When
	 * you set the <code>height</code> property, the <code>scaleY</code> property
	 * is adjusted accordingly, as shown in the following code:
	 *
	 * <p>Except for TextField and Video objects, a display object with no
	 * content (such as an empty sprite) has a height of 0, even if you try to
	 * set <code>height</code> to a different value.</p>
	 */
	public get height(): number {
		const box: Box = this.getBoxBounds();

		if (box == null)
			return 0;

		// if (this._node._registrationMatrix3D)
		// 	return box.height*this._node.scaleY*this._node._registrationMatrix3D._rawData[5];

		// already should be applied
		return box.height;// * this._node.container.transform.scale.y;
	}

	public set height(val: number) {
		const transform = this._node.container.transform;
		const selfBox = this.getBoxBounds();

		//return if box is empty ie setting height for no content is impossible
		if (selfBox == null)
			return;

		const baseMatrix = transform.matrix3D;
		const rotation = transform.rotation;

		const box = baseMatrix.transformBox(selfBox, BoundsPicker.tmpBox);

		const scaleFactor = box.height > 0 ? val / box.height : 1;

		// without rotation, fast case
		if (rotation.z === 0) {
			const s = transform.scale;
			transform.scaleTo(
				s.x,
				s.y * scaleFactor || BoundsPicker.MINIMAL_SCALE,
				s.z
			);

			return;
		}

		// or we should use decomposition
		const matrix = BoundsPicker.tmpMatrix;

		matrix.copyFrom(baseMatrix);
		matrix.appendScale(
			1,
			scaleFactor || BoundsPicker.MINIMAL_SCALE,
			1
		);

		const realScale = matrix.decompose()[3];

		transform.scaleTo(
			realScale.x,
			realScale.y,
			realScale.z
		);
	}

	/**
	 * Indicates the depth of the display object, in pixels. The depth is
	 * calculated based on the bounds of the content of the display object. When
	 * you set the <code>depth</code> property, the <code>scaleZ</code> property
	 * is adjusted accordingly, as shown in the following code:
	 *
	 * <p>Except for TextField and Video objects, a display object with no
	 * content (such as an empty sprite) has a depth of 0, even if you try to
	 * set <code>depth</code> to a different value.</p>
	 */
	public get depth(): number {
		const box: Box = this.getBoxBounds();

		if (box == null)
			return 0;

		// if (this._node._registrationMatrix3D)
		// 	return  box.depth*this._node.scaleZ*this._node._registrationMatrix3D._rawData[10];

		return box.depth * this._node.container.transform.scale.z;
	}

	public set depth(val: number) {
		const box: Box = this.getBoxBounds();

		//return if box is empty ie setting depth for no content is impossible
		if (box == null || box.depth == 0)
			return;

		//this._updateAbsoluteDimension();

		this._node.container.transform.scaleTo(
			this._node.container.transform.scale.x,
			this._node.container.transform.scale.y,
			val / box.depth
		);
	}

	constructor(partition: PartitionBase, pool: BoundsPickerPool) {
		super(partition, pool);

		this._pickGroup = pool.pickGroup;
		this._partition = partition;
		this._node = partition.rootNode;
	}

	public onInvalidate(event: AssetEvent): void {
		super.onInvalidate(event);

		this.dispatchEvent(new BoundsPickerEvent(BoundsPickerEvent.INVALIDATE_BOUNDS, this));
	}

	public traverse(): void {
		this._invalid = false;
		this._boundsPickers.length = 0;
		this._partition.traverse(this);

	}

	public getTraverser(partition: PartitionBase): IPartitionTraverser {
		const traverser: BoundsPicker = this._pickGroup.getBoundsPicker(partition);

		this._boundsPickers.push(traverser);

		return traverser;
	}

	/**
	 * Returns true if the current node is at least partly in the frustum.
	 * If so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	public enterNode(node: INode): boolean {
		return true;
	}

	public getBoundingVolume(target: ContainerNode = null, type: BoundingVolumeType = null): BoundingVolumeBase {
		if (target == null)
			target = this._node;

		if (type == null)
			type = this._node.container.defaultBoundingVolume;

		const pool: BoundingVolumePool = this._boundingVolumePools[type]
									|| (this._boundingVolumePools[type] = new BoundingVolumePool(this, type));

		return <BoundingVolumeBase> target.getAbstraction(pool);
	}

	public getBoxBounds(
		targetCoordinateSpace: ContainerNode = null, strokeFlag: boolean = false, fastFlag: boolean = false): Box {

		return (<BoundingBox> this.getBoundingVolume(
			targetCoordinateSpace,
			strokeFlag
				? (fastFlag ? BoundingVolumeType.BOX_BOUNDS_FAST : BoundingVolumeType.BOX_BOUNDS)
				: (fastFlag ? BoundingVolumeType.BOX_FAST : BoundingVolumeType.BOX))
		).getBox();
	}

	public getSphereBounds(
		targetCoordinateSpace: ContainerNode = null, strokeFlag: boolean = false, fastFlag: boolean = false): Sphere {

		return (<BoundingSphere> this.getBoundingVolume(
			targetCoordinateSpace,
			strokeFlag
				? (fastFlag ? BoundingVolumeType.SPHERE_BOUNDS_FAST : BoundingVolumeType.SPHERE_BOUNDS)
				: (fastFlag ? BoundingVolumeType.SPHERE_FAST : BoundingVolumeType.SPHERE))
		).getSphere();
	}

	public addBoundingVolume(boundingVolume: BoundingVolumeBase): void {
		this._boundingVolumes.push(boundingVolume);
	}

	public removeBoundingVolume(boundingVolume: BoundingVolumeBase): void {
		this._boundingVolumes.splice(this._boundingVolumes.indexOf(boundingVolume), 1);
	}

	public hitTestPoint(x: number, y: number, shapeFlag: boolean = false): boolean {
		return this._hitTestPointInternal(this._node, x, y, shapeFlag, false);
	}

	public _hitTestPointInternal(
		rootEntity: ContainerNode,
		x: number, y: number,
		shapeFlag: boolean = false,
		maskFlag: boolean = false
	): boolean {

		if (this._node.getMaskId() != -1 && (!maskFlag || !shapeFlag))//allow masks for bounds hit tests
			return false;

		if (this._invalid)
			this.traverse();

		//set local tempPoint for later reference
		const tempPoint: Point = BoundsPicker.tmpPoint;
		tempPoint.setTo(x, y);

		this._node.globalToLocal(tempPoint, tempPoint);

		//early out for box test
		const box: Box = this.getBoxBounds(null, false, true);

		if (box == null || !box.contains(tempPoint.x, tempPoint.y, 0))
			return false;

		//early out for non-shape tests
		if (!shapeFlag ||
			this._node.container.assetType == '[asset TextField]' ||
			this._node.container.assetType == '[asset Billboard]'
		)
			return true;

		const numPickers: number = this._boundsPickers.length;
		if (numPickers)
			for (let i: number = 0; i < numPickers; ++i)
				if (this._boundsPickers[i]._hitTestPointInternal(rootEntity, x, y, shapeFlag, maskFlag))
					return true;

		return false;
	}

	/**
	 * Evaluates the bounding box of the display object to see if it overlaps or
	 * intersects with the bounding box of the <code>obj</code> display object.
	 *
	 * @param obj The display object to test against.
	 * @return <code>true</code> if the bounding boxes of the display objects
	 *         intersect; <code>false</code> if not.
	 */
	public hitTestObject(obj: BoundsPicker): boolean {
		//TODO: getBoxBounds should be using the root partition root

		//first do a fast box comparision
		const objBox: Box = obj.getBoxBounds(this._node, true, true);

		if (objBox == null)
			return false;

		const box: Box = this.getBoxBounds(this._node, true, true);

		if (box == null)
			return false;

		if (!objBox.intersects(box))
			return false;

		//if the fast box passes, do the slow test
		return obj.getBoxBounds(this._node, true).intersects(this.getBoxBounds(this._node, true));
	}

	public _getBoxBoundsInternal(
		matrix3D: Matrix3D = null,
		strokeFlag: boolean = true,
		fastFlag: boolean = true,
		cache: Box = null,
		target: Box = null
	): Box {

		if (this._invalid)
			this.traverse();

		const numPickers: number = this._boundsPickers.length;
		if (numPickers > 0) {
			const m: Matrix3D = new Matrix3D();
			for (let i: number = 0; i < numPickers; ++i) {
				if (this._boundsPickers[i].node != this._node) {
					if (matrix3D)
						m.copyFrom(matrix3D);
					else
						m.identity();

					m.prepend(this._boundsPickers[i].node.container.transform.matrix3D);
					if (this._boundsPickers[i].node.container._registrationMatrix3D)
						m.prepend(this._boundsPickers[i].node.container._registrationMatrix3D);

					target = this._boundsPickers[i]._getBoxBoundsInternal(m, strokeFlag, fastFlag, cache, target);
				} else {
					target = this._boundsPickers[i]._getBoxBoundsInternal(matrix3D, strokeFlag, fastFlag, cache, target);
				}
			}
		}

		return target;
	}

	public _getSphereBoundsInternal(
		center: Vector3D = null,
		matrix3D: Matrix3D = null,
		strokeFlag: boolean = true,
		fastFlag: boolean = true,
		cache: Sphere = null,
		target: Sphere = null
	): Sphere {

		if (this._invalid)
			this.traverse();

		const box: Box = this._getBoxBoundsInternal(matrix3D, strokeFlag, fastFlag);

		if (box == null)
			return;

		if (!center) {
			center = new Vector3D();
			center.x = box.x + box.width / 2;
			center.y = box.y + box.height / 2;
			center.z = box.z + box.depth / 2;
		}

		const numPickers: number = this._boundsPickers.length;
		if (numPickers > 0) {
			const m: Matrix3D = new Matrix3D();
			for (let i: number = 0; i < numPickers; ++i) {
				if (this._boundsPickers[i].node != this._node) {
					if (matrix3D)
						m.copyFrom(matrix3D);
					else
						m.identity();

					m.prepend(this._boundsPickers[i].node.container.transform.matrix3D);
					if (this._boundsPickers[i].node.container._registrationMatrix3D)
						m.prepend(this._boundsPickers[i].node.container._registrationMatrix3D);

					target = this._boundsPickers[i]._getSphereBoundsInternal(center, m, strokeFlag, fastFlag, cache, target);
				} else {
					target = this._boundsPickers[i]._getSphereBoundsInternal(center, matrix3D, strokeFlag, fastFlag, cache, target);
				}
			}
		}

		return target;
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */

	public isInFrustum(planes: Array<Plane3D>, numPlanes: number): boolean {
		return this._isInFrustumInternal(this._node, planes, numPlanes);
	}

	public _isInFrustumInternal(rootEntity: ContainerNode, planes: Array<Plane3D>, numPlanes: number): boolean {
		return this.getBoundingVolume(rootEntity).isInFrustum(planes, numPlanes);
	}

	public onClear(event: AssetEvent): void {
		super.onClear(event);

		for (let i: number = this._boundingVolumes.length  - 1; i >= 0; i--)
			this._boundingVolumes[i].onClear(event);

		for (const key in this._boundingVolumePools) {
			this._boundingVolumePools[key].dispose();
			delete this._boundingVolumePools[key];
		}
	}

	public dispose(): void {
		//TODO
	}

	/**
	 *
	 * @param entity
	 */
	public applyEntity(entity: EntityNode): void {
		this._boundsPickers.push(entity.getAbstraction<PickEntity>(this._pickGroup));
	}
}