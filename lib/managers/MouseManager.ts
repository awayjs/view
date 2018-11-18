import { BuildMode, Vector3D, EventBase } from "@awayjs/core";

import { PickingCollision, TouchPoint, PickGroup, IEntity } from "@awayjs/renderer";

import { DisplayObject, KeyboardEvent, MouseEvent, FocusEvent, FrameScriptManager, TextField, MovieClip } from "@awayjs/scene";

import { View } from "../View";


/**
 * MouseManager enforces a singleton pattern and is not intended to be instanced.
 * it provides a manager class for detecting mouse hits on scene objects and sending out mouse events.
 */
export class MouseManager {
    private static _instance: MouseManager;

    private _pickGroup: PickGroup;
    private _viewLookup: Array<View> = new Array<View>();
    private _containerLookup: Array<HTMLElement> = new Array<HTMLElement>();

    public _iActiveView: View;
    public _iUpdateDirty: boolean;
    public _iCollision: PickingCollision;
    
    private _iCollisionEntity: IEntity;         // current hit entity
    private _prevICollisionEntity: IEntity;     // entity hit on last frame
    private _mouseDragEntity: IEntity;          // entity hit on mouse-down
    private _mouseDragging: boolean;            // true while mosue is dragged
    private _currentFocusEntity: IEntity;       // entity currently in focus
    
    private _finalDispatchQueueObjects: IEntity[] = [];
    private _finalDispatchQueueEvents: EventBase[] = [];

    private _collisionIsEnabledButton:boolean=false;

    private _eventBubbling:boolean=false;           //  should events bubble up
    private _allowFocusOnUnfocusable:boolean=true;  // should unfocus-able object steal focus ?

    public _stage: DisplayObject;

    private _showCursor: boolean;

    private _nullVector: Vector3D = new Vector3D();
    private _queuedEvents: Array<MouseEvent> = new Array<MouseEvent>();

    private _mouseMoveEvent;

    private _mouseUp: MouseEvent = new MouseEvent(MouseEvent.MOUSE_UP);
    private _mouseUpOutside: MouseEvent = new MouseEvent(MouseEvent.MOUSE_UP_OUTSIDE);
    private _mouseClick: MouseEvent = new MouseEvent(MouseEvent.CLICK);
    private _mouseOut: MouseEvent = new MouseEvent(MouseEvent.MOUSE_OUT);
    private _dragOut: MouseEvent = new MouseEvent(MouseEvent.DRAG_OUT);
    private _dragOver: MouseEvent = new MouseEvent(MouseEvent.DRAG_OVER);
    private _mouseDown: MouseEvent = new MouseEvent(MouseEvent.MOUSE_DOWN);
    private _mouseMove: MouseEvent = new MouseEvent(MouseEvent.MOUSE_MOVE);
    private _mouseOver: MouseEvent = new MouseEvent(MouseEvent.MOUSE_OVER);
    private _mouseWheel: MouseEvent = new MouseEvent(MouseEvent.MOUSE_WHEEL);
    private _mouseDoubleClick: MouseEvent = new MouseEvent(MouseEvent.DOUBLE_CLICK);
    
    private _dragMove: MouseEvent = new MouseEvent(MouseEvent.DRAG_MOVE);
    private _dragStart: MouseEvent = new MouseEvent(MouseEvent.DRAG_START);
    private _dragStop: MouseEvent = new MouseEvent(MouseEvent.DRAG_STOP);
    
    
    private onClickDelegate: (event) => void;
    private onDoubleClickDelegate: (event) => void;
    private onMouseDownDelegate: (event) => void;
    private onMouseMoveDelegate: (event) => void;
    private onMouseUpDelegate: (event) => void;
    private onMouseWheelDelegate: (event) => void;
    private onMouseOverDelegate: (event) => void;
    private onMouseOutDelegate: (event) => void;
    private onKeyDownDelegate: (event) => void;
    private onKeyUpDelegate: (event) => void;
    private onFirstTouchDelegate: (event) => void;

    private _useSoftkeyboard: boolean = false;

