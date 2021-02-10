import { IAssetClass, IAbstractionPool, AssetBase, AssetEvent, IAbstractionClass, IAsset, AbstractionBase, UUID, AbstractMethodError } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { ContainerNode } from './ContainerNode';
import { EntityNode } from './EntityNode';
import { INode } from './INode';

/**
 * @class away.partition.Partition
 */
export class PartitionBase extends AssetBase implements IAbstractionPool {
	private static _abstractionClassPool: Record<string, IAbstractionClass> = {};

	private _invalid: boolean;
	private _children: Array<PartitionBase> = new Array<PartitionBase>();
	private _updateQueue: Record<number, EntityNode> = {};

	protected _rootNode: ContainerNode;
	protected _parent: PartitionBase;

	public isUpdated: boolean = false;

	public get parent(): PartitionBase {
		return this._parent;
	}

	public get rootNode(): ContainerNode {
		return <ContainerNode> this._rootNode;
	}

	constructor(rootNode: ContainerNode) {
		super();


		this._rootNode = rootNode;

		this._parent = rootNode.parent?.partition;

		if (this._parent)
			this._parent.addChild(this);	
	}

	public addChild(child: PartitionBase): void {
		this._children.push(child);

		// this.updateNode(child.rootNode);
		if (!this._invalid)
			this.invalidate();
	}

	public removeChild(child: PartitionBase): void {

		child.clear();

		this._children.splice(this._children.indexOf(child), 1)[0];

		// this._rootNode.removeNode(child.rootNode);
		if (!this._invalid)
			this.invalidate();
	}

	public traverse(traverser: IPartitionTraverser): void {
		this.isUpdated = this._invalid;
		this._invalid = false;

		this._rootNode.acceptTraverser(traverser);
	}

	public invalidateEntity(entityNode: EntityNode): void {
		if (!this._invalid)
			this.invalidate();

		this._updateQueue[entityNode.id] = entityNode;
	}

	public updateEntity(entityNode: EntityNode): void {
		//TODO: remove reliance on view
		//required for controllers with autoUpdate set to true and queued events
		entityNode.entity._iInternalUpdate();

		this.updateNode(entityNode);
	}

	public updateNode(node: INode): void {
		const targetNode: ContainerNode = this.findParentForNode(node);

		// if (targetNode && node.parent != targetNode) {
		// 	if (node.parent)
		// 		node.parent.removeNode(node);
		// 	targetNode.addNode(node);
		// }
	}

	public clearEntity(entityNode: EntityNode): void {
		if (!this._invalid)
			this.invalidate();

		delete this._updateQueue[entityNode.id];

		// const node: INode = entity.getAbstraction<EntityNode>(this);
		// node.parent.removeNode(node);
	}

	/**
	 *
	 * @param entity
	 * @returns {away.partition.NodeBase}
	 */
	public findParentForNode(node: INode): ContainerNode {
		return this._rootNode;
	}

	public updateEntities(): void {
		for (const key in this._updateQueue)
			this.updateEntity(this._updateQueue[key]);

		//clear updateQueue
		this._updateQueue = {};
	}

	public invalidate(): void {
		this._invalid = true;

		super.invalidate();

		if (this._parent)
			this._parent.invalidate();
	}

	public clear(): void {
		super.clear();

		for (let i = 0; i < this._children.length; i++)
			this._children[i].clear();
	}

	public dispose(): void {
	}

	// public _setScene(scene: IPartitionEntity): void {
	// 	if (this._scene == scene)
	// 		return;

	// 	this._scene = scene;

	// 	const len: number = this._children.length;
	// 	for (let i: number = 0; i < len; ++i)
	// 		this._children[i]._setScene(scene);
	// }

	public requestAbstraction(asset: IAsset): IAbstractionClass {
		return PartitionBase._abstractionClassPool[asset.assetType];
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerAbstraction(abstractionClass: IAbstractionClass, assetClass: IAssetClass): void {
		PartitionBase._abstractionClassPool[assetClass.assetType] = abstractionClass;
	}
}