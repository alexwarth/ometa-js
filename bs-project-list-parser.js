ProjectListParser=objectThatDelegatesTo(BSJSParser,{
"proj":function(){var $elf=this,_fromIdx=this.input.idx;this._apply("spaces");return this._apply("iName")},
"projs":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;x=this._apply("proj");xs=this._many((function(){this._apply("spaces");this._applyWithArgs("exactly",",");return this._apply("proj")}));return [x].concat(xs)}})