    public buttonEnabledDirty: boolean;
    private _isTouch: Boolean;
    public isAVM1Dragging: Boolean = false;

    public get showCursor(): boolean {
        return this._showCursor;
    }
    public set showCursor(value: boolean) {
        this._showCursor = value;
    }

	/**
	 * Creates a new <code>MouseManager</code> object.
	 */
    constructor(pickGroup: PickGroup) {
        this._pickGroup = pickGroup;
        this.onClickDelegate = (event) => this.onClick(event);
        this.onDoubleClickDelegate = (event) => this.onDoubleClick(event);
        this.onMouseDownDelegate = (event) => this.onMouseDown(event);
        this.onMouseMoveDelegate = (event) => this.onMouseMove(event);
        this.onMouseUpDelegate = (event) => this.onMouseUp(event);
        this.onMouseWheelDelegate = (event) => this.onMouseWheel(event);
        this.onMouseOverDelegate = (event) => this.onMouseOver(event);
        this.onMouseOutDelegate = (event) => this.onMouseOut(event);
        this.onKeyDownDelegate = (event) => this.onKeyDown(event);
        this.onKeyUpDelegate = (event) => this.onKeyUp(event);
        this.onFirstTouchDelegate = (event) => this.onFirstTouch(event);
        this.buttonEnabledDirty = false;
        this._isTouch = false;
        this._showCursor = true;
        this._mouseDragging=false;
        window.addEventListener('touchstart', this.onFirstTouchDelegate, false);
    }
    public onFirstTouch(event): void {
        this._isTouch = true;
        // we only need to know once that a human touched the screen, so we can stop listening now
        window.removeEventListener('touchstart', this.onFirstTouchDelegate, false);
    }

    public set useSoftkeyboard(value: boolean) {

        this._useSoftkeyboard = value;
        if (!value && BuildMode.mode == BuildMode.AVM1) {
            window.addEventListener("keydown", this.onKeyDownDelegate);
            window.addEventListener("keyup", this.onKeyUpDelegate);
        }
        else if (value) {
            window.removeEventListener("keydown", this.onKeyDownDelegate);
            window.removeEventListener("keyup", this.onKeyUpDelegate);
        }
    }
    public get useSoftkeyboard(): boolean {
        return this._useSoftkeyboard;
    }

    public registerContainer(container: HTMLElement): void {
        if (container && this._containerLookup.indexOf(container) == -1) {
            container.addEventListener("click", this.onClickDelegate);
            container.addEventListener("dblclick", this.onDoubleClickDelegate);
            container.addEventListener("touchstart", this.onMouseDownDelegate);
            container.addEventListener("mousedown", this.onMouseDownDelegate);
            container.addEventListener("touchmove", this.onMouseMoveDelegate);
            container.addEventListener("mousemove", this.onMouseMoveDelegate);
            container.addEventListener("mouseup", this.onMouseUpDelegate);
            container.addEventListener("touchend", this.onMouseUpDelegate);
            container.addEventListener("mousewheel", this.onMouseWheelDelegate);
            container.addEventListener("mouseover", this.onMouseOverDelegate);
            container.addEventListener("mouseout", this.onMouseOutDelegate);
            if (BuildMode.mode == BuildMode.AVM1) {
                window.addEventListener("keydown", this.onKeyDownDelegate);
                window.addEventListener("keyup", this.onKeyUpDelegate);
            }
            this._containerLookup.push(container);
        }
    }

    public unregisterContainer(container: HTMLElement): void {
        if (container && this._containerLookup.indexOf(container) != -1) {
            container.removeEventListener("click", this.onClickDelegate);
            container.removeEventListener("dblclick", this.onDoubleClickDelegate);
            container.removeEventListener("touchstart", this.onMouseDownDelegate);
            container.removeEventListener("mousedown", this.onMouseDownDelegate);
            container.removeEventListener("touchmove", this.onMouseMoveDelegate);
            container.removeEventListener("mousemove", this.onMouseMoveDelegate);
            container.removeEventListener("touchend", this.onMouseUpDelegate);
            container.removeEventListener("mouseup", this.onMouseUpDelegate);
            container.removeEventListener("mousewheel", this.onMouseWheelDelegate);
            container.removeEventListener("mouseover", this.onMouseOverDelegate);
            container.removeEventListener("mouseout", this.onMouseOutDelegate);
            if (BuildMode.mode == BuildMode.AVM1) {
                window.removeEventListener("keydown", this.onKeyDownDelegate);
                window.removeEventListener("keyup", this.onKeyUpDelegate);
            }

            this._containerLookup.slice(this._containerLookup.indexOf(container), 1);
        }
    }

