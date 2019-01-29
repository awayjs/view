import { IPartitionEntity } from './IPartitionEntity';


export interface ITabEntity extends IPartitionEntity
{
	tabEnabled:boolean;

	tabIndex:number;
}