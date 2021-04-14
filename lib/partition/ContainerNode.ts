import {
	Plane3D,
	Vector3D,
	IAbstractionPool,
	IAbstractionClass,
	AbstractionBase,
	AssetEvent,
	Matrix3D,
	ColorTransform,
	Point,
	Transform,
	Rectangle,
	Box,
} from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { INode } from './INode';
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';
import { HierarchicalProperty } from '../base/HierarchicalProperty';
import { EntityNode } from './EntityNode';
import { HeirarchicalEvent } from '../events/HeirarchicalEvent';
import { IPartitionContainer } from '../base/IPartitionContainer';
import { ContainerEvent } from '../events/ContainerEvent';
import { BlendMode } from '@awayjs/stage';
import { AlignmentMode } from '../base/AlignmentMode';
import { OrientationMode } from '../base/OrientationMode';
import { IPartitionClass } from './IPartitionClass';
import { BasicPartition } from './BasicPartition';
import { ContainerNodeEvent } from '../events/ContainerNodeEvent';

export class NodePool implements IAbstractionPool {
	public static getRootNode(entity: IPartitionContainer, partitionClass: IPartitionClass): ContainerNode {

		return entity.getAbstraction<ContainerNode>(new NodePool(entity, partitionClass));
	}

	readonly id: number;
	readonly partitionClass: IPartitionClass;

	constructor(entity: IPartitionEntity, partitionClass: IPartitionClass) {
		this.id = entity.id;
		this.partitionClass = partitionClass;
	}

	public getNode(entity: IPartitionEntity): ContainerNode {
		return entity.getAbstraction<ContainerNode>(this);
	}

	public requestAbstraction(_asset: IPartitionEntity): IAbstractionClass {
		return ContainerNode;
	}
}

/**
 * @class away.partition.ContainerNode
 */
export class ContainerNode extends AbstractionBase {

	private static _nullTransform: Transform = new Transform();

	private _invalidateMatrix3DEvent: ContainerNodeEvent;
	private _onHierarchicalInvalidate: (event: HeirarchicalEvent) => void;
	private _onAddChildAt: (event: ContainerEvent) => void;
	private _onRemoveChildAt: (event: ContainerEvent) => void;
	private _onEntityInvalidate: (event: ContainerEvent) => void;
	private _onEntityClear: (event: ContainerEvent) => void;

	private _entityNode: EntityNode;
	private _partitionClass: IPartitionClass;
	private _pickObject: IPartitionEntity;
	private _pickObjectNode: ContainerNode;
	private _scrollRect: Rectangle;
	private _scrollRectNode: ContainerNode;
	private _renderToImage: boolean;
	private _isDragEntity: boolean;

	private _position: Vector3D = new Vector3D();
	private _positionDirty: boolean;
	private _matrix3D: Matrix3D = new Matrix3D();
	private _colorTransform: ColorTransform;
	private _inverseMatrix3D: Matrix3D;
	private _inverseMatrix3DDirty: boolean = true;
	private _orientationMatrix: Matrix3D = new Matrix3D();
	private _tempVector3D: Vector3D = new Vector3D();
	private _transformDisabled: boolean = false;
	private _activeTransform: Transform;

	private _invisible: boolean;
	private _maskId: number = -1;
	private _mouseChildrenDisabled: boolean;
	private _maskOwners: ContainerNode[];
	private _masks: ContainerNode[] = [];

	protected _partition: PartitionBase;
	protected _parent: ContainerNode;
	protected _childPool: NodePool;
	protected _childNodes: Array<ContainerNode> = new Array<ContainerNode>();
	protected _numChildNodes: number = 0;
	protected _debugEntity: IPartitionEntity;

	public _hierarchicalPropsDirty: HierarchicalProperty = HierarchicalProperty.ALL;
	public _collectionMark: number;// = 0;

	public get parent(): ContainerNode {
		return this._parent;
	}

	public readonly container: IPartitionContainer;