    public static getInstance(pickGroup: PickGroup): MouseManager {
        if (this._instance)
            return this._instance;

        return (this._instance = new MouseManager(pickGroup));
    }

    public setFocus(obj: DisplayObject) {
        if (this._currentFocusEntity == obj) {
            return;
        }
        if (this._currentFocusEntity) {
            this._currentFocusEntity.setFocus(false, false);
        }
        this._currentFocusEntity = obj;

        if (this._currentFocusEntity) {
            this._currentFocusEntity.setFocus(true, false);
        }
    }
    public getFocus() {
        return this._currentFocusEntity;
    }
    public focusNextTab() {
        if (this._viewLookup.length == 0)
            return;
        var newFocus: DisplayObject = <DisplayObject>this._viewLookup[0].tabPicker.getNextTabEntity(this._currentFocusEntity);
        if (newFocus == this._currentFocusEntity)
            return;
        if(this._currentFocusEntity)
            this._currentFocusEntity.setFocus(false, false);
        this._currentFocusEntity = newFocus;
        this._currentFocusEntity.setFocus(true, false);
    }
    public focusPreviousTab() {
        if (this._viewLookup.length == 0)
            return;
        var newFocus: DisplayObject = <DisplayObject>this._viewLookup[0].tabPicker.getPrevTabEntity(this._currentFocusEntity);
        if (newFocus == this._currentFocusEntity)
            return;
        if(this._currentFocusEntity)
            this._currentFocusEntity.setFocus(false, false);
        this._currentFocusEntity = newFocus;
        this._currentFocusEntity.setFocus(true, false);
    }



    private dispatchEvent(event:MouseEvent, entity:IEntity=null){
        if(!this._eventBubbling){
            if(entity){
                entity.dispatchEvent(event);
                FrameScriptManager.execute_queue();
            }
            return;
        }
        var dispatcher = entity;
        while (dispatcher) {
            if (dispatcher._iIsMouseEnabled()) {
                this._finalDispatchQueueObjects[this._finalDispatchQueueObjects.length] = dispatcher;
                this._finalDispatchQueueEvents[this._finalDispatchQueueEvents.length] = event;
            }
            dispatcher = dispatcher.parent;
        }
    }

    private setupAndDispatchEvent(event: MouseEvent, sourceEvent, collision: PickingCollision = null, collisionEntity: IEntity = null){
        event=this.setUpEvent(event, sourceEvent, collision, collisionEntity);
        this.dispatchEvent(event, event.entity);
    }

