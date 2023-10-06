const Resizeable = {};
Resizeable.activeContentWindows = [];
Resizeable.activeResizers = [];
Resizeable.currentResizer = null;
Resizeable.contentWindowSeq = 0;
Resizeable.resizerSeq = 0;

Resizeable.Sides = {
  TOP: "TOP",
  BOTTOM: "BOTTOM",
  LEFT: "LEFT",
  RIGHT: "RIGHT"
};

Resizeable.Classes = {
  WINDOW_TOP: "resizeable-top",
  WINDOW_BOTTOM: "resizeable-bottom",
  WINDOW_LEFT: "resizeable-left",
  WINDOW_RIGHT: "resizeable-right"
};


Resizeable.initialise = function(parentId, initialSizes, resizerThickness){
  //Find left window
  Resizeable.resizerThickness = resizerThickness ? resizerThickness : 4;
  Resizeable.initialSizes = initialSizes;
  let parent = document.getElementById(parentId);
  let parentWindow = new Resizeable.ContentWindow(null, parseInt(parent.style.width, 10), parseInt(parent.style.height, 10), parent);
  Resizeable.setupChildren(parentWindow);
};

Resizeable.splitWindow = function( e, isHorizontal ) {
  let currElem = e.target, elemContent, parentWin;
  if( currElem.id && currElem.classList.contains( 'content-window' )) {
    parentWin = Resizeable.findWindow( currElem.id );
    if( parentWin.children.length > 0 || parentWin.width < ( 2 * parentWin.minWidth ) + Resizeable.resizerThickness ) {
      return
    }
    if( isHorizontal ) {
      elemContent = '<div class="resizeable-left">' + currElem.innerHTML + '</div><div class="resizeable-right"></div>'
    }
    else {
      elemContent = '<div class="resizeable-top">' + currElem.innerHTML + '</div><div class="resizeable-bottom"></div>'
    }
    currElem.innerHTML = elemContent;
    Resizeable.setupChildren( parentWin );
    e.preventDefault()
  }
};

Resizeable.removeSplit = function( e, keepTopLeft ) {
  let currElem = e.target, ret = null;
  if( currElem.id && currElem.classList.contains( 'resizer' )) {
    let selResizer = getResizerFromDiv( currElem.id );

    if( selResizer.parent.children.length > 0 ) {
      let removeWin = selResizer.parent.children[ keepTopLeft ? 1 : 0 ];
      if (removeWin.children.length === 0 && removeWin.parent !== null) {
        removeWin.destroy();
        ret = true;
        e.preventDefault()
      }
    }
    else {
      ret = false
    }
  }
  return ret;
};

Resizeable.findWindow = function( tgtElem ) {
  let tgtWindow = null;
  for( let i=0; i< Resizeable.activeContentWindows.length; i++ ) {
    if ( Resizeable.activeContentWindows[i].divId === tgtElem ) {
      tgtWindow = Resizeable.activeContentWindows[i];
      break
    }
  }
  return tgtWindow;
};

Resizeable.setupChildren = function(parentWindow){
  let childInfo = parentWindow.findChildWindowElements();
  if(childInfo.child1 == null){
    //No children found
    return;
  }
  let sizeFraction = Resizeable.initialSizes[childInfo.child1.id];
  if(sizeFraction === undefined)
    sizeFraction = 0.5;
  if(childInfo.isHorizontal){
    parentWindow.splitHorizontally(sizeFraction, childInfo.child1, childInfo.child2);
  }else{
    parentWindow.splitVertically(sizeFraction, childInfo.child1, childInfo.child2);
  }
  //Set up the children of the newly created windows
  let childWindow1 = Resizeable.activeContentWindows[Resizeable.activeContentWindows.length-2];
  let childWindow2 = Resizeable.activeContentWindows[Resizeable.activeContentWindows.length-1];
  Resizeable.setupChildren(childWindow1);
  Resizeable.setupChildren(childWindow2);

};

