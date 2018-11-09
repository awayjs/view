import {Vector3D, getTimer} from "@awayjs/core";

import {Camera, Scene, CameraEvent} from "@awayjs/scene";

import {DefaultRenderer, RendererBase, IEntity, TouchPoint, IView, PickingCollision, BasicPartition, PartitionBase, IPicker, RaycastPicker, PickGroup} from "@awayjs/renderer";

import {MouseManager} from "./managers/MouseManager";
import { Viewport } from '@awayjs/stage';


export class View implements IView
{

	/*
	 *************************************************************************************************************************
	 * Development Notes
	 *************************************************************************************************************************
	 *
	 * ShareContext     - this is not being used at the moment integration with other frameworks is not yet implemented or tested
	 *                    and ( _localPos / _globalPos ) position of viewport are the same for the moment
	 *
	 * Background
	 *                  - this is currently not being included in our tests and is currently disabled
	 *
	 ******************clear********************************************************************************************************
	 */

	private _scene:Scene;
	private _camera:Camera;
	private _partition:PartitionBase;
	private _renderer:RendererBase;

	private _time:number = 0;
	private _deltaTime:number = 0;

	private _onProjectionChangedDelegate:(event:CameraEvent) => void;
	private _mouseManager:MouseManager;
	private _mousePicker:RaycastPicker;

	public _mouseX:number;
	public _mouseY:number;
	public _touchPoints:Array<TouchPoint> = new Array<TouchPoint>();

	/*
	 ***********************************************************************
	 * Disabled / Not yet implemented
	 ***********************************************************************
	 *
	 * private _background:away.textures.Texture2DBase;
	 *
	 * public _pTouch3DManager:away.managers.Touch3DManager;
	 *
	 */
	constructor(renderer:RendererBase = null, scene:Scene = null, camera:Camera = null)
	{
		this._onProjectionChangedDelegate = (event:CameraEvent) => this._onProjectionChanged(event);

		this.camera = camera || new Camera();
		this.renderer = renderer || new DefaultRenderer(new BasicPartition(scene || new Scene()));

		this._mousePicker = new RaycastPicker(this._partition, PickGroup.getInstance(this.renderer.viewport));
		this._mouseManager = MouseManager.getInstance(this._renderer.pickGroup);
		this._mouseManager.registerContainer(this._renderer.stage.container);
		this._mouseManager.registerView(this);

//			if (this._shareContext)
//				this._mouse3DManager.addViewLayer(this);
	}

	public layeredView:boolean; //TODO: something to enable this correctly

	public disableMouseEvents:boolean; //TODO: hack to ignore mouseevents on certain views
	
	public get mouseX():number
	{
		return this._mouseX;
	}

	public get mouseY():number
	{
		return this._mouseY;
	}

	public get touchPoints():Array<TouchPoint>
	{
		return this._touchPoints;
	}