    public fireMouseEvents(forceMouseMove: boolean): void {

        this._finalDispatchQueueObjects.length = 0;
        this._finalDispatchQueueEvents.length = 0;

        this._iCollisionEntity = (this._iCollision) ? this._iCollision.pickerEntity : null;


        if (this._iCollisionEntity != this._prevICollisionEntity) {            

            //  If colliding object has changed, queue OVER and OUT events.
            //  If the mouse is dragged (mouse-down is hold), use DRAG_OVER and DRAG_OUT instead of MOUSE_OVER MOUSE_OUT
            //  DRAG_OVER and DRAG_OUT are only dispatched on the object that was hit on the mouse-down (_mouseDragEntity)

            //  Store the info if the collision is a enabled Button (_collisionIsEnabledButton)

            if (this._prevICollisionEntity) { 
                if (!this._isTouch && !this._mouseDragging)
                    this.queueDispatch(this._mouseOut, this._mouseMoveEvent, null, this._prevICollisionEntity);
                else if (this._mouseDragging && this._mouseDragEntity && this._mouseDragEntity == this._prevICollisionEntity)
                    this.queueDispatch(this._dragOut, this._mouseMoveEvent, null, this._prevICollisionEntity);
            }

            this._collisionIsEnabledButton=this._iCollisionEntity?(<any>this._iCollisionEntity).buttonEnabled:false;

            if (this._iCollisionEntity) {
                if (!this._isTouch && !this._mouseDragging)
                    this.queueDispatch(this._mouseOver, this._mouseMoveEvent, this._iCollision, this._iCollisionEntity);
                else if (this._mouseDragging && this._mouseDragEntity && this._mouseDragEntity == this._iCollisionEntity)
                    this.queueDispatch(this._dragOver, this._mouseMoveEvent, this._iCollision, this._iCollisionEntity);
            }
            this._prevICollisionEntity = this._iCollisionEntity;
        }
        else {            
            //  colliding object has not changed
            //  Check if we need to send any MOUSE_OVER/DRAG_OVER event to handle the case when a Button has become active while under the mouse.
            var isActiveButton=this._iCollisionEntity?(<any>this._iCollisionEntity).buttonEnabled:false;
            if(this._collisionIsEnabledButton!=isActiveButton && isActiveButton){
                if (!this._isTouch)
                    this.queueDispatch(this._mouseOver, this._mouseMoveEvent, this._iCollision, this._iCollisionEntity);
                else if (this._mouseDragEntity == this._iCollisionEntity)
                    this.queueDispatch(this._dragOver, this._mouseMoveEvent, this._iCollision, this._iCollisionEntity);
            }
            this._collisionIsEnabledButton=isActiveButton;
        }

        // set cursor if not dragging mouse
        if(!this._mouseDragging)
            document.body.style.cursor = this._showCursor ? (this._iCollisionEntity?this._iCollisionEntity.getMouseCursor() : "initial"):"none";


        var event: MouseEvent;
        var dispatcher: DisplayObject;
        var len:number=this._queuedEvents.length;

        // Dispatch all queued events.
        for (var i: number = 0; i < len; ++i) {
            event = this._queuedEvents[i];
            dispatcher = <DisplayObject>event.entity;

            if (event.type == MouseEvent.MOUSE_DOWN) {

                this._mouseDragging=true;
                // no event-bubbling. dispatch on stage first
                if(!this._eventBubbling && this._stage){
                    this._stage.dispatchEvent(event);
                }

                // todo: at this point the object under the mouse might have been changed, so we need to recheck the collision


                if (this._isTouch) {
                    // on Touch dispatch mouseOver Command
                    this.setupAndDispatchEvent(this._mouseOver, this._mouseMoveEvent, this._iCollision, this._iCollisionEntity);
                }

                this._mouseDragEntity = dispatcher;
                if(dispatcher){
                    this.dispatchEvent(event, dispatcher);
                }

                
                //  in FP6, a mouseclick on non focus-able object still steal the focus
                //  in newer FP they only steal the focus if the the new hit is focusable
                if(this._allowFocusOnUnfocusable || this._mouseDragEntity.tabEnabled){
                    if (this._currentFocusEntity)
                        this._currentFocusEntity.setFocus(false, true); 
                    this._currentFocusEntity = this._mouseDragEntity;
                    if (this._currentFocusEntity)
                        this._currentFocusEntity.setFocus(true, true);
                }
                if(this._mouseDragEntity)
                    this.setupAndDispatchEvent(this._dragStart, event, this._pickGroup.getAbstraction(this._mouseDragEntity).pickingCollision, this._mouseDragEntity);
               
            }

            else if (event.type == MouseEvent.MOUSE_UP) {

                // no event-bubbling. dispatch on stage first
                if(!this._eventBubbling && this._stage){
                    this._stage.dispatchEvent(event);
                }
                // todo: at this point the object under the mouse might have been changed, so we need to recheck the collision               

                var upEventDispatcher:IEntity=dispatcher;
                
                if (this.isAVM1Dragging && this._mouseDragEntity) {
                    // avm1dragging is in process, dispatch the mouse-up on this._mouseDragEntity instead of the current collision
                    upEventDispatcher=this._mouseDragEntity;
                }
                else if (this._mouseDragging && this._mouseDragEntity && this._mouseDragEntity != dispatcher) {
                    // no avm1dragging is in process, but current collision is not the same as collision that appeared on mouse-down,
                    // need to dispatch a MOUSE_UP_OUTSIDE on _mouseDragEntity
                    if((<any>this._mouseDragEntity).buttonEnabled){
                        this.setupAndDispatchEvent(this._mouseOut, event, this._mouseDragEntity ? this._pickGroup.getAbstraction(this._mouseDragEntity).pickingCollision : null, this._mouseDragEntity);
                    }
                    this.setupAndDispatchEvent(this._mouseUpOutside, event, this._mouseDragEntity ? this._pickGroup.getAbstraction(this._mouseDragEntity).pickingCollision : null, this._mouseDragEntity);
                }
                if(this._mouseDragging && dispatcher){
                    this.setupAndDispatchEvent(this._mouseOver, event, this._iCollision, this._iCollisionEntity);
                }

                if (this._isTouch) {
                    this.setupAndDispatchEvent(this._mouseOut, this._mouseMoveEvent, upEventDispatcher ? this._pickGroup.getAbstraction(upEventDispatcher).pickingCollision : null);
                }
                if(upEventDispatcher){
                    this.dispatchEvent(event, upEventDispatcher);
                }
                if(this._mouseDragEntity)
                    this.setupAndDispatchEvent(this._dragStop, event, this._pickGroup.getAbstraction(this._mouseDragEntity).pickingCollision, this._mouseDragEntity);
                this._mouseDragEntity = null;
                this._mouseDragging=false;
                this.isAVM1Dragging = false;
            }

            else if(event.type == MouseEvent.MOUSE_MOVE){                
                // no event-bubbling. dispatch on stage first
                if(!this._eventBubbling && this._stage){
                    this._stage.dispatchEvent(event);
                }
                if(this._mouseDragEntity)
                    this.setupAndDispatchEvent(this._dragMove, event, this._pickGroup.getAbstraction(this._mouseDragEntity).pickingCollision, this._mouseDragEntity);
           
            }

            else{
                // MouseEvent.MOUSE_OVER / MouseEvent.MOUSE_OUT / MouseEvent.DRAG_OVER / MouseEvent.DRAG_OUT
                this.dispatchEvent(event, dispatcher);
            }

        }
		this._queuedEvents.length = 0;


        this._iUpdateDirty = false;
    }