Resizeable.nextContentWindowSeq = function() {
  return ++Resizeable.contentWindowSeq;
};

Resizeable.nextResizerSeq = function() {
  return ++Resizeable.resizerSeq;
};

Resizeable.ContentWindow = class{
  
  constructor(parent, width, height, div){
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.sizeFractionOfParent = 0.5;

    if(div === null){
      this.divId = "content-window" + Resizeable.nextContentWindowSeq();

      let div = document.createElement('div');
      div.id = this.divId;
      div.classList.add('content-window');

      //Insert the div with correct ID into the parent window; or body if parent is null
      if(parent !== null){
        parent.getDiv().appendChild(div);
      }else{
        document.body.insertAdjacentHTML('afterbegin', div.outerHTML );
      }
    }
    else{
      if(div.id === "")
        div.id = "content-window" + Resizeable.nextContentWindowSeq();
      this.divId = div.id;
      this.getDiv().classList.add("content-window");
    }

    this.children = [];
    this.isSplitHorizontally = false;
    this.isSplitVertically = false;
    this.childResizer = null;
    this.minWidth = 20;
    this.minHeight = 20;
    this.originalMinSize = 20;
    this.childResizerThickness = Resizeable.resizerThickness;


    this.getDiv().style.position = "absolute";
    this.getDiv().style.overflow = "hidden";

    this.getDiv().style.width = Math.round(this.width).toString() + "px";
    this.getDiv().style.height = Math.round(this.height).toString() + "px";

    Resizeable.activeContentWindows.push(this);
    this.calculateSizeFractionOfParent();

  }

  getDiv(){
    return document.getElementById(this.divId);
  }

  getDivId(){
    return this.divId;
  }

  findChildWindowElements(){
    //Cannot have more than two direct children
    let child1, child2, isHorizontal = false;
    //Find left child
    if(document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_LEFT}`).length > 0){
      child1 = document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_LEFT}`)[0];
      if(document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_RIGHT}`).length > 0){
        child2 = document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_RIGHT}`)[0];
      }else{
        console.error(`${this.divId} has left child but not right`);
      }
      isHorizontal = true;
    }
    if(document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_TOP}`).length > 0){
      if(child1 !== undefined){
        console.error(`${this.divId} has both left and top children`);
        return;
      }else{
        child1 = document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_TOP}`)[0];
        if(document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_BOTTOM}`).length > 0){
          child2 = document.querySelectorAll(`#${this.divId} > .${Resizeable.Classes.WINDOW_BOTTOM}`)[0];
        }else{
          console.error(`${this.divId} has top child but not bottom`);
        }
      }
      isHorizontal = false;
    }

    return {child1: child1, child2: child2, isHorizontal: isHorizontal};

  }

  resize(side, mousePos){

    if(this.parent == null){
      return;
    }

    switch(side){
      case Resizeable.Sides.TOP:
        //Based on position of resizer line
        this.changeSize(this.parent.width, parseInt(this.parent.getDiv().style.height) - mousePos - this.parent.childResizerThickness );
        this.getDiv().style.top = Math.ceil( mousePos + this.parent.childResizerThickness ).toString() + "px";
        break;
      case Resizeable.Sides.BOTTOM:
        this.changeSize( this.parent.width, Math.floor( mousePos - this.getDiv().getBoundingClientRect().top ));
        break;
      case Resizeable.Sides.LEFT:
        //Based on position of resizer line
        this.changeSize(parseInt(this.parent.getDiv().style.width) - mousePos - this.parent.childResizerThickness, this.parent.height );
        this.getDiv().style.left = Math.ceil( mousePos + this.parent.childResizerThickness ).toString() + "px";
        break;
      case Resizeable.Sides.RIGHT:
        this.changeSize( Math.floor( mousePos - this.getDiv().getBoundingClientRect().left ), this.parent.height);
        break;
      default:
        console.error("Window.resize: incorrect side");

    }

    if(this.children.length > 0){
      this.childrenResize();
    }

    if(this.parent != null){
      this.calculateSizeFractionOfParent();
      this.getSibling().calculateSizeFractionOfParent();
      siblingWindowErrorCorrect(this);
    }

    this.repositionChildResizer();
    
    Resizeable.windowResized();

  }

  calculateSizeFractionOfParent(){
    if(this.parent == null){
      this.sizeFractionOfParent = 1.0;
    }else{
      if(this.parent.isSplitHorizontally){
        this.sizeFractionOfParent = this.width / this.parent.width;

      }else if (this.parent.isSplitVertically){
        this.sizeFractionOfParent = this.height / this.parent.height;
      }
    }

  }

  getSibling(){
    if(this.parent == null)
      return null;
    if(this.parent.children[0] === this)
      return this.parent.children[1];
    else return this.parent.children[0];
  }

  childrenResize(){
    if(this.children.length === 0)
      return; //Content window has no children

    if(this.isSplitHorizontally){
      let height = this.height;
      this.children[0].changeSize(Math.ceil( this.width * this.children[0].sizeFractionOfParent - ( this.childResizerThickness / 2 )), height);
      this.children[1].changeSize(Math.floor( this.width * this.children[1].sizeFractionOfParent - ( this.childResizerThickness / 2 )), height);
      this.children[1].getDiv().style.left = ( parseInt(this.children[0].getDiv().style.width) + this.childResizer.lineThickness ).toString() + "px";
    }else if(this.isSplitVertically){
      this.children[0].changeSize(this.width, Math.ceil(this.height * this.children[0].sizeFractionOfParent -  ( this.childResizerThickness / 2 )));
      this.children[1].changeSize(this.width, Math.floor(this.height * this.children[1].sizeFractionOfParent - ( this.childResizerThickness / 2 )));
      this.children[1].getDiv().style.top = ( parseInt(this.children[0].getDiv().style.height) + this.childResizer.lineThickness ).toString() + "px";
    }

    this.children[0].childrenResize();
    this.children[1].childrenResize();

    this.repositionChildResizer();

  }

  toString(){
    return `divId = ${this.divId}, parent = ${this.parent.getDivId()}, width = ${this.width}, height = ${this.height}`;
  }

  changeSize(width, height){
    
    if(width < this.minWidth){
      width = this.minWidth;
    }
    if(height < this.minHeight)
      height = this.minHeight;


    if(this.parent != null){
      if(width > this.parent.width - this.getSibling().minWidth - this.parent.childResizerThickness && this.parent.isSplitHorizontally){
        width = this.parent.width - this.getSibling().minWidth - this.parent.childResizerThickness;
        this.parent.repositionChildResizer();
      }
      if(height > this.parent.height - this.getSibling().minHeight - this.parent.childResizerThickness && this.parent.isSplitVertically){
        height = this.parent.height - this.getSibling().minHeight - this.parent.childResizerThickness;
        this.parent.repositionChildResizer();
      }
    }

    if(this.parent == null){
      if(width > window.innerWidth)
        width = window.innerWidth;
      if(height > window.height)
        height = window.innerHeight;
    }else{
      if(width > this.parent.width){
        width = this.parent.width;
      }
      if(height > this.parent.height){
        height = this.parent.height;
      }
    }

    width = Math.round(width);
    height = Math.round(height);
    this.getDiv().style.width = width + "px";
    this.getDiv().style.height = height + "px";
    this.width = width;
    this.height = height;

  }

  repositionChildResizer(){
    if(this.childResizer != null)
      this.childResizer.reposition();
  }

  calculateMinWidthHeight(){

    if(this.children.length > 0){
      //Recursively call this on all descendants
      this.children[0].calculateMinWidthHeight();
      this.children[1].calculateMinWidthHeight();
      if(this.isSplitHorizontally){
        this.minWidth = this.children[0].minWidth + this.children[1].minWidth;
        if(this.children[0].minHeight > this.children[1].minHeight)
          this.minHeight = this.children[0].minHeight;
        else
          this.minHeight = this.children[1].minHeight;
      }else if(this.isSplitVertically){
        this.minHeight = this.children[0].minHeight + this.children[1].minHeight;
        if(this.children[0].minWidth > this.children[1].minWidth)
          this.minWidth = this.children[0].minWidth;
        else
          this.minWidth = this.children[1].minWidth;
      }
    }else{
      this.minWidth = this.originalMinSize;
      this.minHeight = this.originalMinSize;

    }

    this.minWidth = Math.round(this.minWidth);
    this.minHeight = Math.round(this.minHeight);

  }

  getTopLevelParent(){
    let parentToReturn = this;
    while(parentToReturn.parent != null){
      parentToReturn = parentToReturn.parent;
    }
    return parentToReturn;
  }

  splitHorizontally(leftWindowSizeFraction, leftDiv, rightDiv){

    this.isSplitHorizontally = true;

    let leftWidth = Math.ceil((this.width * leftWindowSizeFraction) - this.childResizerThickness/2 );

    if(leftWidth != null && leftDiv != null){
      this.getDiv().appendChild(leftDiv);
    }
    if(rightDiv != null){
      this.getDiv().appendChild(rightDiv);
    }

    let w1 = new Resizeable.ContentWindow(this, leftWidth, this.height, leftDiv);
    let w2 = new Resizeable.ContentWindow(this, this.width - leftWidth - this.childResizerThickness/2, this.height, rightDiv);
    w2.getDiv().style.left = (leftWidth + this.childResizerThickness ).toString() + "px";

    this.childResizer = new Resizeable.Resizer(this, w1, w2, true);
    this.childResizer.getDiv().style.left = leftWidth.toString() + "px";

    this.children.push(w1);
    this.children.push(w2);

    this.getTopLevelParent().calculateMinWidthHeight();

  }

  splitVertically(topWindowSizeFraction, topDiv, bottomDiv){

    this.isSplitVertically = true;

    let topHeight = Math.ceil((this.height * topWindowSizeFraction) - this.childResizerThickness/2 );
    
    if(topDiv != null)
      this.getDiv().appendChild(topDiv);
    if(bottomDiv != null)
      this.getDiv().appendChild(bottomDiv);

    let w1 = new Resizeable.ContentWindow(this, this.width, topHeight, topDiv);
    let w2 = new Resizeable.ContentWindow(this, this.width, this.height - topHeight - this.childResizerThickness/2, bottomDiv);
    w2.getDiv().style.top = ( topHeight + this.childResizerThickness ).toString()  + "px";

    this.childResizer = new Resizeable.Resizer(this, w1, w2, false);
    this.childResizer.getDiv().style.top = topHeight.toString() + "px";

    this.children.push(w1);
    this.children.push(w2);

    this.getTopLevelParent().calculateMinWidthHeight();

  }

  destroy() {
    let elemContent, sibWin, parentWin, removeResizer;
    sibWin = this.getSibling();
    elemContent = document.getElementById(sibWin.getDivId()).innerHTML;

    removeResizer = this.parent.childResizer;
    removeResizer.getDiv().parentNode.removeChild(removeResizer.getDiv());
    for (let i = 0; i < Resizeable.activeResizers.length; i++) {
      if (Resizeable.activeResizers[i] === removeResizer) {
        Resizeable.activeResizers.splice(i, 1);
        break
      }
    }

    parentWin = this.parent;
    parentWin.getDiv().innerHTML = elemContent;

    if (parentWin.isSplitHorizontally) {
      parentWin.isSplitHorizontally = false;
    } else if (parentWin.isSplitVertically) {
      parentWin.isSplitVertically = false;
    }
    if ( sibWin.children.length > 0 ) {
      parentWin.children = sibWin.children;
      parentWin.childResizer = sibWin.childResizer;
      parentWin.isSplitHorizontally = sibWin.isSplitHorizontally;
      parentWin.isSplitVertically = sibWin.isSplitVertically;
      parentWin.children[0].parent = parentWin;
      parentWin.children[1].parent = parentWin;
      if( parentWin.isSplitHorizontally ) {
        parentWin.leftWindow = parentWin.children[0];
        parentWin.rightWindow = parentWin.children[1];
      }
      else if( parentWin.isSplitVertically ) {
        parentWin.topWindow = parentWin.children[0];
        parentWin.bottomWindow = parentWin.children[1];
      }
      parentWin.childResizer.parent = parentWin;
    }
    else {
      parentWin.children = [];
      parentWin.childResizer = null;
    }

    for (let i= Resizeable.activeContentWindows.length; i >= 0; --i ) {
      if (Resizeable.activeContentWindows[i] === this ) {
        Resizeable.activeContentWindows.splice(i, 1);
        break
      }
    }

    for (let i= Resizeable.activeContentWindows.length; i >= 0; --i ) {
      if (Resizeable.activeContentWindows[i] === sibWin ) {
        Resizeable.activeContentWindows.splice(i, 1);
        break
      }
    }

    if( parentWin.children.length > 0 ) {
      parentWin.childrenResize()
    }
  }
};

