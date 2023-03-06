import { IPartitionContainer } from './IPartitionContainer';

export interface ITabContainer extends IPartitionContainer
{

	tabEnabled: boolean;
	tabIndex: number;
}