	public get partition(): PartitionBase {
		if (!this._partition || this._partitionClass != this.container.partitionClass) {
			this._partitionClass = this.container.partitionClass;

			if (this.parent === this) {
				throw ('Self REF!!!');
			}

			this._partition = this.container.partitionClass
				? new this.container.partitionClass(this)
				: this._parent?.partition
				|| new (<NodePool> this._pool).partitionClass(this);
		}

		return this._partition;
	}

	public get pickObjectNode(): ContainerNode {
		if (this._pickObject != this.container.pickObject) {
			this._pickObject = this.container.pickObject;

			if (this._pickObject) {
				this._pickObject.partitionClass = BasicPartition;
				this._pickObjectNode = this._pickObject.getAbstraction<ContainerNode>(this._pool);

				if (this._pickObject.pickObjectFromTimeline)
					this._pickObjectNode.setParent(this);

			} else {
				this._pickObjectNode.setParent(null);
				this._pickObjectNode = null;
			}
		}

		return this._pickObjectNode;
	}

	public get renderToImage(): boolean {
		const renderToImage: boolean =
			this.container.cacheAsBitmap ||
			!!this.container.scale9Grid ||
			!!this.container.filters;

		if (this._renderToImage !== renderToImage) {
			this._renderToImage = renderToImage;

			if (!this._renderToImage)
				this.partition.clearLocalNode();
		}

		return this._renderToImage;
	}

	public get boundsVisible(): boolean {
		return false;
	}

	public get pool(): NodePool {
		return <NodePool> this._pool;
	}

	public set transformDisabled(value: boolean) {
		if (this._transformDisabled == value)
			return;

		this._transformDisabled = value;

		if (this._transformDisabled) {
			this._activeTransform = ContainerNode._nullTransform;
		} else {
			this._activeTransform = this.container.transform;
		}
	}

	public get transformDisabled(): boolean {
		return this._transformDisabled;
	}

	/**
	 *
	 */
	public getPosition(): Vector3D {
		if (this._positionDirty) {
			if (this.container._registrationMatrix3D &&
				this.container.alignmentMode === AlignmentMode.REGISTRATION_POINT
			) {
				this._position.x = -this.container._registrationMatrix3D._rawData[12];
				this._position.y = -this.container._registrationMatrix3D._rawData[13];
				this._position.z = -this.container._registrationMatrix3D._rawData[14];
				this._position = this.getMatrix3D().transformVector(
					this._position,
					this._position);
				/*
				this._position.decrementBy(
					new Vector3D(
						this._registrationPoint.x*this._scaleX,
						this._registrationPoint.y*this._scaleY,
						this._registrationPoint.z*this._scaleZ));
				*/
			} else {
				this.getMatrix3D().copyColumnTo(3, this._position);
			}

			this._positionDirty = false;
		}

		return this._position;
	}

	/**
	 *
	 */
	public getInverseMatrix3D(): Matrix3D {
		if (this._inverseMatrix3DDirty) {
			if (!this._inverseMatrix3D)
				this._inverseMatrix3D = new Matrix3D();

			this._inverseMatrix3DDirty = false;
			this._inverseMatrix3D.copyFrom(this.getMatrix3D());
			this._inverseMatrix3D.invert();
		}

		return this._inverseMatrix3D || (this._inverseMatrix3D = new Matrix3D());
	}

	public getMatrix3D(): Matrix3D {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.SCENE_TRANSFORM) {
			this._matrix3D.copyFrom(this._activeTransform.matrix3D);

			if (this.container._registrationMatrix3D) {

				this._matrix3D.prepend(this.container._registrationMatrix3D);

				if (this.container.alignmentMode != AlignmentMode.REGISTRATION_POINT) {
					this._matrix3D.appendTranslation(
						-this.container._registrationMatrix3D._rawData[12] * this._activeTransform.scale.x,
						-this.container._registrationMatrix3D._rawData[13] * this._activeTransform.scale.y,
						-this.container._registrationMatrix3D._rawData[14] * this._activeTransform.scale.z);
				}
			}

			if (this._parent)
				this._matrix3D.append(this._parent.getMatrix3D());

			// scrollRect-masks are childs of the object that have the scrollRect applied
			// to support scrolling we need to:
			// 		- move objects with scrollRect by negative scrollRect position
			// 		- move scrollRect-masks by positive scrollRect position

			if (!this.container.maskMode && this.container.scrollRect)
				this._matrix3D.prependTranslation(-this.container.scrollRect.x, -this.container.scrollRect.y, 0);
			else if (this.container.maskMode && this.container.scrollRect)
				this._matrix3D.prependTranslation(this.container.scrollRect.x, this.container.scrollRect.y, 0);

			this._hierarchicalPropsDirty ^= HierarchicalProperty.SCENE_TRANSFORM;

			//TODO: refactor controller API
			if (this.container['_iController'])
				this.container['_iController'].updateController();
		}

