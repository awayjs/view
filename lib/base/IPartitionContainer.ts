import { IAsset, Matrix3D, Rectangle, Transform } from '@awayjs/core';
import { BlendMode } from '@awayjs/stage';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { ContainerNode } from '../partition/ContainerNode';
import { IPartitionClass } from '../partition/IPartitionClass';
import { BoundsPicker } from '../pick/BoundsPicker';
import { AlignmentMode } from './AlignmentMode';
import { IEntityTraverser } from './IEntityTraverser';
import { IPartitionEntity } from './IPartitionEntity';
import { OrientationMode } from './OrientationMode';

export interface IPartitionContainer extends IAsset
{
	pickObjectFromTimeline: boolean;

	partitionClass: IPartitionClass;

	zOffset: number;

	getBoundsPrimitive(picker: BoundsPicker): IPartitionContainer;

	getScrollRectPrimitive(): IPartitionContainer;

	castsShadows: boolean;

	mouseEnabled: boolean;

	boundsVisible: boolean;

	transform: Transform;

	_registrationMatrix3D: Matrix3D;

	_iInternalUpdate(): void;

	readonly maskId: number;

	readonly filters: Array<any>;

	cacheAsBitmap: boolean;

	scale9Grid: Rectangle;

	getEntity(): IPartitionEntity;

	getMouseCursor(): string;

	tabEnabled: boolean;

	isAVMScene: boolean;

	setFocus(value: boolean, fromMouseDown?: boolean, sendSoftKeyEvent?: boolean);

	maskMode: boolean;

	masks: Array<IPartitionContainer>;

	blendMode: BlendMode;

	alignmentMode: AlignmentMode;

	orientationMode: OrientationMode;

	scrollRect: Rectangle;

	/**
	 *
	 */
	defaultBoundingVolume: BoundingVolumeType;

	pickObject: IPartitionContainer;

	/**
	 * @internal
	 */
	mouseChildren: boolean;

	/**
	 * @internal
	 */
	visible: boolean;

	_initNode(node: ContainerNode);
}