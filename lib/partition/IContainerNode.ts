import { ColorTransform, Matrix3D, Point, Vector3D } from '@awayjs/core';
import { HierarchicalProperty } from '../base/HierarchicalProperty';
import { IPartitionContainer } from '../base/IPartitionContainer';
import { INode } from './INode';
import { NodePool } from './ContainerNode';

/**
 * IDisplayObjectNode is an interface for the constructable class definition EntityNode that is used to
 * create node objects in the partition pipeline that represent the contents of a Entity
 *
 * @class away.pool.IDisplayObjectNode
 */
export interface ContainerNode extends INode
{
	readonly entity: IPartitionContainer;

	readonly pool: NodePool;

	pickObjectNode: ContainerNode;

	startDrag();

	stopDrag();

	isDragEntity();

	getMatrix3D(): Matrix3D;

	getRenderMatrix3D(cameraTransform: Matrix3D): Matrix3D;

	getMaskOwners(): ContainerNode[];

	getPosition(): Vector3D;

	getMatrix3D(): Matrix3D;

	getInverseMatrix3D(): Matrix3D;

	getColorTransform(): ColorTransform;

	getMasks(): ContainerNode[];

	getMaskOwners(): ContainerNode[];

	isMouseDisabled(): boolean;

	isMouseChildrenDisabled(): boolean;

	isDescendant(node: ContainerNode): boolean;

	isAncestor(node: ContainerNode): boolean;

	addChildAt(node: ContainerNode, index: number);

	removeChildAt(index: number);

	globalToLocal(point: Point, target?: Point): Point;

	globalToLocal3D(position: Vector3D): Vector3D;

	localToGlobal(point: Point, target?: Point): Point;

	invalidateHierarchicalProperty(propertyDirty: HierarchicalProperty): void;
}