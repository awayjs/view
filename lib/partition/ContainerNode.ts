import {
	Plane3D,
	Vector3D,
	AbstractionBase,
	Matrix3D,
	ColorTransform,
	Point,
	Transform,
	Rectangle,
	PerspectiveProjection,
	CoordinateSystem,
	IAbstractionPool,
} from '@awayjs/core';

import { IPartitionTraverser } from './IPartitionTraverser';
import { INode } from './INode';
import { PickGroup } from '../PickGroup';
import { HierarchicalProperty } from '../base/HierarchicalProperty';
import { IContainer } from '../base/IContainer';
import { BlendMode, Settings as StageSettings, isNativeBlend } from '@awayjs/stage';
import { AlignmentMode } from '../base/AlignmentMode';
import { OrientationMode } from '../base/OrientationMode';
import { ContainerNodeEvent } from '../events/ContainerNodeEvent';
import { View } from '../View';

export class ContainerNode extends AbstractionBase implements INode {

	private static _nullTransform: Transform = new Transform();
	private static _tempVector3D: Vector3D = new Vector3D();
	private static _nullColorTransform = new ColorTransform();

	private _invalidateMatrix3DEvent: ContainerNodeEvent;
	private _invalidateColorTransformEvent: ContainerNodeEvent;

	private _localNode: ContainerNode;
	private _pickObject: IContainer;
	private _pickObjectNode: ContainerNode;
	private _scrollRect: Rectangle;
	private _scrollRectNode: ContainerNode;
	private _renderToImage: boolean = false;
	private _isDragEntity: boolean;

	private _position: Vector3D = new Vector3D();
	private _positionDirty: boolean;
	private _scale9Container: IContainer;
	private _matrix3D: Matrix3D = new Matrix3D();
	private _colorTransform: ColorTransform;
	private _inverseMatrix3D: Matrix3D;
	private _inverseMatrix3DDirty: boolean = true;
	private _orientationMatrix: Matrix3D;
	private _maskDisabled: boolean = false;
	private _colorTransformDisabled: boolean = false;
	private _transformDisabled: boolean = false;
	private _activeTransform: Transform;

	private _invisible: boolean;
	private _maskId: number = -1;
	private _mouseChildrenDisabled: boolean;
	private _maskOwners: ContainerNode[];
	private _masks: ContainerNode[] = [];

	protected _parent: ContainerNode;
	protected _childNodes: Array<ContainerNode> = new Array<ContainerNode>();
	protected _numChildNodes: number = 0;

	public _hierarchicalPropsDirty: HierarchicalProperty = HierarchicalProperty.ALL;
	public _collectionMark: number;// = 0;

	public get parent(): ContainerNode {
		return this._parent;
	}

	public get numChildNodes(): number {
		return this._numChildNodes;
	}

	public get container(): IContainer {
		return <IContainer> this._asset;
	}