	public getLocalMouseX(entity:IEntity):number
	{
		return entity.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._mouseX, this._mouseY, 1000)).x;
	}

	public getLocalMouseY(entity:IEntity):number
	{
		return entity.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._mouseX, this._mouseY, 1000)).y;
	}

	public getLocalTouchPoints(entity:IEntity):Array<TouchPoint>
	{
		var localPosition:Vector3D;
		var localTouchPoints:Array<TouchPoint> = new Array<TouchPoint>();

		var len:number = this._touchPoints.length;
		for (var i:number = 0; i < len; i++) {
			localPosition = entity.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._touchPoints[i].x, this._touchPoints[i].y, 1000));
			localTouchPoints.push(new TouchPoint(localPosition.x, localPosition.y, this._touchPoints[i].id));
		}

		return localTouchPoints;
	}

	/**
	 *
	 */
	public get renderer():RendererBase
	{
		return this._renderer;
	}

	public set renderer(value:RendererBase)
	{
		if (this._renderer == value)
			return;

		if (this._renderer) {
			this._mouseManager.unregisterContainer(this._renderer.stage.container);
			this._renderer.dispose();
		}

		this._renderer = value;

		this._partition = this._renderer.partition;

		this._scene = <Scene> this._partition.root;
		this._scene.partition = this._partition;

		if (this._mouseManager)
			this._mouseManager.registerContainer(this._renderer.stage.container);

		this._mousePicker = new RaycastPicker(this._partition, new PickGroup(this.renderer.viewport));

		if (this._camera) {
			this._renderer.viewport.projection = this._camera.projection;
			this._renderer.partition.invalidateEntity(this._camera);
			this._camera.partition = this._renderer.partition;
		}
	}

	
	/**
	 *
	 */
	public get backgroundColor():number
	{
		return this._renderer.viewport.backgroundColor;
	}

	public set backgroundColor(value:number)
	{
		this._renderer.viewport.backgroundColor = value;
	}

	/**
	 *
	 * @returns {number}
	 */
	public get backgroundAlpha():number
	{
		return this._renderer.viewport.backgroundAlpha;
	}

	/**
	 *
	 * @param value
	 */
	public set backgroundAlpha(value:number)
	{
		this._renderer.viewport.backgroundAlpha = value;
	}

	/**
	 *
	 * @returns {Camera3D}
	 */
	public get camera():Camera
	{
		return this._camera;
	}

	/**
	 * Set camera that's used to render the scene for this viewport
	 */
	public set camera(value:Camera)
	{
		if (this._camera == value)
			return;

		if (this._camera)
			this._camera.removeEventListener(CameraEvent.PROJECTION_CHANGED, this._onProjectionChangedDelegate);

		this._camera = value;

		this._camera.addEventListener(CameraEvent.PROJECTION_CHANGED, this._onProjectionChangedDelegate);

		if (this._renderer) {
			this._renderer.viewport.projection = this._camera.projection;
			this._renderer.partition.invalidateEntity(this._camera);
			this._camera.partition = this._renderer.partition;
		}
	}

	/**
	 *
	 * @returns {away.containers.Scene3D}
	 */
	public get scene():Scene
	{
		return this._scene;
	}

	/**
	 * Set the scene that's used to render for this viewport
	 */
	public set scene(value:Scene)
	{
		if (this._scene == value)
			return;

		this.renderer = new DefaultRenderer(new BasicPartition(value));
	}

	/**
	 *
	 * @returns {number}
	 */
	public get deltaTime():number
	{
		return this._deltaTime;
	}

	/**
	 *
	 */
	public get width():number
	{
		return this._renderer.viewport.width;
	}

	public set width(value:number)
	{
		this._renderer.viewport.width = value;
	}

	/**
	 *
	 */
	public get height():number
	{
		return this._renderer.viewport.height;
	}

	public set height(value:number)
	{
		this._renderer.viewport.height = value;
	}

	/**
	 *
	 */
	public get mousePicker():RaycastPicker
	{
		return this._mousePicker;
	}

	public set mousePicker(value:RaycastPicker)
	{
		if (this._mousePicker == value)
			return;

		if (value == null)
			this._mousePicker = new RaycastPicker(this._partition, new PickGroup(this.renderer.viewport));
		else
			this._mousePicker = value;
	}

	/**
	 *
	 */
	public get x():number
	{
		return this._renderer.viewport.x;
	}

	public set x(value:number)
	{
		this._renderer.viewport.x = value;
	}

	/**
	 *
	 */
	public get y():number
	{
		return this._renderer.viewport.y;
	}

	public set y(value:number)
	{
		this._renderer.viewport.y = value;
	}

	/**
	 *
	 * @returns {number}
	 */
	public get renderedFacesCount():number
	{
		return 0; //TODO
		//return this._pEntityCollector._pNumTriangles;//numTriangles;
	}

	public beforeRenderCallback:Function;
	
	/** 
	 * Renders the view.
	 */
	public render():void
	{
		this._updateTime();

		// update picking
		if (!this.disableMouseEvents) {
			if (this.forceMouseMove && !this._mouseManager._iUpdateDirty)
				this._mouseManager._iCollision = this.getViewCollision(this._mouseX, this._mouseY, this);

			this._mouseManager.fireMouseEvents(this.forceMouseMove);
			//_touch3DManager.fireTouchEvents();
		}
		if(this.beforeRenderCallback){
			this.beforeRenderCallback();
		}
		//_touch3DManager.updateCollider();

		//render the contents of the scene
		this._renderer.render();
	}

	/**
	 *
	 */
	private _updateTime():void
	{
		var time:number = getTimer();

		if (this._time == 0)
			this._time = time;

		this._deltaTime = time - this._time;
		this._time = time;
	}

	/**
	 *
	 */
	public dispose():void
	{
		this._renderer.dispose();

		// TODO: imeplement mouseManager / touch3DManager
		this._mouseManager.unregisterView(this);

		//this._touch3DManager.disableTouchListeners(this);
		//this._touch3DManager.dispose();

		this._mouseManager = null;
		//this._touch3DManager = null;

		this._renderer = null;
	}

	/**
	 *
	 */
	private _onProjectionChanged(event:CameraEvent):void
	{
		if (this._renderer)
			this._renderer.viewport.projection = this._camera.projection;
	}

	public project(position:Vector3D, target:Vector3D = null):Vector3D
	{
		return this._renderer.viewport.project(position, target);
	}

	public unproject(sX:number, sY:number, sZ:number, target:Vector3D = null):Vector3D
	{
		return this._renderer.viewport.unproject(sX, sY, sZ, target);
	}

	/* TODO: implement Touch3DManager
	 public get touchPicker():IPicker
	 {
	 return this._touch3DManager.touchPicker;
	 }
	 */
	/* TODO: implement Touch3DManager
	 public set touchPicker( value:IPicker)
	 {
	 this._touch3DManager.touchPicker = value;
	 }
	 */

	public forceMouseMove:boolean;

	/*TODO: implement Background
	 public get background():away.textures.Texture2DBase
	 {
	 return this._background;
	 }
	 */
	/*TODO: implement Background
	 public set background( value:away.textures.Texture2DBase )
	 {
	 this._background = value;
	 this._renderer.background = _background;
	 }
	 */

	// TODO: required dependency stageGL
	public updateCollider():void
	{
		if (!this.disableMouseEvents) {
			// if (!this._renderer.shareContext) {
				this._mouseManager._iCollision = this.getViewCollision(this._mouseX, this._mouseY, this);
			// } else {
			// 	var collidingObject:PickingCollision = this.getViewCollision(this._mouseX, this._mouseY, this);
			//
			// 	if (this.layeredView || this._mouseManager._iCollision == null || collidingObject.rayEntryDistance < this._mouseManager._iCollision.rayEntryDistance)
			// 		this._mouseManager._iCollision = collidingObject;
			// }
		}
	}
	
	public getViewCollision(x:number, y:number, view:View):PickingCollision
	{
		//update ray
		var rayPosition:Vector3D = view.unproject(x, y, 0);
		var rayDirection:Vector3D = view.unproject(x, y, 1).subtract(rayPosition);

		return this._mousePicker.getCollision(rayPosition, rayDirection, false, true);
	}
}