    //		public addViewLayer(view:View)
    //		{
    //			var stg:Stage = view.stage;
    //
    //			// Add instance to mouse3dmanager to fire mouse events for multiple views
    //			if (!view.stageGL.mouse3DManager)
    //				view.stageGL.mouse3DManager = this;
    //
    //			if (!hasKey(view))
    //				_view3Ds[view] = 0;
    //
    //			_childDepth = 0;
    //			traverseDisplayObjects(stg);
    //			_viewCount = _childDepth;
    //		}

    public registerView(view: View): void {
        if (view)
            this._viewLookup.push(view);
    }

    public unregisterView(view: View): void {
        if (view)
            this._viewLookup.slice(this._viewLookup.indexOf(view), 1);
    }

    public addEventsForViewBinary(touchMessage: ArrayBuffer, viewIdx: number = 0): void {

        var newTouchEvent: any = {};
        newTouchEvent.clientX = null;// we get the x position from the active touch
        newTouchEvent.clientY = null;// we get the y position from the active touch
        newTouchEvent.touches = [];
        newTouchEvent.changedTouches = [];
        newTouchEvent.preventDefault = function () { };
        var messageView: Float32Array = new Float32Array(touchMessage);
        // transfer touches to event
        var i = 0;
        var cnt = 0;
        var touchCnt = 0;
        cnt++;//we temporary added 1 float to transfer fps from java to js. skip this
        var numTouches = messageView[cnt++];
        var touchtype = messageView[cnt++];
        var activeTouchID = messageView[cnt++];
        var x: number = 0;
        var y: number = 0;
        if ((touchtype != 1) && (touchtype != 6) && (touchtype != 12) && (touchtype != 262) && (touchtype != 518)) {
            // if this is not a UP command, we add all touches
            for (i = 0; i < numTouches; i++) {
                var newTouch: any = {};
                newTouch.identifier = messageView[cnt++];
                newTouch.clientX = messageView[cnt++];
                newTouch.clientY = messageView[cnt++];
                newTouchEvent.touches[i] = newTouch;
                //newTouchEvent.changedTouches[i] = newTouch;
            }
            newTouchEvent.changedTouches[0] = newTouchEvent.touches[activeTouchID];
            x = newTouchEvent.changedTouches[0].clientX;
            y = newTouchEvent.changedTouches[0].clientY;
        }
        else {
            // if this is a UP command, we add all touches, except the active one
            if (numTouches == 1) {

                var newTouch: any = {};
                newTouch.identifier = messageView[cnt++];
                newTouch.clientX = messageView[cnt++];
                newTouch.clientY = messageView[cnt++];
                newTouchEvent.clientX = newTouch.clientX;
                newTouchEvent.clientY = newTouch.clientY;
                x = newTouchEvent.clientX;
                y = newTouchEvent.clientY;
            }
            else {
                for (i = 0; i < numTouches; i++) {
                    var newTouch: any = {};
                    newTouch.identifier = messageView[cnt++];
                    newTouch.clientX = messageView[cnt++];
                    newTouch.clientY = messageView[cnt++];
                    if (i != activeTouchID) {
                        newTouchEvent.touches[touchCnt] = newTouch;
                        //newTouchEvent.changedTouches[touchCnt++] = newTouch;
                    }
                    else {
                        newTouchEvent.clientX = newTouch.clientX;
                        newTouchEvent.clientY = newTouch.clientY;
                        x = newTouchEvent.clientX;
                        y = newTouchEvent.clientY;
                    }
                }
            }
        }

        //console.log("Touch ID:"+touchtype+" activeTouchID "+activeTouchID+" numTouches "+numTouches+" x"+x+" y"+y);
		/*
		 public static final int ACTION_DOWN = 0;
		 public static final int ACTION_POINTER_1_DOWN = 5;
		 public static final int ACTION_POINTER_DOWN = 5;
		 public static final int ACTION_BUTTON_PRESS = 11;
		 public static final int ACTION_POINTER_2_DOWN = 261;
		 public static final int ACTION_POINTER_3_DOWN = 517;


		 public static final int ACTION_UP = 1;
		 public static final int ACTION_POINTER_1_UP = 6;
		 public static final int ACTION_POINTER_UP = 6;
		 public static final int ACTION_BUTTON_RELEASE = 12;
		 public static final int ACTION_POINTER_2_UP = 262;
		 public static final int ACTION_POINTER_3_UP = 518;

		 public static final int ACTION_MOVE = 2;


		 */
        if ((touchtype == 0) || (touchtype == 5) || (touchtype == 11) || (touchtype == 261) || (touchtype == 517)) {
            this.onMouseDown(newTouchEvent);
        }
        else if ((touchtype == 1) || (touchtype == 6) || (touchtype == 12) || (touchtype == 262) || (touchtype == 518)) {
            this.onMouseUp(newTouchEvent);
        }
        else if (touchtype == 2) {
            this.onMouseMove(newTouchEvent);
        }
        else {
            console.log("recieved unknown touch event-type: " + touchtype);
        }
    }