Resizeable.parentResize = function(width, height){
  const parentWindow = Resizeable.activeContentWindows[0];
  parentWindow.changeSize(width, height);
  parentWindow.repositionChildResizer();
  if (parentWindow.children.length > 0) {
    parentWindow.childrenResize();
  }

  if (parentWindow.parent != null) {
    parentWindow.calculateSizeFractionOfParent();
    parentWindow.getSibling().calculateSizeFractionOfParent();
    siblingWindowErrorCorrect(parentWindow);
  }

  parentWindow.repositionChildResizer();
  Resizeable.windowResized();
}

function resizerMouseDown(e) {
  e.preventDefault();
  Resizeable.resizingStarted();
  e.stopPropagation();
  Resizeable.currentResizer = getResizerFromDiv(this.id);
  window.addEventListener('mousemove', Resizeable.currentResizer.resize);
  window.addEventListener('mouseup', Resizeable.currentResizer.cancelResize);
}

function resizerTouchStart() {
  Resizeable.resizingStarted();
  Resizeable.currentResizer = getResizerFromDiv(this.id);
  window.addEventListener('touchmove', Resizeable.currentResizer.resize);
  window.addEventListener('touchend', Resizeable.currentResizer.cancelResize);
}

function attachResizerEvents(){
  let elements = document.querySelectorAll('.resizer');
  if (elements) {
    elements.forEach(function(el){
      el.addEventListener('mousedown', resizerMouseDown);
      el.addEventListener('touchstart', resizerTouchStart);
    });
  }
}

