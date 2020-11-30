import { IAssetClass, IAbstractionPool, AssetBase, AssetEvent, IAbstractionClass, IAsset } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { IContainerNode } from './IContainerNode';
import { IEntityNodeClass } from './IEntityNodeClass';
import { EntityNode } from './EntityNode';
import { INode } from './INode';

/**
 * @class away.partition.Partition
 */
export class PartitionBase extends AssetBase implements IAbstractionPool {
	private static _abstractionClassPool: Object = new Object();

	private _invalid: boolean;
	private _children: Array<PartitionBase> = new Array<PartitionBase>();
	private _updateQueue: Object = {};

	private _scene: IPartitionEntity;
	protected _root: IPartitionEntity;
	protected _rootNode: IContainerNode;
	protected _parent: PartitionBase;

	public isUpdated: boolean = false;

	public get parent(): PartitionBase {
		return this._parent;
	}

	public get root(): IPartitionEntity {
		return this._root;
	}

	public get scene(): IPartitionEntity {
		return this._scene;
	}

	constructor(root: IPartitionEntity, isScene: boolean = false) {
		super();

		this._root = root;
		this._root.addEventListener(AssetEvent.CLEAR, (event: AssetEvent) => this._onRootClear(event));

		if (isScene)
			this._scene = root;
	}

	public addChild(child: PartitionBase): PartitionBase {
		if (child && child.parent)
			child.parent.removeChildInternal(child);

		this._children.push(child);

		child._setParent(this);

		return child;
	}

	public removeChild(child: PartitionBase): PartitionBase {
		this.removeChildInternal(child);

		child._setParent(null);

		return child;
	}

	public removeChildInternal(child: PartitionBase): PartitionBase {
		return this._children.splice(this._children.indexOf(child), 1)[0];
	}

	public getPartition(entity: IPartitionEntity): PartitionBase {
		return null;
	}

	public traverse(traverser: IPartitionTraverser): void {
		this.isUpdated = this._invalid;
		this._invalid = false;

		this._rootNode.acceptTraverser(traverser);
	}

	public invalidateEntity(entity: IPartitionEntity): void {
		if (!this._invalid)
			this.invalidate();

		this._updateQueue[entity.id] = entity;
	}

	public updateEntity(entity: IPartitionEntity): void {
		//TODO: remove reliance on view
		//required for controllers with autoUpdate set to true and queued events
		entity._iInternalUpdate();

		this.updateNode(entity.getAbstraction<EntityNode>(this));
	}

	public updateNode(node: INode): void {
		const targetNode: IContainerNode = this.findParentForNode(node);

		if (targetNode && node.parent != targetNode) {
			if (node.parent)
				node.parent.iRemoveNode(node);
			targetNode.iAddNode(node);
		}
	}

	public clearEntity(entity: IPartitionEntity): void {
		if (!this._invalid)
			this.invalidate();

		delete this._updateQueue[entity.id];

		this.clearNode(entity.getAbstraction<EntityNode>(this));
	}

	public clearNode(node: INode) {
		if (node.parent) {
			node.parent.iRemoveNode(node);
			node.parent = null;
		}
	}

	/**
	 *
	 * @param entity
	 * @returns {away.partition.NodeBase}
	 */
	public findParentForNode(node: INode): IContainerNode {
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

	public dispose(): void {
	}

	public _setParent(parent: PartitionBase): void {
		if (this._parent) {
			this._parent.clearNode(this._rootNode);
			this._parent.invalidate();
		}

		this._parent = parent;

		if (parent) {
			parent.updateNode(this._rootNode);
			parent.invalidate();
		}

		this._setScene(parent ? parent.scene : null);
	}

	public _setScene(scene: IPartitionEntity): void {
		if (this._scene == scene)
			return;

		this._scene = scene;

		const len: number = this._children.length;
		for (let i: number = 0; i < len; ++i)
			this._children[i]._setScene(scene);
	}

	public _onRootClear(event: AssetEvent): void {
		this.clear();
	}

	public requestAbstraction(asset: IAsset): IAbstractionClass {
		return PartitionBase._abstractionClassPool[asset.assetType];
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerAbstraction(entityNodeClass: IEntityNodeClass, assetClass: IAssetClass): void {
		PartitionBase._abstractionClassPool[assetClass.assetType] = entityNodeClass;
	}
}