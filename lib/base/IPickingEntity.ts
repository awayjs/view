import { IPartitionEntity } from './IPartitionEntity';

export interface IPickingEntity extends IPartitionEntity
{
	isAVMScene:boolean;

	getMouseCursor():string;

	tabEnabled:boolean;

	_startDrag(): void;

	_stopDrag(): void;

	isDragEntity(): boolean;

	setFocus(value: boolean, fromMouseDown?: boolean, sendSoftKeyEvent?: boolean);
}