	public get pickObjectNode(): ContainerNode {
		if (this._pickObject != (<IContainer> this._asset).pickObject) {
			this._pickObject = (<IContainer> this._asset).pickObject;

			if (this._pickObject) {
				this._pickObjectNode = this._pickObject.getAbstraction<ContainerNode>(<IAbstractionPool> this._pool);

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
		const { blendMode, filters, cacheAsBitmap } = <IContainer> this._asset;

		const renderToImage = this.isRenderable() && (
			cacheAsBitmap ||
			filters && filters.length > 0 ||
			(blendMode && blendMode !== BlendMode.LAYER && blendMode !== BlendMode.NORMAL && (StageSettings.USE_NON_NATIVE_BLEND || isNativeBlend(blendMode)))
		);

		if (this._renderToImage !== renderToImage) {
			this._renderToImage = renderToImage;

			if (!this._renderToImage)
				this.clearLocalNode();
		}

		return this._renderToImage;
	}

	public get boundsVisible(): boolean {
		return false;
	}

	public get view(): View {
		return <View> this._pool;
	}

	/**
	 * Allow disable/enable colorTransform for this node independent of transform, this required for cache phase
	 * @param value
	 */
	public set colorTransformDisabled(value: boolean) {
		this._colorTransformDisabled = value;
	}

	public get colorTransformDisabled() {
		return this._colorTransformDisabled;
	}

	public set maskDisabled(value: boolean) {
		this._maskDisabled = value;
	}

	public get maskDisabled() {
		return this._maskDisabled;
	}

	public set transformDisabled(value: boolean) {
		if (this._transformDisabled == value)
			return;

		this._maskDisabled = value;
		this._transformDisabled = value;
		this._colorTransformDisabled = value;

		if (this._transformDisabled) {
			this._activeTransform = ContainerNode._nullTransform;
		} else {
			this._activeTransform = (<IContainer> this._asset).transform;
		}
	}

	public get transformDisabled(): boolean {
		return this._transformDisabled;
	}

	public getScale9Container(): IContainer {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.SCALE9) {
			this._scale9Container = (<IContainer> this._asset).scale9Grid
				? (<IContainer> this._asset)
				: this._parent?.getScale9Container();

			this._hierarchicalPropsDirty ^= HierarchicalProperty.SCALE9;
		}

		return this._scale9Container;
	}

	/**
	 *
	 */
	public getPosition(): Vector3D {
		if (this._positionDirty) {
			if ((<IContainer> this._asset)._registrationMatrix3D &&
				(<IContainer> this._asset).alignmentMode === AlignmentMode.REGISTRATION_POINT
			) {
				this._position.x = -(<IContainer> this._asset)._registrationMatrix3D._rawData[12];
				this._position.y = -(<IContainer> this._asset)._registrationMatrix3D._rawData[13];
				this._position.z = -(<IContainer> this._asset)._registrationMatrix3D._rawData[14];
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

			if (!this._transformDisabled) {
				if ((<IContainer> this._asset)._registrationMatrix3D) {

					this._matrix3D.prepend((<IContainer> this._asset)._registrationMatrix3D);

					if ((<IContainer> this._asset).alignmentMode != AlignmentMode.REGISTRATION_POINT) {
						this._matrix3D.appendTranslation(
							-(<IContainer> this._asset)._registrationMatrix3D._rawData[12] * this._activeTransform.scale.x,
							-(<IContainer> this._asset)._registrationMatrix3D._rawData[13] * this._activeTransform.scale.y,
							-(<IContainer> this._asset)._registrationMatrix3D._rawData[14] * this._activeTransform.scale.z);
					}
				}

				if (this._parent)
					this._matrix3D.append(this._parent.getMatrix3D());

				// scrollRect-masks are childs of the object that have the scrollRect applied
				// to support scrolling we need to:
				// 		- move objects with scrollRect by negative scrollRect position
				// 		- move scrollRect-masks by positive scrollRect position

				if (!(<IContainer> this._asset).maskMode && (<IContainer> this._asset).scrollRect)
					this._matrix3D.prependTranslation(-(<IContainer> this._asset).scrollRect.x, -(<IContainer> this._asset).scrollRect.y, 0);
				else if ((<IContainer> this._asset).maskMode && (<IContainer> this._asset).scrollRect)
					this._matrix3D.prependTranslation((<IContainer> this._asset).scrollRect.x, (<IContainer> this._asset).scrollRect.y, 0);

			}

			this._hierarchicalPropsDirty ^= HierarchicalProperty.SCENE_TRANSFORM;

			//TODO: refactor controller API
			if ((<IContainer> this._asset)['_iController'])
				(<IContainer> this._asset)['_iController'].updateController();
		}

		return this._matrix3D;
	}

	/**
	 *
	 */
	public getRenderMatrix3D(cameraTransform: Matrix3D): Matrix3D {

		if ((<IContainer> this._asset).orientationMode == OrientationMode.CAMERA_PLANE) {
			const comps: Array<Vector3D> = cameraTransform.decompose();
			comps[0].copyFrom(this.getPosition());
			comps[2].copyFrom(this._activeTransform.scale);

			(this._orientationMatrix || (this._orientationMatrix = new Matrix3D())).recompose(comps);

			//add in case of registration point
			if ((<IContainer> this._asset)._registrationMatrix3D) {
				this._orientationMatrix.prepend((<IContainer> this._asset)._registrationMatrix3D);

				if ((<IContainer> this._asset).alignmentMode != AlignmentMode.REGISTRATION_POINT)
					this._orientationMatrix.appendTranslation(
						-(<IContainer> this._asset)._registrationMatrix3D._rawData[12] * this._activeTransform.scale.x,
						-(<IContainer> this._asset)._registrationMatrix3D._rawData[13] * this._activeTransform.scale.y,
						-(<IContainer> this._asset)._registrationMatrix3D._rawData[14] * this._activeTransform.scale.z);
			}

			return this._orientationMatrix;
		}
		return this.getMatrix3D();
	}

	public getColorTransform(): ColorTransform {
		if (this._colorTransformDisabled) {
			return ContainerNode._nullColorTransform;
		}

		if (this._hierarchicalPropsDirty & HierarchicalProperty.COLOR_TRANSFORM) {
			this._hierarchicalPropsDirty ^= HierarchicalProperty.COLOR_TRANSFORM;

			if (this._colorTransformDisabled) {
				return ContainerNode._nullColorTransform;
			}

			if (!this._colorTransform)
				this._colorTransform = new ColorTransform();

			if (this._parent && this._parent.getColorTransform()) {
				this._colorTransform.copyFrom(this._parent.getColorTransform());
				// we MUST prepend real transform in cached phase, but reset in cached image render phase
				this._colorTransform.prepend((<IContainer> this._asset).transform.colorTransform);
			} else {
				this._colorTransform.copyFrom((<IContainer> this._asset).transform.colorTransform);
			}

			/*
			// if we will use getter - it return empty blend in USE_UNSAFE_BLEND = false
			if ((<any> (<IContainer> this._asset))._blendMode === BlendMode.OVERLAY) {
				// apply 0.5 alpha for object with `overlay` because we not support it now
				this._colorTransform.alphaMultiplier *= 0.5;
			}*/

		}

		return this._colorTransform || ContainerNode._nullColorTransform;
	}

	/**
	 *
	 * @returns {number}
	 */
	public getMaskId(): number {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MASK_ID) {
			this._maskId = ((<IContainer> this._asset).maskId != -1)
				? (<IContainer> this._asset).maskId
				: (this._parent)
					? this._parent.getMaskId()
					: -1;

			this._hierarchicalPropsDirty ^= HierarchicalProperty.MASK_ID;
		}

		return this._maskId;
	}

	public getMasks(update: boolean = false): ContainerNode[] {
		if (!update) {
			return this._masks;
		}

		if ((<IContainer> this._asset).masks) {
			const len = (<IContainer> this._asset).masks.length;
			this._masks.length = len;

			for (let i = 0; i < len; i++) {
				this._masks[i] = (<View> this._pool).getNode((<IContainer> this._asset).masks[i]);
			}
		} else {
			this._masks.length = 0;
		}

		return this._masks;
	}

	public getMaskOwners(): ContainerNode[] {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MASKS) {
			const masks = this.getMasks(true);
			this._maskOwners = this._maskDisabled
				? null
				: (this._parent?.getMaskOwners() && this.getMaskId() == -1)
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
	 */
	public globalToLocal(point: Point, target: Point = null): Point {
		const tmp = ContainerNode._tempVector3D;
		tmp.setTo(point.x, point.y, 0);

		const pos = this.getInverseMatrix3D().transformVector(tmp, tmp);

		if (!target) {
			target = new Point();
		}

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
	 * @param target Result point
	 * @return A Point object with coordinates relative to the Stage.
	 */
	public localToGlobal(point: Point, target: Point = null): Point {
		const tmp = ContainerNode._tempVector3D;
		tmp.setTo(point.x, point.y, 0);

		const pos = this.getMatrix3D().transformVector(tmp, tmp);

		if (!target) {
			target = new Point();
		}

		target.x = pos.x;
		target.y = pos.y;

		return target;
	}

	public getBoundsPrimitive(_pickGroup: PickGroup): ContainerNode {
		return null;
	}

	public init(container: IContainer, pool: View) {
		super.init(container, pool);

		container._initNode(this);

		container._containerNodes[pool.id] = this;

		this._hierarchicalPropsDirty = HierarchicalProperty.ALL;

		this._activeTransform = (<IContainer> this._asset).transform;
	}

	public getLocalNode(): ContainerNode {

		if (!this._localNode) {
			/**
			* projection is not simple object
			* not needed spawn it for every cached partition
			* it has 3 matrices = 100 bytes + Transform,
			* that have 4 matrices + a lot of vectors (16 bytes) = 300 bytes,
			* And this is under heavy extending. 1 projection allocate more that 4kb per instance
			*/
			const projection = new PerspectiveProjection();
			projection.coordinateSystem = CoordinateSystem.LEFT_HANDED;
			projection.originX = -1;
			projection.originY = -1;
			projection.transform = new Transform();
			projection.transform.moveTo(0, 0, -1000);
			projection.transform.lookAt(new Vector3D());

			const view = new View(projection, this.view.stage);
			view.backgroundAlpha = 0;

			this._localNode = view.getNode(<IContainer> this._asset);
			this._localNode.transformDisabled = true;
			this._localNode.setParent(this);
		}

		return this._localNode;
	}

	public clearLocalNode(): void {
		if (this._localNode) {
			this._localNode.onClear();
			this._localNode = null;
		}
	}

	public onClear(): void {

		delete (<IContainer> this._asset)._containerNodes[this.view.id];

		this.clearLocalNode();

		if (this._pickObject) {
			this._pickObject = null;
			this._pickObjectNode.setParent(null);
			this._pickObjectNode = null;
		}

		for (let i: number = 0; i < this._numChildNodes; i++)
			this._childNodes[i].onClear();

		this._childNodes.length = 0;
		this._numChildNodes = 0;

		this._scrollRect = null;
		this._scrollRectNode = null;
		this._renderToImage = false;
		this._isDragEntity = false;
		this._positionDirty = false;
		this._scale9Container = null;
		this._inverseMatrix3DDirty = true;
		this._maskDisabled = false;
		this._colorTransformDisabled = false;
		this._transformDisabled = false;

		this._parent = null;

		super.clear();

		super.onClear();
	}

	public onInvalidate(): void {
		this.invalidate();
	}

	public clear(): void {
		super.clear();

		this._maskOwners = null;
		this._masks.length = 0;

		if (this._localNode)
			this._localNode.clear();

		for (let i: number = 0; i < this._numChildNodes; i++)
			this._childNodes[i].clear();

		if (this._pickObject)
			this._pickObjectNode.clear();
	}

	public isInFrustum(
		_rootEntity: INode,
		_planes: Array<Plane3D>,
		_numPlanes: number,
		_pickGroup: PickGroup
	): boolean {

		return !this.isInvisible();
	}

	public invalidate(): void {
		if (this._invalid)
			return;

		this._invalid = true;

		super.invalidate();

		if (this._parent)
			this._parent.invalidate();
	}

	/**
	 * @internal
	 */
	public isInvisible(): boolean {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.VISIBLE) {
			this._invisible = this._transformDisabled
				? false
				: !(<IContainer> this._asset).visible || this.parent?.isInvisible();

			this._hierarchicalPropsDirty ^= HierarchicalProperty.VISIBLE;
		}

		return this._invisible;
	}

	public isIntersectingRay(
		_rootEntity: INode,
		_rayPosition: Vector3D,
		_rayDirection: Vector3D,
		_pickGroup: PickGroup
	): boolean {
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable(): boolean {
		// if container is invisible - all child nodes automatically invisible to
		return  this.getMaskId() != -1 || !this.isInvisible() && this.getColorTransform()._isRenderable();
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow(): boolean {
		return true;
	}

	/**
	 * @param traverser
	 */
	public acceptTraverser(traverser: IPartitionTraverser): void {
		this._invalid = false;

		//get the sub-traverser for the partition, if different, terminate this traversal
		if (traverser.node != this && traverser !== traverser.getTraverser(this))
			return;

		if (!traverser.enterNode(this))
			return;

		if (!(<IContainer> this._asset).maskMode && this._scrollRect !== (<IContainer> this._asset).scrollRect) {
			this._scrollRect = (<IContainer> this._asset).scrollRect;

			if (this._scrollRectNode) {
				this._scrollRectNode.setParent(null);
				this._scrollRectNode = null;
			}

			if (this._scrollRect) {
				this._scrollRectNode = (<IContainer> this._asset).getScrollRectPrimitive()
					.getAbstraction<ContainerNode>(<IAbstractionPool> this._pool);

				this._scrollRectNode.container.scrollRect = this._scrollRect;
				this._scrollRectNode.setParent(this);
			}
		}

		traverser.applyEntity(this);

		for (let i: number = 0; i < this._numChildNodes; i++)
			this._childNodes[i].acceptTraverser(traverser);
	}

	public addChildAt(entity: IContainer, index: number): ContainerNode {
		const node = entity.getAbstraction<ContainerNode>(<IAbstractionPool> this._pool);

		node.setParent(this);

		if (index == this._numChildNodes)
			this._childNodes.push(node);
		else
			this._childNodes.splice(index, 0, node);

		this._numChildNodes++;

		this.invalidate();

		return node;
	}

	public removeChildAt(index: number): ContainerNode {
		this._numChildNodes--;

		const node: ContainerNode = (index === this._numChildNodes)
			? this._childNodes.pop()
			: this._childNodes.splice(index, 1)[0];

		node.setParent(null);

		this.invalidate();

		return node;
	}

	public getChildAt(index: number): ContainerNode {
		return this._childNodes.length > index ? this._childNodes[index] : null;
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
		return this.isInvisible() || !(<IContainer> this._asset).mouseEnabled || this.parent?.isMouseChildrenDisabled();
	}

	public isMouseChildrenDisabled(): boolean {
		if (this._hierarchicalPropsDirty & HierarchicalProperty.MOUSE_ENABLED) {
			this._mouseChildrenDisabled = !(<IContainer> this._asset).mouseChildren || this.parent?.isMouseChildrenDisabled();

			this._hierarchicalPropsDirty ^= HierarchicalProperty.MOUSE_ENABLED;
		}

		return this._mouseChildrenDisabled;
	}

	public isDescendant(node: INode): boolean {
		let parent: INode = this;
		while (parent.parent) {
			parent = parent.parent;
			if (parent == node)
				return true;
		}

		return false;
	}

	public invalidateHierarchicalProperty(property: HierarchicalProperty): void {
		// property dirty check not working for ColorTransform
		// will emit every change
		// todo Fixme
		if (property & HierarchicalProperty.COLOR_TRANSFORM) {

			// eslint-disable-next-line max-len
			this.dispatchEvent(this._invalidateColorTransformEvent || (this._invalidateColorTransformEvent = new ContainerNodeEvent(ContainerNodeEvent.INVALIDATE_COLOR_TRANSFORM)));
		}

		const propertyDirty: number = (this._hierarchicalPropsDirty ^ property) & property;
		if (!propertyDirty)
			return;

		this._hierarchicalPropsDirty |= propertyDirty;

		for (let i = 0; i < this._childNodes.length; ++i)
			this._childNodes[i].invalidateHierarchicalProperty(property);

		if (this._pickObjectNode)
			this._pickObjectNode.invalidateHierarchicalProperty(property);

		if (this._localNode)
			this._localNode.invalidateHierarchicalProperty(property);

		if (property & HierarchicalProperty.SCENE_TRANSFORM) {
			this._positionDirty = true;
			this._inverseMatrix3DDirty = true;

			this.dispatchEvent(this._invalidateMatrix3DEvent
				|| (this._invalidateMatrix3DEvent = new ContainerNodeEvent(ContainerNodeEvent.INVALIDATE_MATRIX3D)));

			this.invalidate();
		}
	}

	public setParent(parent: ContainerNode): void {

		if (this._parent)
			this.clear();

		this._parent = parent;

		this.invalidateHierarchicalProperty(HierarchicalProperty.ALL);
	}
}