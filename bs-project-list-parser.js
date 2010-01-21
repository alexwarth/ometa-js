ProjectListParser=BSJSParser.delegated({
"proj":function(){var $elf=this;return (function(){$elf._apply("spaces");return $elf._apply("iName")})()},
"projs":function(){var $elf=this,x,xs;return (function(){x=$elf._apply("proj");xs=$elf._many(function(){return (function(){$elf._apply("spaces");$elf._applyWithArgs("exactly",",");return $elf._apply("proj")})()});return [x].concat(xs)})()}})
