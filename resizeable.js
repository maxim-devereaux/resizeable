
import { resizeableClasses, resizeableLang } from './include/config.js'
import { resizeableTranslations } from './include/lang.js'

export const Resizeable = {};

Resizeable.language = null;
Resizeable.activeContentWindows = [];
Resizeable.activeResizers = [];
Resizeable.contentModules = [];
Resizeable.availableModules = [];
Resizeable.currentResizer = null;
Resizeable.contentWindowSeq = 0;
Resizeable.resizerSeq = 0;
Resizeable.layoutName = '';
Resizeable.exportFunc = null;

Resizeable.Sides = {
  TOP: "TOP",
  BOTTOM: "BOTTOM",
  LEFT: "LEFT",
  RIGHT: "RIGHT"
};

Resizeable.SupportedLang = resizeableLang;
Resizeable.Classes = resizeableClasses;

Resizeable.initialise = function( parentElem , options ){

  // Process options
  Resizeable.resizerThickness = ( options && options.separator && typeof options.separator === 'number' ) ? options.separator : 4;
  Resizeable.initialSizes = ( options && options.sizes && options.sizes instanceof Array) ? options.sizes : [];
  Resizeable.layoutName = ( options && options.name && typeof options.name === 'string' && options.name.length > 0 ) ? options.name : 'standard';
  Resizeable.exportFunc = ( options && options.export && typeof options.name === 'function' ) ? options.export : console.log;
  if( options && options.lang && typeof options.lang === 'string' && options.lang.length > 0 ) { Resizeable.language = Resizeable.SupportedLang.indexOf( options.lang ) !== -1 ? ( options.lang ) : 'en' }
  else { Resizeable.language = 'en' }

  let parentWindow = new Resizeable.ContentWindow(null, parseInt(parentElem.style.width, 10), parseInt(parentElem.style.height, 10), parentElem);
  Resizeable.setupChildren(parentWindow);

  window.addEventListener("click", ( event ) => {
    Resizeable.closeContextMenu( event );
  });

  window.addEventListener("blur", ( event ) => {
    Resizeable.closeContextMenu( event );
  });

  window.addEventListener("contextmenu", ( event ) => {
      Resizeable.handleContextMenu( event );
  });
};

Resizeable.layoutSize = function( width, height ) {
  if( Resizeable.activeContentWindows.length > 0 ) {
    Resizeable.activeContentWindows[0].changeSize( width, height );
    Resizeable.activeContentWindows[0].childrenResize();
  }
};