    public fireEventsForViewFromString(touchMessage: String, viewIdx: number = 0): void {

        var newTouchEvent: any = {};
        newTouchEvent.clientX = null;// set the x position from the active touch
        newTouchEvent.clientY = null;// set the y position from the active touch
        newTouchEvent.preventDefault = function () { };
        var touchesFromMessage = touchMessage.split(",");
        // transfer touches to event
        var i = 0;
        var cnt = 0;
        var numTouches = parseInt(touchesFromMessage[cnt++]);
        var touchtype = parseInt(touchesFromMessage[cnt++]);
        var activeTouch = parseInt(touchesFromMessage[cnt++]);
        newTouchEvent.touches = [];
        newTouchEvent.changedTouches = [];
        if ((touchtype != 1) && (touchtype != 6)) {
            for (i = 0; i < numTouches; i++) {
                var newTouch: any = {};
                newTouch.identifier = touchesFromMessage[cnt++];
                newTouch.clientX = touchesFromMessage[cnt++];
                newTouch.clientY = touchesFromMessage[cnt++];
                newTouchEvent.touches[i] = newTouch;
                newTouchEvent.changedTouches[i] = newTouch;
            };
            newTouchEvent.changedTouches[i] = newTouchEvent.touches[activeTouch];
        }
        else {
            for (i = 0; i < numTouches; i++) {
                if (i != activeTouch) {
                    var newTouch: any = {};
                    newTouch.identifier = touchesFromMessage[cnt++];
                    newTouch.clientX = touchesFromMessage[cnt++];
                    newTouch.clientY = touchesFromMessage[cnt++];
                    newTouchEvent.touches[i] = newTouch;
                    newTouchEvent.changedTouches[i] = newTouch;
                }
                else {
                    newTouchEvent.clientX = touchesFromMessage[cnt++];
                    newTouchEvent.clientY = touchesFromMessage[cnt++];
                    cnt++;
                }
            };


        }
        if (touchtype == 0) {//mousedown
            this.onMouseDown(newTouchEvent);
        }
        else if (touchtype == 1) {//mouseup
            this.onMouseUp(newTouchEvent);
        }
        else if (touchtype == 2) {//mousemove
            this.onMouseMove(newTouchEvent);

        }
        else if (touchtype == 261) {//mousedownPointer
            this.onMouseDown(newTouchEvent);

        }
        else if (touchtype == 6) {//mouseupPointer
            this.onMouseUp(newTouchEvent);
        }
    }
    // ---------------------------------------------------------------------
    // Private.
    // ---------------------------------------------------------------------
    private setUpEvent(event: MouseEvent, sourceEvent, collision: PickingCollision = null, collisionEntity: IEntity = null): MouseEvent {
        // 2D properties.
        if (sourceEvent) {
            event.delta = sourceEvent.wheelDelta;
            event.ctrlKey = sourceEvent.ctrlKey;
            event.altKey = sourceEvent.altKey;
            event.shiftKey = sourceEvent.shiftKey;
            event.screenX = (sourceEvent.clientX != null) ? sourceEvent.clientX : sourceEvent.changedTouches? sourceEvent.changedTouches[0].clientX:0;
            event.screenY = (sourceEvent.clientY != null) ? sourceEvent.clientY : sourceEvent.changedTouches? sourceEvent.changedTouches[0].clientY:0;
        }
        //console.log("event", event, collisionEntity, collisionEntity);

        //if (collision == null)
            //collision = this._iCollision;

        //if (collisionEntity == null)
            //collisionEntity = this._iCollisionEntity;

        event.entity=null;
        if(collisionEntity)
            event.entity = collisionEntity;

        // 3D properties.
        if (collision) {
            // Object.
            event.renderable = collision.renderable;
            // UV.
            event.uv = collision.uv;
            // Position.
            event.position = collision.position ? collision.position.clone() : null;
            // Normal.
            event.normal = collision.normal ? collision.normal.clone() : null;
            // Face index.
            event.elementIndex = collision.elementIndex;
        } else {
            // Set all to null.
            event.uv = null;
            event.position = this._nullVector;
            event.normal = this._nullVector;
            event.elementIndex = 0;
        }
        return event;

    }
    private queueDispatch(event: MouseEvent, sourceEvent, collision: PickingCollision = null, collisionEntity: IEntity = null): void {
        // Store event to be dispatched later.
        this._queuedEvents.push(this.setUpEvent(event, sourceEvent, collision, collisionEntity));

    }

