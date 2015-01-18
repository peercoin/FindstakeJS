/////////////////////////////////////////////////////////////////////////////////////////////////
//peercoin
/////////////////////////////////////////////////////////////////////////////////////////////////
(function () {
	var day           	= 60 * 60 * 24;
	var stakeMaxAge 	= 90 * day;
	var coin         	= 1000000;
	var coinDay     	= coin * day;
	 
	var StakeKernelTemplate = window.StakeKernelTemplate = function StakeKernelTemplate(tpl) {
		this.BlockFromTime = tpl.BlockFromTime;// int64
		this.StakeModifier = tpl.StakeModifier; //uint64
		this.PrevTxOffset = tpl.PrevTxOffset; //uint32
		this.PrevTxTime = tpl.PrevTxTime;    //int64
		this.PrevTxOutIndex = tpl.PrevTxOutIndex; //uint32
		this.PrevTxOutValue = tpl.PrevTxOutValue; //int64
		this.IsProtocolV03 = tpl.IsProtocolV03; //bool
		this.StakeMinAge = tpl.StakeMinAge;   //int64
		this.Bits = tpl.Bits;          //uint32
		this.TxTime = tpl.TxTime;//(Date.now() / 1000 | 0);        //int64
		this.Stop=false;
	};
	StakeKernelTemplate.prototype.SetBitsWithDifficulty = function (diff) {
		this.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
	}
	StakeKernelTemplate.prototype.CheckStakeKernelHash = function () {
		//var success = false;
		//var minTarget=0;
		var retobj = {};
		retobj.success=false;
		retobj.minTarget=0;
		retobj.hash=[];
		
		if (this.TxTime < this.PrevTxTime) { // Transaction timestamp violation
			console.log("CheckStakeKernelHash() : nTime violation");
			return retobj;
		}
		if (this.BlockFromTime+this.StakeMinAge > this.TxTime) { // Min age requirement
			console.log("CheckStakeKernelHash() : min age violation");
			return retobj;
		}
		var bnTargetPerCoinDay = Mint.CompactToBig(this.Bits);
		var timeReduction
		if (this.IsProtocolV03) {
			timeReduction = this.StakeMinAge
		} else {
			timeReduction = 0;
		}		
		var nTimeWeight = this.TxTime - this.PrevTxTime;// int64
		if (nTimeWeight > stakeMaxAge) {
			nTimeWeight = stakeMaxAge;
		}
		nTimeWeight -= timeReduction;	
		
		var bnCoinDayWeight;// *big.Int
		var valueTime = this.PrevTxOutValue * nTimeWeight;
		if (valueTime > 0) { // no overflow
			bnCoinDayWeight = new BigInteger(''+(valueTime / coinDay),10);
			//bnCoinDayWeight = new(big.Int).SetInt64(valueTime / coinDay)
		} else {
			// overflow, calc w/ big.Int or return error?
			// err = errors.New("valueTime overflow")
			// return
			var t1=new BigInteger(''+(24*60*60),10);
			var t2=new BigInteger(''+(coin),10);
			var t3=new BigInteger(''+(this.PrevTxOutValue),10);
			var t4=new BigInteger(''+(nTimeWeight),10);
			bnCoinDayWeight = ((t3.multiply(t4)).divide(t2)).divide(t1);			
		}
		var targetInt = bnCoinDayWeight.multiply(bnTargetPerCoinDay);// new(big.Int).Mul(bnCoinDayWeight, bnTargetPerCoinDay)		
		var buf = new Uint8Array(28);
		var o=0;

		if (this.IsProtocolV03) { // v0.3 protocol
			var d = this.StakeModifier;
			for (var i = 0; i < 8; i++) {
				buf[o] = (d & 0xff);
				d >>= 8;
				o++;
			}
		} else { // v0.2 protocol
			var d = t.Bits;
			for (var i = 0; i < 4; i++) {
				buf[o] = (d & 0xff);
				d >>= 8;
				o++;
			}
		}
		var data = new Uint32Array([this.BlockFromTime, this.PrevTxOffset, this.PrevTxTime, this.PrevTxOutIndex, this.TxTime]);
		for (var k = 0, arrayLength = data.length; k < arrayLength; k++) {
		    var d = data[k];
			for (var i = 0; i < 4; i++) {
				buf[o] = (d & 0xff);
				d >>= 8;
				o++;
			}
		}
		
		var hashProofOfStake = SHA256.doubleSha256(buf); 
		var buf2 = hashProofOfStake.slice();
		//var buf2 = hashProofOfStake;
		for (var i=0, l=buf2.length; i < l/2; i++ ){
		    var t1 = buf2[i], t2 = buf2[l-1-i];
			buf2[i] = t2;
			buf2[l-1-i] = t1;
		}
		var	hashProofOfStakeInt = BigInteger.fromByteArrayUnsigned(buf2);//new(big.Int).SetBytes(buf)
		if (hashProofOfStakeInt.compareTo(targetInt) > 0) {
			return retobj;
		}

		retobj.minTarget= hashProofOfStakeInt.divide(bnCoinDayWeight).subtract(BigInteger.ONE);
	    retobj.success = true;
		retobj.hash=hashProofOfStake;
		return retobj;		
	}

	StakeKernelTemplate.prototype.findStake = function(maxTime){
		maxTime = (maxTime <= this.TxTime) ? (this.TxTime)+3600 : maxTime;
		
		
		
		/*		
		this.BlockFromTime = tpl.BlockFromTime;// int64
		this.StakeModifier = tpl.StakeModifier; //uint64
		this.PrevTxOffset = tpl.PrevTxOffset; //uint32
		this.PrevTxTime = tpl.PrevTxTime;    //int64
		this.PrevTxOutIndex = tpl.PrevTxOutIndex; //uint32
		this.PrevTxOutValue = tpl.PrevTxOutValue; //int64
		this.IsProtocolV03 = tpl.IsProtocolV03; //bool
		this.StakeMinAge = tpl.StakeMinAge;   //int64
		this.Bits = tpl.Bits;          //uint32
		this.TxTime = tpl.TxTime;//(Date.now() / 1000 | 0);        //int64		
	
		
		
		console.log("CHECK  ...https://bkchain.org/ppc/tx/...");
		
		this.BlockFromTime= utx.BlockTime;
		this.StakeModifier=utx.StakeModifier;
		this.PrevTxOffset=utx.OffsetInBlock;
		this.PrevTxTime=utx.Time;
		this.PrevTxOutIndex= outPointIndex;
		this.PrevTxOutValue= (utx.Value);	
		this.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
		 	*/
		var breakie = false, res=document.getElementById("divresults");
		res.innerHTML = '<p>busy</p>';
		var getfindStakeOnce = function(obj){
			var that=obj; 
			var findStakeOnce=function(){
				var res=document.getElementById("divresults");
				var resultobj = that.CheckStakeKernelHash();//{succes: succes, minTarget:minTarget}
				if (resultobj.succes){
					var	comp = Mint.IncCompact(Mint.BigToCompact(resultobj.minTarget));
					var maximumDiff = Mint.CompactToDiff(comp);
					var newDate = new Date();
					newDate.setTime(that.TxTime*1000);
					var dateString = newDate.toUTCString();
					res.innerHTML = res.innerHTML +'<p>MINT '+dateString+ " "+ maximumDiff+'</p>';
				}		
			
				that.TxTime++;
				if (!that.Stop && that.TxTime < maxTime) {
					setTimeout(findStakeOnce, 50);
				}else
					res.innerHTML = res.innerHTML +'<p>done</p>';	
				
				res.innerHTML = res.innerHTML +'. ';			
		
			};
			return findStakeOnce;
		}(this);
		
		setTimeout(getfindStakeOnce, 50);		
	}
	
})()