Resizeable.getTranslation = function( key ) {
    let transValue = null;
    if( resizeableTranslations[ Resizeable.language ] ) {
      transValue = resizeableTranslations[ Resizeable.language ][ key ];
    }
    if( transValue === null || transValue === undefined ) {
        transValue = resizeableTranslations['en'][ key ];
    }
    if( transValue === null || transValue === undefined ) {
        transValue = key
    }
    return transValue;
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

Resizeable.closeContextMenu = function(e) {
  let currElem = e.target, menuElem;
  // If there is a context menu visible
  menuElem = document.getElementsByClassName( Resizeable.Classes.CONTEXT_MENU );
  // If we didn't click inside the context menu
  if( menuElem.length > 0 && ( e.currentTarget === window || ( !currElem.classList.contains( Resizeable.Classes.CONTEXT_MENU ) && !currElem.classList.contains( Resizeable.Classes.CONTEXT_MENUITEM )))) {
    menuElem[0].remove();
  }
};

Resizeable.handleContextMenu = function(e) {
    Resizeable.closeContextMenu(e);
    let currElem = e.target, menuElem, cmenu = '';
    // If it is one of "our" elements
    if( currElem.id && ( currElem.classList.contains( Resizeable.Classes.CONTENT_WINDOW ) || currElem.classList.contains( Resizeable.Classes.RESIZER ))) {
        menuElem = document.getElementsByClassName( Resizeable.Classes.CONTEXT_MENU );
        if( menuElem.length === 0 ) {
            if( currElem.classList.contains( Resizeable.Classes.CONTENT_WINDOW )) {
                let thisWin = Resizeable.findWindow(currElem.id);
                if( thisWin.children.length === 0 ) {
                    if( thisWin.module === null ) {
                      cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="save">' + Resizeable.getTranslation( 'save' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitHL">' + Resizeable.getTranslation( 'splitH' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitVT">' + Resizeable.getTranslation( 'splitV' ) + '</a>\n' +
                          ( Resizeable.availableModules.length > 0 ? '<hr class="' + Resizeable.Classes.CONTEXT_DIVIDER + '" />' : '' );
                      // Option to add available modules
                      if( Resizeable.availableModules.length > 0 ) {
                        for (let i = 0; i < Resizeable.availableModules.length; i++) {
                          cmenu += '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="add" data-module="' +
                              Resizeable.availableModules[i].moduleId + '">' + Resizeable.getTranslation( 'add' ) + Resizeable.availableModules[i].moduleName[ Resizeable.language ] +'</a>\n';
                        }
                      }
                      cmenu += '</div>\n';
                    }
                    else {
                      cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="save">' + Resizeable.getTranslation( 'save' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitHL">' + Resizeable.getTranslation( 'splitHL' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitHR">' + Resizeable.getTranslation( 'splitHR' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitVT">' + Resizeable.getTranslation( 'splitVT' ) + '</a>\n' +
                          '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="splitVB">' + Resizeable.getTranslation( 'splitVB' ) + '</a>\n' +
                          '<hr class="' + Resizeable.Classes.CONTEXT_DIVIDER + '" />\n' + '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM +
                          '" href="#" data-win="' + currElem.id + '" data-value="remove">' + Resizeable.getTranslation( 'remove' ) + thisWin.module.moduleName[ Resizeable.language ] + '</a>\n</div>\n';
                    }
                }
                else {
                  cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + currElem.id + '" data-value="save">' + Resizeable.getTranslation( 'save' ) + '</a>\n</div>\n';
                }
            }
            else if( currElem.classList.contains( Resizeable.Classes.RESIZER )) {
              let thisBar = getResizerFromDiv( currElem.id );
              if( thisBar.isHorizontal) {
                if(( thisBar.leftWindow.module !== null || thisBar.leftWindow.children.length > 0 ) && ( thisBar.rightWindow.module !== null || thisBar.rightWindow.children.length > 0 )) {
                  cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="mergeL">' + Resizeable.getTranslation( 'mergeL' ) + '</a>\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="mergeR">' + Resizeable.getTranslation( 'mergeR' ) + '</a>\n</div>\n';
                }
                else {
                  cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="' +
                      (( thisBar.rightWindow.module !== null || thisBar.rightWindow.children.length > 0 ) ? 'mergeR' : 'mergeL' ) + '">' + Resizeable.getTranslation( 'merge' ) + '</a>\n</div>\n';
                }
              }
              else {
                if(( thisBar.topWindow.module !== null || thisBar.topWindow.children.length > 0 ) && ( thisBar.bottomWindow.module !== null || thisBar.bottomWindow.children.length > 0 )) {
                  cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="mergeT">' + Resizeable.getTranslation( 'mergeT' ) + '</a>\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="mergeB">' + Resizeable.getTranslation( 'mergeB' ) + '</a>\n</div>\n';
                }
                else {
                  cmenu = '<div class="' + Resizeable.Classes.CONTEXT_MENU + '">\n' +
                      '    <a class="' + Resizeable.Classes.CONTEXT_MENUITEM + '" href="#" data-win="' + thisBar.parent.divId + '" data-value="' +
                      (( thisBar.bottomWindow.module !== null || thisBar.bottomWindow.children.length > 0 ) ? 'mergeB' : 'mergeT' ) + '">' + Resizeable.getTranslation( 'merge' ) + '</a>\n</div>\n';
                }
              }
            }

            if( cmenu !== '' ) {
              document.body.insertAdjacentHTML( 'beforeend', cmenu );
              menuElem = document.getElementsByClassName( Resizeable.Classes.CONTEXT_MENU )[0];
              menuElem.style.display = "block";
              let elemSize = currElem.getBoundingClientRect()
              let menuSize = menuElem.getBoundingClientRect();
              menuElem.style.top = ( elemSize.top + elemSize.height / 2 - menuSize.height / 2 ).toString() + 'px';
              menuElem.style.left = ( elemSize.left + elemSize.width / 2 - menuSize.width / 2 ).toString() + 'px';
              menuElem.addEventListener( 'click', Resizeable.handleContextMenuClick );
              e.preventDefault();
            }
        }
    }
};

Resizeable.handleContextMenuClick = function( e ) {
    let currElem = e.target, actionWin = currElem.dataset.win, actionVal = currElem.dataset.value;
    let winElem= Resizeable.findWindow( actionWin );
    if( currElem.classList.contains( Resizeable.Classes.CONTEXT_MENUITEM )) {
        currElem.parentElement.remove();
        if( winElem ) {
            switch ( actionVal ) {
                case 'splitHL':
                case 'splitHR':
                case 'splitVT':
                case 'splitVB':
                    winElem.split( actionVal === 'splitHL' || actionVal === 'splitHR',
                                   actionVal === 'splitHL' || actionVal === 'splitVT' );
                    break;
                case 'mergeL':
                case 'mergeR':
                case 'mergeT':
                case 'mergeB':
                    if( winElem.children.length > 0 ) {
                      winElem.children[ actionVal === 'mergeL' || actionVal === 'mergeT' ? 1 : 0 ].destroy()
                    }
                    break;
                case 'add':
                    winElem.bindModule( currElem.dataset.module );
                    break;
                case 'remove':
                    winElem.unbindModule();
                    break;
                case 'save':
                    Resizeable.exportLayout();
                    break;
                default:
                    break;
            }
        }
    }
};

Resizeable.setModules = function( modArr ) {
    Resizeable.contentModules = [...modArr];
    Resizeable.availableModules = [...modArr];
};

function writeLayout ( parentElem, layoutObj, modules, sizes ) {
  let child0, child1;
  sizes[ parentElem.id ] = layoutObj.size;
  if( layoutObj.content !== undefined ) {
    child0 = Resizeable.Classes.CONTENT_WINDOW + Resizeable.nextContentWindowSeq();
    child1 = Resizeable.Classes.CONTENT_WINDOW + Resizeable.nextContentWindowSeq();
    if ( layoutObj.splitH ) {
      parentElem.insertAdjacentHTML('beforeend', '<div class="rsz-left" id="' + child0 + '"></div><div class="rsz-right" id="' + child1 + '"></div>' )
    }
    else if ( layoutObj.splitV ) {
      parentElem.insertAdjacentHTML('beforeend', '<div class="rsz-top" id="' + child0 + '"></div><div class="rsz-bottom" id="' + child1 + '"></div>' )
    }
    writeLayout( document.getElementById( child0 ), layoutObj.content[0], modules, sizes );
    writeLayout( document.getElementById( child1 ), layoutObj.content[1], modules, sizes );
  }
  else if ( layoutObj.module !== undefined ) {
    modules.push( { win: parentElem.id, module: layoutObj.module })
  }
}

Resizeable.importLayout = function ( layout ) {
  let layoutObj, tempModules= [], tempSizes= {};
  layoutObj = ( typeof layout === 'string' ) ? JSON.parse( layout ) : layout;

  if (Resizeable.activeContentWindows.length > 0) {
    let tempDiv = Resizeable.activeContentWindows[0].divId;
    let mainWin= document.getElementById(tempDiv), tgtWin;
    if( mainWin ) {

      // Clear resizer attributes
      Resizeable.activeContentWindows = [];
      Resizeable.activeResizers = [];
      Resizeable.availableModules = [ ...Resizeable.contentModules ];
      Resizeable.currentResizer = null;
      Resizeable.contentWindowSeq = 0;
      Resizeable.resizerSeq = 0;

      // Empty the initial container
      let newWin = document.createElement('div');
      newWin.id = tempDiv;
      mainWin.replaceWith( newWin );
      newWin.style.width = ( layoutObj.width ?? Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0 )) + 'px';
      newWin.style.height = ( layoutObj.height ?? Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0 )) + 'px';

      // Now process the new layout
      tempSizes[ tempDiv ] = layoutObj.size;
      writeLayout( newWin, layoutObj, tempModules, tempSizes );
      Resizeable.initialise( newWin, Resizeable.language, Resizeable.layoutName, Resizeable.exportFunc, tempSizes, Resizeable.resizerThickness );

      // Assign all modules
      for( let i=0; i < tempModules.length; i++ ) {
        tgtWin = Resizeable.findWindow( tempModules[i].win );
        if( tgtWin ) {
          tgtWin.bindModule( tempModules[i].module )
        }
      }
    }
  }
};

function readLayout ( currWin ) {
  let layout = { splitH: currWin.isSplitHorizontally, splitV: currWin.isSplitVertically, size: currWin.sizeFractionOfParent };

  if( currWin.children.length > 0 ) {
    layout.content = [ readLayout( currWin.children[0] ), readLayout( currWin.children[1] ) ];
  }
  else if ( currWin.module !== null ) {
    layout.module = currWin.module.moduleId;
  }
  return layout
}

Resizeable.exportLayout = function () {
  let layout = {};
  if( Resizeable.exportFunc !== undefined && Resizeable.exportFunc !== null && typeof Resizeable.exportFunc === 'function' ) {
    if (Resizeable.activeContentWindows.length > 0) {
      layout = readLayout( Resizeable.activeContentWindows[0] );
    }
    layout.layoutName = Resizeable.layoutName;
    layout.width = Resizeable.activeContentWindows[0].width;
    layout.height = Resizeable.activeContentWindows[0].height;
    Resizeable.exportFunc( JSON.stringify( layout ));
  }
};

Resizeable.nextContentWindowSeq = function() {
  return ++Resizeable.contentWindowSeq;
};

Resizeable.nextResizerSeq = function() {
  return ++Resizeable.resizerSeq;
};

Resizeable.ContentWindow = class {
  
  constructor(parent, width, height, div){
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.sizeFractionOfParent = 0.5;

    if(div === null){
      this.divId = Resizeable.Classes.CONTENT_WINDOW + Resizeable.nextContentWindowSeq();

      let div = document.createElement('div');
      div.id = this.divId;
      div.classList.add( Resizeable.Classes.CONTENT_WINDOW );

      //Insert the div with correct ID into the parent window; or body if parent is null
      if(parent !== null){
        parent.getDiv().appendChild(div);
      }else{
        document.body.insertAdjacentHTML('afterbegin', div.outerHTML );
      }
    }
    else{
      if(div.id === "")
        div.id = Resizeable.Classes.CONTENT_WINDOW + Resizeable.nextContentWindowSeq();
      this.divId = div.id;
      this.getDiv().classList.add( Resizeable.Classes.CONTENT_WINDOW );
    }

    this.children = [];
    this.module = null;
    this.isSplitHorizontally = false;
    this.isSplitVertically = false;
    this.childResizer = null;
    this.minWidth = 50;
    this.minHeight = 50;
    this.originalMinSize = 50;
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
        } else{
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
    this.contentResize();
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

    this.contentResize();

    this.children[0].childrenResize();
    this.children[1].childrenResize();

    this.repositionChildResizer();

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

  bindModule( tgtModule ) {
    if ( this.module === null ) {
      const foundModules = Resizeable.availableModules.filter((module) => module.moduleId && module.moduleId === tgtModule );
      if( foundModules.length > 0 ) {
        this.module = {...foundModules[0]};
        Resizeable.availableModules.splice(Resizeable.availableModules.findIndex(e => e.moduleId === tgtModule),1);
        if( this.module.init !== undefined && this.module.init !== null && typeof this.module.init === 'function' ) {
          this.module.init( this.getDiv());
        }
      }
    }
  };

  unbindModule() {
    if ( this.module !== null ) {
      Resizeable.availableModules.push( this.module );
      if( this.module.uninit !== undefined && this.module.uninit !== null && typeof this.module.uninit === 'function' ) {
        this.module.uninit( this.getDiv());
      }
      this.module = null;
    }

    if( this.children.length > 0 ) {
      this.children[0].unbindModule();
      this.children[1].unbindModule();
    }
  };

  split( isHorizontal, existTopLeft ) {
    let currElem = this.getDiv(), elemContent;
    if( this.children.length > 0 || this.width < ( 2 * this.minWidth ) + Resizeable.resizerThickness ) {
      return
    }
    if( isHorizontal ) {
      elemContent = '<div class="' + Resizeable.Classes.WINDOW_LEFT + '">' + ( existTopLeft ? currElem.innerHTML : '' ) +
          '</div><div class="' + Resizeable.Classes.WINDOW_RIGHT + '">' + ( existTopLeft ? currElem.innerHTML : '' ) + '</div>'
    }
    else {
      elemContent = '<div class="' + Resizeable.Classes.WINDOW_TOP + '">' + ( existTopLeft ? '' : currElem.innerHTML ) +
          '</div><div class="' + Resizeable.Classes.WINDOW_BOTTOM + '">' + ( existTopLeft ? '' : currElem.innerHTML ) + '</div>'
    }
    currElem.innerHTML = elemContent;
    Resizeable.setupChildren( this );
    if( this.module !== null ) {
      this.children[ existTopLeft ? 0 : 1 ].module = { ...this.module };
      this.module = null;
      this.children[ existTopLeft ? 0 : 1 ].contentResize()
    }
  };

  destroy() {
    let elemContent, sibWin, parentWin, removeResizer;
    this.unbindModule();
    sibWin = this.getSibling();
    if( sibWin !== null ) { elemContent = document.getElementById(sibWin.getDivId()).innerHTML }

    parentWin = this.parent;
    if( parentWin ) {
      removeResizer = this.parent.childResizer;
      removeResizer.getDiv().parentNode.removeChild(removeResizer.getDiv());
      for (let i = 0; i < Resizeable.activeResizers.length; i++) {
        if (Resizeable.activeResizers[i] === removeResizer) {
          Resizeable.activeResizers.splice(i, 1);
          break
        }
      }

      parentWin.getDiv().innerHTML = elemContent;
      if (sibWin.module !== null) {
        parentWin.module = {...sibWin.module};
        sibWin.module = null;
        parentWin.contentResize()
      }

      if (parentWin.isSplitHorizontally) {
        parentWin.isSplitHorizontally = false;
      } else if (parentWin.isSplitVertically) {
        parentWin.isSplitVertically = false;
      }
      if (sibWin.children.length > 0) {
        parentWin.children = sibWin.children;
        parentWin.childResizer = sibWin.childResizer;
        parentWin.isSplitHorizontally = sibWin.isSplitHorizontally;
        parentWin.isSplitVertically = sibWin.isSplitVertically;
        parentWin.children[0].parent = parentWin;
        parentWin.children[1].parent = parentWin;
        if (parentWin.isSplitHorizontally) {
          parentWin.leftWindow = parentWin.children[0];
          parentWin.rightWindow = parentWin.children[1]
        } else if (parentWin.isSplitVertically) {
          parentWin.topWindow = parentWin.children[0];
          parentWin.bottomWindow = parentWin.children[1]
        }
        parentWin.childResizer.parent = parentWin;
      } else {
        parentWin.children = [];
        parentWin.childResizer = null
      }
    }

    for (let i= Resizeable.activeContentWindows.length; i >= 0; --i ) {
      if (Resizeable.activeContentWindows[i] === this ) {
        Resizeable.activeContentWindows.splice(i, 1);
        break
      }
    }

    if( sibWin !== null ) {
      for (let i= Resizeable.activeContentWindows.length; i >= 0; --i ) {
        if (Resizeable.activeContentWindows[i] === sibWin ) {
          Resizeable.activeContentWindows.splice(i, 1);
          break
        }
      }
    }

    if( parentWin && parentWin.children.length > 0 ) {
      parentWin.childrenResize()
    }
  }

  contentResize() {
    if( this.module !== null ) {
      if( this.module.resize !== undefined && this.module.resize !== null && typeof this.module.resize === 'function' ) {
        this.module.resize( this.getDiv());
      }
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

  if (parentWindow.parent !== null) {
    parentWindow.calculateSizeFractionOfParent();
    parentWindow.getSibling().calculateSizeFractionOfParent();
    siblingWindowErrorCorrect(parentWindow);
  }

  parentWindow.repositionChildResizer();
  parentWindow.contentResize();
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
  let elements = document.querySelectorAll('.' + Resizeable.Classes.RESIZER );
  if (elements) {
    elements.forEach(function(el){
      el.addEventListener('mousedown', resizerMouseDown);
      el.addEventListener('touchstart', resizerTouchStart);
    });
  }
}

function clearResizerEvents() {
  let elements = document.querySelectorAll('.' + Resizeable.Classes.RESIZER );
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

    this.divId = Resizeable.Classes.RESIZER + Resizeable.nextResizerSeq();

    let div= document.createElement('div');
    div.id = this.divId;
    div.classList.add( Resizeable.Classes.RESIZER );
    parent.getDiv().appendChild(div);

    if(this.isHorizontal){
      this.getDiv().classList.add( Resizeable.Classes.RESIZER_HORIZONTAL );
    }else{
      this.getDiv().classList.add( Resizeable.Classes.RESIZER_VERTICAL );
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