function clearResizerEvents() {
  let elements = document.querySelectorAll('.resizer');
  if (elements) {
    elements.forEach(function(el){
      el.removeEventListener('mousedown', resizerMouseDown);
      el.removeEventListener('touchstart', resizerTouchStart);
    });
  }
}

function getResizerFromDiv(divId){
  for(let i= 0; i < Resizeable.activeResizers.length; i++){
    if(Resizeable.activeResizers[i].getDivId() === divId){
      return Resizeable.activeResizers[i];
    }
  }
  console.error("getResizerFromDiv failed to find resizer");
  return null;
}

function siblingWindowErrorCorrect(child){
  child.getSibling().sizeFractionOfParent = 1 - child.sizeFractionOfParent;
}

Resizeable.windowResized = function(){
  //Code to run when any window is resized should be placed here.
};

Resizeable.resizingEnded = function() {
  //Runs whenever a resizer is clicked
}

Resizeable.resizingStarted = function() {
  //Runs on the next 'mouseup' or 'touchend' events after a resizer is clicked
}

Resizeable.Resizer = class{
  constructor(parent, window1, window2, isHorizontal){
    this.parent = parent;
    this.isHorizontal = isHorizontal;
    if(this.isHorizontal){
      this.leftWindow = window1;
      this.rightWindow = window2;
    }else{
      //Vertical Resizer
      this.topWindow = window1;
      this.bottomWindow = window2;
    }

    this.divId = "resizer" + Resizeable.nextResizerSeq();

    let div= document.createElement('div');
    div.id = this.divId;
    div.classList.add('resizer');
    parent.getDiv().appendChild(div);

    if(this.isHorizontal){
      this.getDiv().classList.add("horizontal-resizer");
    }else{
      this.getDiv().classList.add("vertical-resizer");
    }

    this.getDiv().style.position = "absolute";

    //this.lineThickness = 4;
    this.lineThickness = Resizeable.resizerThickness;
    if(isHorizontal){
      this.getDiv().style.width = this.lineThickness + "px";
      this.getDiv().style.height = this.parent.height + "px";
    }else{
      this.getDiv().style.width = this.parent.width + "px";
      this.getDiv().style.height = this.lineThickness + "px";
    }

    this.reposition();


    Resizeable.activeResizers.push(this);
    clearResizerEvents();
    attachResizerEvents();

  }

  getDiv(){
    return document.getElementById(this.divId);
  }

  getDivId(){
    return this.divId;
  }

  reposition(){

    if(this.isHorizontal){
      this.getDiv().style.left = this.leftWindow.getDiv().style.width;
      this.getDiv().style.height = this.parent.getDiv().style.height;
    }else{
      this.getDiv().style.top = this.topWindow.getDiv().style.height;
      this.getDiv().style.width = this.parent.getDiv().style.width;
    }

  }


  resize(e){
    

    let inputX = Math.round( e.pageX );
    let inputY = Math.round( e.pageY );
    if(inputX === undefined){
      inputX = Math.round( e.changedTouches[0].pageX );
    }
    if(inputY === undefined){
      inputY = Math.round( e.changedTouches[0].pageY );
    }else{
      e.preventDefault();
    }

    //Find the current resizer being clicked
    if(Resizeable.currentResizer == null){
      for(let i= 0; i < Resizeable.activeResizers.length; i++){
        if(Resizeable.activeResizers[i].getDiv() === e.target){
          Resizeable.currentResizer = Resizeable.activeResizers[i];
        }
      }
    }

    if(Resizeable.currentResizer.isHorizontal){
      //Change size of left window
      Resizeable.currentResizer.leftWindow.resize(Resizeable.Sides.RIGHT, inputX);
      //Change the size of the right window
      Resizeable.currentResizer.getDiv().style.left = Resizeable.currentResizer.leftWindow.getDiv().style.width;
      Resizeable.currentResizer.rightWindow.resize(Resizeable.Sides.LEFT, parseInt(Resizeable.currentResizer.getDiv().style.left));
    }else{
      //Change size of the top window
      Resizeable.currentResizer.topWindow.resize(Resizeable.Sides.BOTTOM, inputY);
      //Change size of the bottom window and move resizer
      Resizeable.currentResizer.getDiv().style.top = Resizeable.currentResizer.topWindow.getDiv().style.height;
      Resizeable.currentResizer.bottomWindow.resize(Resizeable.Sides.TOP, parseInt(Resizeable.currentResizer.getDiv().style.top));
    }

  }

  cancelResize(){
    window.removeEventListener("mousemove", Resizeable.currentResizer.resize);
    window.removeEventListener("mouseup", Resizeable.currentResizer.cancelResize);

    window.removeEventListener("touchmove", Resizeable.currentResizer.resize);
    window.removeEventListener("touchend", Resizeable.currentResizer.cancelResize);
    Resizeable.currentResizer = null;
    Resizeable.resizingEnded();
  }

};
