{BSNullOptimization=objectThatDelegatesTo(OMeta,{
"setHelped":function(){var $elf=this,_fromIdx=this.input.idx;return (this["_didSomething"]=true)},
"helped":function(){var $elf=this,_fromIdx=this.input.idx;return this._pred(this["_didSomething"])},
"trans":function(){var $elf=this,_fromIdx=this.input.idx,t,ans;this._form((function(){t=this._apply("anything");this._pred((this[t] != undefined));return ans=this._applyWithArgs("apply",t)}));return ans},
"optimize":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");this._apply("helped");return x},
"App":function(){var $elf=this,_fromIdx=this.input.idx,rule,args;rule=this._apply("anything");args=this._many((function(){return this._apply("anything")}));return ["App",rule].concat(args)},
"Act":function(){var $elf=this,_fromIdx=this.input.idx,expr;expr=this._apply("anything");return ["Act",expr]},
"Pred":function(){var $elf=this,_fromIdx=this.input.idx,expr;expr=this._apply("anything");return ["Pred",expr]},
"Or":function(){var $elf=this,_fromIdx=this.input.idx,xs;xs=this._many((function(){return this._apply("trans")}));return ["Or"].concat(xs)},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,xs;xs=this._many((function(){return this._apply("trans")}));return ["XOr"].concat(xs)},
"And":function(){var $elf=this,_fromIdx=this.input.idx,xs;xs=this._many((function(){return this._apply("trans")}));return ["And"].concat(xs)},
"Opt":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Opt",x]},
"Many":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Many",x]},
"Many1":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Many1",x]},
"Set":function(){var $elf=this,_fromIdx=this.input.idx,n,v;n=this._apply("anything");v=this._apply("trans");return ["Set",n,v]},
"Not":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Not",x]},
"Lookahead":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Lookahead",x]},
"Form":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["Form",x]},
"ConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["ConsBy",x]},
"IdxConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;x=this._apply("trans");return ["IdxConsBy",x]},
"JumpTable":function(){var $elf=this,_fromIdx=this.input.idx,c,e,ces;ces=this._many((function(){this._form((function(){c=this._apply("anything");return e=this._apply("trans")}));return [c,e]}));return ["JumpTable"].concat(ces)},
"Interleave":function(){var $elf=this,_fromIdx=this.input.idx,m,p,xs;xs=this._many((function(){this._form((function(){m=this._apply("anything");return p=this._apply("trans")}));return [m,p]}));return ["Interleave"].concat(xs)},
"Rule":function(){var $elf=this,_fromIdx=this.input.idx,name,ps,ls,body;name=this._apply("anything");ps=this._apply("anything");ls=this._apply("anything");body=this._apply("trans");return ["Rule",name,ps,ls,body]}});(BSNullOptimization["initialize"]=(function (){(this["_didSomething"]=false)}));BSAssociativeOptimization=objectThatDelegatesTo(BSNullOptimization,{
"And":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}),(function(){xs=this._applyWithArgs("transInside","And");return ["And"].concat(xs)}))},
"Or":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}),(function(){xs=this._applyWithArgs("transInside","Or");return ["Or"].concat(xs)}))},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}),(function(){xs=this._applyWithArgs("transInside","XOr");return ["XOr"].concat(xs)}))},
"transInside":function(t){var $elf=this,_fromIdx=this.input.idx,xs,ys,x;return this._or((function(){this._form((function(){this._applyWithArgs("exactly",t);return xs=this._applyWithArgs("transInside",t)}));ys=this._applyWithArgs("transInside",t);this._apply("setHelped");return xs.concat(ys)}),(function(){x=this._apply("trans");xs=this._applyWithArgs("transInside",t);return [x].concat(xs)}),(function(){return []}))}});BSPushDownSet=objectThatDelegatesTo(BSNullOptimization,{
"Set":function(){var $elf=this,_fromIdx=this.input.idx,n,xs,y,v;return this._or((function(){n=this._apply("anything");this._form((function(){this._applyWithArgs("exactly","And");xs=this._many((function(){return this._applyWithArgs("notLast","trans")}));return y=this._apply("trans")}));this._apply("setHelped");return ["And"].concat(xs).concat([["Set",n,y]])}),(function(){n=this._apply("anything");v=this._apply("trans");return ["Set",n,v]}))}});BSSeqInliner=objectThatDelegatesTo(BSNullOptimization,{
"App":function(){var $elf=this,_fromIdx=this.input.idx,s,cs,rule,args;return this._or((function(){return (function(){switch(this._apply('anything')){case "seq":return (function(){s=this._apply("anything");this._apply("end");cs=this._applyWithArgs("seqString",s);this._apply("setHelped");return ["And"].concat(cs).concat([["Act",s]])}).call(this);default: throw fail}}).call(this)}),(function(){rule=this._apply("anything");args=this._many((function(){return this._apply("anything")}));return ["App",rule].concat(args)}))},
"inlineChar":function(){var $elf=this,_fromIdx=this.input.idx,c;c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return ["App","exactly",c.toProgramString()]},
"seqString":function(){var $elf=this,_fromIdx=this.input.idx,s,cs;this._lookahead((function(){s=this._apply("anything");return this._pred(((typeof s) === "string"))}));return this._or((function(){this._form((function(){this._applyWithArgs("exactly","\"");cs=this._many((function(){return this._apply("inlineChar")}));return this._applyWithArgs("exactly","\"")}));return cs}),(function(){this._form((function(){this._applyWithArgs("exactly","\'");cs=this._many((function(){return this._apply("inlineChar")}));return this._applyWithArgs("exactly","\'")}));return cs}))}});(JumpTable=(function (choiceOp,choice){(this["choiceOp"]=choiceOp);(this["choices"]=({}));this.add(choice)}));(JumpTable["prototype"]["add"]=(function (choice){{var c=choice[(0)];var t=choice[(1)]};if(this["choices"][c]){if((this["choices"][c][(0)] == this["choiceOp"])){this["choices"][c].push(t)}else{(this["choices"][c]=[this["choiceOp"],this["choices"][c],t])}}else{(this["choices"][c]=t)}}));(JumpTable["prototype"]["toTree"]=(function (){{var r=["JumpTable"];var choiceKeys=ownPropertyNames(this["choices"])};for(var i=(0);(i < choiceKeys["length"]);(i+=(1))){r.push([choiceKeys[i],this["choices"][choiceKeys[i]]])};return r}));BSJumpTableOptimization=objectThatDelegatesTo(BSNullOptimization,{
"Or":function(){var $elf=this,_fromIdx=this.input.idx,cs;cs=this._many((function(){return this._or((function(){return this._applyWithArgs("jtChoices","Or")}),(function(){return this._apply("trans")}))}));return ["Or"].concat(cs)},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,cs;cs=this._many((function(){return this._or((function(){return this._applyWithArgs("jtChoices","XOr")}),(function(){return this._apply("trans")}))}));return ["XOr"].concat(cs)},
"quotedString":function(){var $elf=this,_fromIdx=this.input.idx,c,cs;this._lookahead((function(){return this._apply("string")}));this._form((function(){return (function(){switch(this._apply('anything')){case "\"":return (function(){cs=this._many((function(){c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return c}));return this._applyWithArgs("exactly","\"")}).call(this);case "\'":return (function(){cs=this._many((function(){c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return c}));return this._applyWithArgs("exactly","\'")}).call(this);default: throw fail}}).call(this)}));return cs.join("")},
"jtChoice":function(){var $elf=this,_fromIdx=this.input.idx,x,rest;return this._or((function(){this._form((function(){this._applyWithArgs("exactly","And");this._form((function(){this._applyWithArgs("exactly","App");this._applyWithArgs("exactly","exactly");return x=this._apply("quotedString")}));return rest=this._many((function(){return this._apply("anything")}))}));return [x,["And"].concat(rest)]}),(function(){this._form((function(){this._applyWithArgs("exactly","App");this._applyWithArgs("exactly","exactly");return x=this._apply("quotedString")}));return [x,["Act",x.toProgramString()]]}))},
"jtChoices":function(op){var $elf=this,_fromIdx=this.input.idx,c,jt;c=this._apply("jtChoice");jt=new JumpTable(op,c);this._many((function(){c=this._apply("jtChoice");return jt.add(c)}));this._apply("setHelped");return jt.toTree()}});BSOMetaOptimizer=objectThatDelegatesTo(OMeta,{
"optimizeGrammar":function(){var $elf=this,_fromIdx=this.input.idx,n,sn,rs;this._form((function(){this._applyWithArgs("exactly","Grammar");n=this._apply("anything");sn=this._apply("anything");return rs=this._many((function(){return this._apply("optimizeRule")}))}));return ["Grammar",n,sn].concat(rs)},
"optimizeRule":function(){var $elf=this,_fromIdx=this.input.idx,r;r=this._apply("anything");this._or((function(){return r=this._applyWithArgs("foreign",BSSeqInliner,'optimize',r)}),(function(){return this._apply("empty")}));this._many((function(){return this._or((function(){return r=this._applyWithArgs("foreign",BSAssociativeOptimization,'optimize',r)}),(function(){return r=this._applyWithArgs("foreign",BSJumpTableOptimization,'optimize',r)}),(function(){return r=this._applyWithArgs("foreign",BSPushDownSet,'optimize',r)}))}));return r}})}