		return this._matrix3D;
	}

	/**
	 *
	 */
	public getRenderMatrix3D(cameraTransform: Matrix3D): Matrix3D {

		if (this.container.orientationMode == OrientationMode.CAMERA_PLANE) {
			const comps: Array<Vector3D> = cameraTransform.decompose();
			comps[0].copyFrom(this.getPosition());
			comps[3].copyFrom(this._activeTransform.scale);
			this._orientationMatrix.recompose(comps);

			//add in case of registration point
			if (this.container._registrationMatrix3D) {
				this._orientationMatrix.prepend(this.container._registrationMatrix3D);

				if (this.container.alignmentMode != AlignmentMode.REGISTRATION_POINT)
					this._orientationMatrix.appendTranslation(
						-this.container._registrationMatrix3D._rawData[12] * this._activeTransform.scale.x,
						-this.container._registrationMatrix3D._rawData[13] * this._activeTransform.scale.y,
						-this.container._registrationMatrix3D._rawData[14] * this._activeTransform.scale.z);
			}

			return this._orientationMatrix;
		}
		return this.getMatrix3D();
	}

	public getColorTransform(): ColorTransform {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.COLOR_TRANSFORM) {
			if (!this._colorTransform)
				this._colorTransform = new ColorTransform();

			if (this._parent && this._parent.getColorTransform()) {
				this._colorTransform.copyFrom(this._parent.getColorTransform());

				this._colorTransform.prepend(this._activeTransform.colorTransform);
			} else {
				this._colorTransform.copyFrom(this._activeTransform.colorTransform);
			}

			if (this.container.blendMode === BlendMode.OVERLAY) {
				// apply 0.5 alpha for object with `overlay` because we not support it now
				this._colorTransform.alphaMultiplier *= 0.5;
			}

			this._hierarchicalPropsDirty ^= HierarchicalProperty.COLOR_TRANSFORM;
		}

		return this._colorTransform || (this._colorTransform = new ColorTransform());
	}

	/**
	 *
	 * @returns {number}
	 */
	public getMaskId(): number {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MASK_ID) {
			this._maskId = (this.container.maskId != -1)
				? this.container.maskId
				: (this._parent)
					? this._parent.getMaskId()
					: -1;

			this._hierarchicalPropsDirty ^= HierarchicalProperty.MASK_ID;
		}

		return this._maskId;
	}

	public getMasks(update: boolean = false): ContainerNode[] {
		if (update) {
			this._masks.length = 0;

			if (this.container.masks)
				for (let i = 0; i < this.container.masks.length; i++)
					this._masks.push((<NodePool> this._pool).getNode(this.container.masks[i]).partition.rootNode);
		}

		return this._masks;
	}

	public getMaskOwners(): ContainerNode[] {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MASKS) {
			const masks = this.getMasks(true);
			this._maskOwners = (this._parent?.getMaskOwners() && this.getMaskId() == -1)
				? masks.length
					? this._parent.getMaskOwners().concat([this])
					: this._parent.getMaskOwners().concat()
				: masks.length
					? [this]
					: null;

			this._hierarchicalPropsDirty ^= HierarchicalProperty.MASKS;
		}

		return this._maskOwners;
	}

	/**
	 * Converts the `point` object from the Stage(global) coordinates to the
	 * display object's(local) coordinates.
	 *
	 * To use this method, first create an instance of the Point class. The _x_
	 * and _y_ values that you assign represent global coordinates because they
	 * relate to the origin(0,0) of the main display area. Then pass the Point
	 * instance as the parameter to the `globalToLocal()` method. The method
	 * returns a new Point object with _x_ and _y_ values that relate to the
	 * origin of the display object instead of the origin of the Stage.
	 *
	 * @param point An object created with the Point class. The Point object
	 *              specifies the _x_ and _y_ coordinates as properties.
	 * @return A Point object with coordinates relative to the display object.
	 */
	public globalToLocal(point: Point, target: Point = null): Point {
		this._tempVector3D.setTo(point.x, point.y, 0);
		const pos: Vector3D = this.getInverseMatrix3D().transformVector(this._tempVector3D, this._tempVector3D);

		if (!target)
			target = new Point();

		target.x = pos.x;
		target.y = pos.y;

		return target;
	}

	/**
	 * Converts a two-dimensional point from the Scene(global) coordinates to a
	 * three-dimensional display object's(local) coordinates.
	 *
	 * <p>To use this method, first create an instance of the Vector3D class. The x,
	 * y and z values that you assign to the Vector3D object represent global
	 * coordinates because they are relative to the origin(0,0,0) of the scene. Then
	 * pass the Vector3D object to the <code>globalToLocal3D()</code> method as the
	 * <code>position</code> parameter.
	 * The method returns three-dimensional coordinates as a Vector3D object
	 * containing <code>x</code>, <code>y</code>, and <code>z</code> values that
	 * are relative to the origin of the three-dimensional display object.</p>
	 *
	 * @param point A Vector3D object representing global x, y and z coordinates in
	 *              the scene.
	 * @return A Vector3D object with coordinates relative to the three-dimensional
	 *         display object.
	 */
	public globalToLocal3D(position: Vector3D): Vector3D {
		return this.getInverseMatrix3D().transformVector(position);
	}

	/**
	 * Converts the `point` object from the display object's(local) coordinates
	 * to the Stage(global) coordinates.
	 *
	 * This method allows you to convert any given _x_ and _y_ coordinates from
	 * values that are relative to the origin(0,0) of a specific display
	 * object(local coordinates) to values that are relative to the origin of
	 * the Stage(global coordinates).
	 *
	 * To use this method, first create an instance of the Point class. The _x_
	 * and _y_ values that you assign represent local coordinates because they
	 * relate to the origin of the display object.
	 *
	 * You then pass the Point instance that you created as the parameter to the
	 * `localToGlobal()` method. The method returns a new Point object with _x_
	 * and _y_ values that relate to the origin of the Stage instead of the
	 * origin of the display object.
	 *
	 * @param point The name or identifier of a point created with the Point
	 *              class, specifying the _x_ and _y_ coordinates as properties.
	 * @return A Point object with coordinates relative to the Stage.
	 */
	public localToGlobal(point: Point, target: Point = null): Point {
		this._tempVector3D.setTo(point.x, point.y, 0);
		const pos: Vector3D = this.getMatrix3D().transformVector(this._tempVector3D, this._tempVector3D);

		if (!target)
			target = new Point();

		target.x = pos.x;
		target.y = pos.y;

		return target;
	}

	public update9Slice(bounds: Rectangle | Box) {
		const source = this.container;
		if (!source.scale9Grid) {
			return;
		}

		// TODO refact this
		// MC can't have graphics with shapes, it is container
		const isValidMC = (source.assetType === '[asset MovieClip]' && this._childNodes.length);
		const target = isValidMC ? this._childNodes[0].container.graphics : source.graphics;

		if (!target) {
			return;
		}

		if (bounds) {
			target.setScale9(source.scale9Grid, bounds);
		}

		target.updateScale9(source.transform.scale.x, source.transform.scale.y);
	}

	public getBoundsPrimitive(_pickGroup: PickGroup): EntityNode {
		return null;
	}

	constructor(container: IPartitionContainer, pool: NodePool) {
		super(container, pool);

		this._onHierarchicalInvalidate
			= (event: HeirarchicalEvent) => this.invalidateHierarchicalProperty(event.property);

		this._onAddChildAt
			= (event: ContainerEvent) => this.addChildAt(event.entity, event.index);

		this._onRemoveChildAt
			= (event: ContainerEvent) => this.removeChildAt(event.index);
		this._onEntityInvalidate
			= (event: ContainerEvent) => this.invalidateEntity(event.entity);
		this._onEntityClear
			= (_event: ContainerEvent) => this.clearEntity();

		this.container = container;
		this.container.addEventListener(HeirarchicalEvent.INVALIDATE_PROPERTY, this._onHierarchicalInvalidate);
		this.container.addEventListener(ContainerEvent.ADD_CHILD_AT, this._onAddChildAt);
		this.container.addEventListener(ContainerEvent.REMOVE_CHILD_AT, this._onRemoveChildAt);
		this.container.addEventListener(ContainerEvent.INVALIDATE_ENTITY, this._onEntityInvalidate);
		this.container.addEventListener(ContainerEvent.CLEAR_ENTITY, this._onEntityClear);

		for (let i: number = 0; i < container.numChildren; ++i)
			this.addChildAt(container.getChildAt(i), this._numChildNodes);

		if (this.container.isEntity())
			this.invalidateEntity(this.container);

		this._hierarchicalPropsDirty = HierarchicalProperty.ALL;

		this._activeTransform = this.container.transform;
	}

	public onClear(event: AssetEvent): void {
		super.onClear(event);

		this.container.removeEventListener(HeirarchicalEvent.INVALIDATE_PROPERTY, this._onHierarchicalInvalidate);
		this.container.removeEventListener(ContainerEvent.ADD_CHILD_AT, this._onAddChildAt);
		this.container.removeEventListener(ContainerEvent.REMOVE_CHILD_AT, this._onRemoveChildAt);
		this.container.removeEventListener(ContainerEvent.INVALIDATE_ENTITY, this._onEntityInvalidate);
		this.container.removeEventListener(ContainerEvent.CLEAR_ENTITY, this._onEntityClear);

		if (this._entityNode)
			this.clearEntity();

		for (let i: number = 0; i < this._numChildNodes; i++)
			this._childNodes[i].onClear(event);

		if (this._pickObject) {
			this._pickObject = null;
			this._pickObjectNode.setParent(null);
			this._pickObjectNode = null;
		}

		this.clear();
	}

	public onInvalidate(event: AssetEvent): void {
		super.onInvalidate(event);

		if (this.partition != this._parent?.partition)
			this._partition.invalidate();

		if (this.container.isEntity())
			this.invalidateEntity(this.container);
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 * @internal
	 */
	public isInFrustum(
		_rootEntity: INode, _planes: Array<Plane3D>, _numPlanes: number, _pickGroup: PickGroup): boolean {

		if (this.isInvisible())
			return false;

		return true;
	}

	/**
	 * @internal
	 */
	public isInvisible(): boolean {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.VISIBLE) {
			this._invisible = this._transformDisabled
				? false
				: !this.container.visible || this.parent?.isInvisible();

			this._hierarchicalPropsDirty ^= HierarchicalProperty.VISIBLE;
		}

		return this._invisible;
	}

	/**
	 *
	 * @param rayPosition
	 * @param rayDirection
	 * @returns {boolean}
	 */
	public isIntersectingRay(
		_rootEntity: INode,
		_rayPosition: Vector3D,
		_rayDirection: Vector3D,
		_pickGroup: PickGroup): boolean {
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable(): boolean {
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow(): boolean {
		return true;
	}

	public dispose(): void {
		this._parent = null;
		this._childNodes = null;
	}

	/**
	 * @param traverser
	 */
	public acceptTraverser(traverser: IPartitionTraverser): void {
		if (this.partition.rootNode == this)
			this.partition.updateEntities();

		this.update9Slice(null);

		//get the sub-traverser for the partition, if different, terminate this traversal
		if (traverser.partition !== this.partition && traverser !== traverser.getTraverser(this.partition))
			return;

		if (!traverser.enterNode(this))
			return;

		if (!this.container.maskMode && this._scrollRect !== this.container.scrollRect) {
			this._scrollRect = this.container.scrollRect;

			if (this._scrollRectNode) {
				this._scrollRectNode.setParent(null);
				this._scrollRectNode = null;
			}

			if (this._scrollRect) {
				this._scrollRectNode = this.container.getScrollRectPrimitive()
					.getAbstraction<ContainerNode>(this._pool);

				this._scrollRectNode.container.scrollRect = this._scrollRect;
				this._scrollRectNode.setParent(this);
			}
		}
		for (let i: number = this._numChildNodes - 1; i >= 0; i--)
			this._childNodes[i].acceptTraverser(traverser);

		if (this._entityNode)
			this._entityNode.acceptTraverser(traverser);
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public addChildAt(entity: IPartitionEntity, index: number): ContainerNode {
		const node = entity.getAbstraction<ContainerNode>(this._pool);

		node.setParent(this);

		if (index == this._numChildNodes)
			this._childNodes.push(node);
		else
			this._childNodes.splice(index, 0, node);

		this._numChildNodes++;

		return node;
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public removeChildAt(index: number): ContainerNode {
		this._numChildNodes--;

		const node: ContainerNode = (index === this._numChildNodes)
			? this._childNodes.pop()
			: this._childNodes.splice(index, 1)[0];

		node.setParent(null);

		return node;
	}

	private invalidateEntity(entity: IPartitionEntity): void {
		if (this._entityNode == null) {
			this._entityNode = entity.getAbstraction<EntityNode>(this.partition);
			this._entityNode.setParent(this);
		}

		this._partition.invalidateEntity(this._entityNode);
	}

	private clearEntity(): void {
		this._partition.clearEntity(this._entityNode);
		this._entityNode.setParent(null);
		this._entityNode = null;
	}

	public startDrag(): void {
		this._isDragEntity = true;
	}

	public stopDrag(): void {
		this._isDragEntity = false;
	}

	public isDragEntity(): boolean {
		return this._isDragEntity;
	}

	public isMouseDisabled(): boolean {
		return !this.container.mouseEnabled || this.parent?.isMouseChildrenDisabled();
	}

	public isMouseChildrenDisabled(): boolean {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MOUSE_ENABLED) {
			this._mouseChildrenDisabled = !this.container.mouseChildren || this.parent?.isMouseChildrenDisabled();

			this._hierarchicalPropsDirty ^= HierarchicalProperty.MOUSE_ENABLED;
		}

		return this._mouseChildrenDisabled;
	}

	public isDescendant(node: ContainerNode): boolean {
		let parent: INode = this;
		while (parent.parent) {
			parent = parent.parent;
			if (parent == node)
				return true;
		}

		return false;
	}

	public isAncestor(node: ContainerNode): boolean {
		return node.isDescendant(this);
	}

	public invalidateHierarchicalProperty(property: HierarchicalProperty): void {
		const propertyDirty: number = (this._hierarchicalPropsDirty ^ property) & property;
		if (!propertyDirty)
			return;

		this._hierarchicalPropsDirty |= propertyDirty;

		for (let i = 0; i < this._childNodes.length; ++i)
			this._childNodes[i].invalidateHierarchicalProperty(property);

		if (this._pickObjectNode)
			this._pickObjectNode.invalidateHierarchicalProperty(property);

		if (propertyDirty & HierarchicalProperty.SCENE_TRANSFORM) {
			this._positionDirty = true;
			this._inverseMatrix3DDirty = true;

			this.dispatchEvent(this._invalidateMatrix3DEvent
				|| (this._invalidateMatrix3DEvent = new ContainerNodeEvent(ContainerNodeEvent.INVALIDATE_MATRIX3D)));

			if (this.container.isEntity())
				this.invalidateEntity(this.container);
		}
	}

	public setParent(parent: ContainerNode): void {

		if (this._parent) {
			if (this._parent.partition !== this.partition)
				this._parent.partition.removeChild(this.partition);

			this.clear();
		}

		this._parent = parent;

		if (this._parent) {
			if (this._parent.partition !== this.partition)
				this._parent.partition.addChild(this.partition);

			if (this.container.isEntity())
				this.invalidateEntity(this.container);
		}

		this.invalidateHierarchicalProperty(HierarchicalProperty.ALL);
	}
}