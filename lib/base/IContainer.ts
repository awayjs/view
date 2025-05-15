import { IAsset, Matrix3D, Rectangle, Transform } from '@awayjs/core';
import { BlendMode } from '@awayjs/stage';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { ContainerNode } from '../partition/ContainerNode';
import { BoundsPicker } from '../pick/BoundsPicker';
import { AlignmentMode } from './AlignmentMode';
import { IEntity } from './IEntity';
import { OrientationMode } from './OrientationMode';

export interface IContainer extends IAsset
{
	pickObjectFromTimeline: boolean;

	zOffset: number;

	getBoundsPrimitive(picker: BoundsPicker): IContainer;

	getScrollRectPrimitive(): IContainer;

	castsShadows: boolean;

	mouseEnabled: boolean;

	boundsVisible: boolean;

	transform: Transform;

	_registrationMatrix3D: Matrix3D;

	readonly maskId: number;

	readonly filters: Array<any>;

	cacheAsBitmap: boolean;

	scale9Grid: Rectangle;

	getEntity(): IEntity;

	getMouseCursor(): string;

	tabEnabled: boolean;

	isAVMScene: boolean;

	setFocus(value: boolean, fromMouseDown?: boolean, sendSoftKeyEvent?: boolean);

	maskMode: boolean;

	masks: Array<IContainer>;

	blendMode: BlendMode;

	alignmentMode: AlignmentMode;

	orientationMode: OrientationMode;

	scrollRect: Rectangle;

	/**
	 *
	 */
	defaultBoundingVolume: BoundingVolumeType;

	pickObject: IContainer;

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