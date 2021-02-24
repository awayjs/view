import { Rectangle } from '@awayjs/core';
import { BlendMode } from '@awayjs/stage';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { AlignmentMode } from './AlignmentMode';
import { IEntityTraverser } from './IEntityTraverser';
import { IPartitionEntity } from './IPartitionEntity';
import { OrientationMode } from './OrientationMode';

export interface IPartitionContainer extends IPartitionEntity
{
	readonly numChildren: number;

	readonly maskId: number;

	getChildAt(index: number): IPartitionEntity;

	isEntity(): boolean;

	getMouseCursor(): string;

	tabEnabled: boolean;

	isAVMScene: boolean;

	setFocus(value: boolean, fromMouseDown?: boolean, sendSoftKeyEvent?: boolean);

	maskMode: boolean;

	masks: Array<IPartitionEntity>;

	blendMode: BlendMode;

	inheritColorTransform: boolean;

	alignmentMode: AlignmentMode;

	orientationMode: OrientationMode;

	scrollRect: Rectangle;

	/**
	 *
	 */
	defaultBoundingVolume: BoundingVolumeType;

	pickObject: IPartitionEntity;

	/**
	 * @internal
	 */
	mouseChildren: boolean;

	/**
	 * @internal
	 */
	visible: boolean;

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}