ProjectListParser=objectThatDelegatesTo(BSJSParser,{
"proj":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._apply("spaces");return this._apply("iName")}).call(this)},
"projs":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return (function(){x=this._apply("proj");xs=this._many((function(){return (function(){this._apply("spaces");this._applyWithArgs("exactly",",");return this._apply("proj")}).call(this)}));return [x].concat(xs)}).call(this)}})
