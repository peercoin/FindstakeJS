 // In case we forget to take out console statements. IE becomes very unhappy when we forget. Let's not make IE unhappy
if (typeof(console) === 'undefined') {
    var console = {}
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}	
window.AppLogger={};
window.AppLogger.log=function(s){
  if (window.AppLogger.el==null) window.AppLogger.el=document.getElementById("divresults");
	window.AppLogger.el.innerHTML = window.AppLogger.el.innerHTML + s;	
};
window.App={};
App.Staketemplate=null;

window.addEventListener("load", function() {  
  document.getElementById("actiongo").onclick = function(event) {
      if (event.currentTarget.innerHTML == "GO") {
        event.currentTarget.innerHTML = "STOP";
      } else {
        App.Staketemplate.Stop=true;
        event.currentTarget.innerHTML = "GO";
        App.Staketemplate=null;
        return false;
      }
      var inputBlockFromTime = document.getElementById("inpBlockFromTime").value;
      var inputStakeModifier = document.getElementById("inpStakeModifier").value;	
      var inputOffsetInBlock = document.getElementById("inpPrevTxOffset").value;		
      var inputTime = document.getElementById("inpPrevTxTime").value;
      var inputVal = document.getElementById("inpPrevTxOutValue").value;	
      var inputIndex = document.getElementById("inpPrevTxOutIndex").value;	
      var diffInput = document.getElementById("inpDifficulty").value;	
      var startstr = document.getElementById("inpTxTime").value;	      
      var endstr = document.getElementById("inpDays").value;	 
      
      if (App.Staketemplate==null)
      {			      
  	    
      
        var tpldata = {
          BlockFromTime: parseInt(inputBlockFromTime, 10),
          StakeModifier: new BigInteger(''+inputStakeModifier,10),
          PrevTxOffset: parseInt(inputOffsetInBlock, 10),
          PrevTxTime: parseInt(inputTime, 10),
          PrevTxOutIndex: parseInt(inputIndex, 10),
          PrevTxOutValue: parseInt(inputVal, 10),		          
          TxTime: parseInt(startstr, 10)		
        }	      
        App.Staketemplate = new StakeKernelTemplate(tpldata);
        App.Staketemplate.SetBitsWithDifficulty(parseFloat(diffInput));        

        App.Staketemplate.findStake((Date.now() / 1000 | 0)+3600*24* parseInt(endstr, 10));
      }  
  
      return false;
  };
});