    // ---------------------------------------------------------------------
    // Listeners.
    // ---------------------------------------------------------------------

    public onKeyDown(event): void {
        event.preventDefault();

        if (this._currentFocusEntity || this._stage) {
            //console.log("dispatch keydown on ", this._currentFocusEntity);
            var newEvent: KeyboardEvent = new KeyboardEvent(KeyboardEvent.KEYDOWN, event.key, event.code);
            newEvent.isShift = event.shiftKey;
            newEvent.isCTRL = event.ctrlKey;
            newEvent.isAlt = event.altKey;
            if (this._currentFocusEntity)
                this._currentFocusEntity.dispatchEvent(newEvent);
            if (this._stage)
                this._stage.dispatchEvent(newEvent);
        }

    }
    public onKeyUp(event): void {
        event.preventDefault();

        if (this._currentFocusEntity || this._stage) {
            //console.log("dispatch keydown on ", this._currentFocusEntity);
            var newEvent: KeyboardEvent = new KeyboardEvent(KeyboardEvent.KEYUP, event.key, event.code);
            newEvent.isShift = event.shiftKey;
            newEvent.isCTRL = event.ctrlKey;
            newEvent.isAlt = event.altKey;
            if (this._currentFocusEntity)
                this._currentFocusEntity.dispatchEvent(newEvent);
            if (this._stage)
                this._stage.dispatchEvent(newEvent);
        }

    }

