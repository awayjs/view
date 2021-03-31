import { Box, Rectangle } from '@awayjs/core';
import { BlendMode } from '@awayjs/stage';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { AlignmentMode } from './AlignmentMode';
import { IEntityTraverser } from './IEntityTraverser';
import { IPartitionEntity } from './IPartitionEntity';
import { OrientationMode } from './OrientationMode';

interface IScale9GridTarget {
	setSlice9Rectangle(slice: Rectangle, bounds: Rectangle | Box): void,
	updateSlice9(scaleX: number, scaleY: number): void;
}

export interface IPartitionContainer extends IPartitionEntity
{
	readonly numChildren: number;

	readonly maskId: number;

	readonly filters: Array<any>;

	readonly graphics?: IScale9GridTarget;

	cacheAsBitmap: boolean;

	scale9Grid: Rectangle;

	getChildAt(index: number): IPartitionEntity;

	isEntity(): boolean;

	getMouseCursor(): string;

	tabEnabled: boolean;

	isAVMScene: boolean;

	setFocus(value: boolean, fromMouseDown?: boolean, sendSoftKeyEvent?: boolean);

	maskMode: boolean;

	masks: Array<IPartitionEntity>;

	blendMode: BlendMode;

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