    public onMouseMove(event): void {
        event.preventDefault();

        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseMove, this._mouseMoveEvent = event);
    }

    private onMouseOut(event): void {
        this.updateColliders(event);

        //if (this._iCollision)
        this.queueDispatch(this._mouseOut, event, this._iCollision, this._iCollisionEntity);
    }

    private onMouseOver(event): void {
        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseOver, event, this._iCollision, this._iCollisionEntity);
    }

    private onClick(event): void {
        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseClick, event, this._iCollision, this._iCollisionEntity);
    }

    private onDoubleClick(event): void {
        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseDoubleClick, event, this._iCollision, this._iCollisionEntity);
    }


    private _isDown: boolean = false;

    public onMouseDown(event): void {
        if (this._isDown) {
            return;
        }
        this._isDown = true;
        event.preventDefault();

        this.updateColliders(event);

        console.log("this._iCollisionEntity", this._iCollisionEntity);
        //if (this._iCollision)
            this.queueDispatch(this._mouseDown, event, this._iCollision, this._iCollisionEntity);
    }

    public onMouseUp(event): void {
        if (!this._isDown) {
            return;
        }
        this._isDown = false;
        event.preventDefault();

        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseUp, event, this._iCollision, this._iCollisionEntity);
    }

    private onMouseWheel(event): void {
        this.updateColliders(event);

        //if (this._iCollision)
            this.queueDispatch(this._mouseWheel, event, this._iCollision, this._iCollisionEntity);
    }


    private updateColliders(event): void {
        var view: View;
        var mouseX: number = (event.clientX != null) ? event.clientX : event.changedTouches[0].clientX;
        var mouseY: number = (event.clientY != null) ? event.clientY : event.changedTouches[0].clientY;
        var len: number = this._viewLookup.length;
        for (var i: number = 0; i < len; i++) {
            view = this._viewLookup[i];
            view._touchPoints.length = 0;

            if (event.touches) {
                var touch;
                var len: number = event.touches.length;
                for (var i: number = 0; i < len; i++) {
                    touch = event.touches[i];
                    view._touchPoints.push(new TouchPoint(touch.clientX + view.x, touch.clientY + view.y, touch.identifier));
                }
            }

            if (this._iUpdateDirty)
                continue;

            if (mouseX < view.x) {
                view._mouseX = view.x;
            }
            else if (mouseX > view.x + view.width) {
                view._mouseX = view.x + view.width;

            }
            else {
                view._mouseX = mouseX - view.x;

            }
            if (mouseY < view.y) {
                view._mouseY = view.y;

            }
            else if (mouseY > view.y + view.height) {
                view._mouseY = view.y + view.height;
            }
            else {
                view._mouseY = mouseY - view.y;
            }

            view.updateCollider();

            if (view.layeredView && this._iCollision)
                break;

        }

        this._iUpdateDirty = true;
    }
}