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
		this.StakeModifier = tpl.StakeModifier; //uint64  => BigInteger!!!
		this.PrevTxOffset = tpl.PrevTxOffset; //uint32
		this.PrevTxTime = tpl.PrevTxTime;    //int64
		this.PrevTxOutIndex = tpl.PrevTxOutIndex; //uint32
		this.PrevTxOutValue = tpl.PrevTxOutValue; //int64
    
		this.IsProtocolV03 = ('IsProtocolV03' in tpl) ? tpl.IsProtocolV03 : true;//bool
		this.StakeMinAge = ('StakeMinAge' in tpl) ? tpl.StakeMinAge : 2592000; //int64
		this.Bits = ('Bits' in tpl) ? tpl.Bits : this.SetBitsWithDifficulty(parseFloat("10.33")); //uint32 
		this.TxTime = ('TxTime' in tpl) ? tpl.TxTime : (Date.now() / 1000 | 0); //int64
		
		this.Stop=false;
	};
	StakeKernelTemplate.prototype.SetBitsWithDifficulty = function (diff) {
		this.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
	}
  StakeKernelTemplate.prototype.arraysEqual= function arraysEqual(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length != b.length) return false;

      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
  }
  
  
	StakeKernelTemplate.prototype.CheckStakeKernelHash = function () {

		var retobj = {};
		retobj.success=false;
		retobj.minTarget=0;
		retobj.hash=[];
		
		if (this.TxTime < this.PrevTxTime) { // Transaction timestamp violation
			AppLogger.log("CheckStakeKernelHash() : nTime violation");
			return retobj;
		}
		if (this.BlockFromTime+this.StakeMinAge > this.TxTime) { // Min age requirement
			AppLogger.log("CheckStakeKernelHash() : min age violation");
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
			bnCoinDayWeight = new BigInteger(''+(Math.floor(valueTime / coinDay)),10);
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
		var buf = [0,0,0,0,0,0,0,
                0,0,0,0,0,0,0,
                0,0,0,0,0,0,0,
                0,0,0,0,0,0,0];// new Array(28);// new Uint8Array(28);
		var o=0;

		if (this.IsProtocolV03) { // v0.3 protocol
      var d = this.StakeModifier.toByteArrayUnsigned().reverse();      
			for (var i = 0; i < 8; i++) {
				buf[o] = d[i];
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
		var data = [this.BlockFromTime, this.PrevTxOffset, this.PrevTxTime, this.PrevTxOutIndex, this.TxTime];
		for (var k = 0, arrayLength = data.length; k < arrayLength; k++) {
		    var d = data[k];
			for (var i = 0; i < 4; i++) {
				buf[o] = (d & 0xff);
				d >>= 8;
				o++;
			}
		}
		var hashProofOfStake = (Crypto.SHA256(Crypto.SHA256(buf, { asBytes: true }), { asBytes: true })).reverse();

		var	hashProofOfStakeInt = BigInteger.fromByteArrayUnsigned(hashProofOfStake);
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
		console.log("CHECK  ...https://bkchain.org/ppc/tx/...");
		 
		this.Bits = Mint.BigToCompact(Mint.DiffToTarget(diff));
		 	*/
      
		var breakie = false;
		AppLogger.log('<p>busy</p>');
    
		var getfindStakeOnce = function(obj){
			var that=obj; 
			var findStakeOnce=function(){				 
				var resultobj = that.CheckStakeKernelHash();//{succes: succes, hash, minTarget:minTarget}
				if (resultobj.success){
					var	comp = Mint.IncCompact(Mint.BigToCompact(resultobj.minTarget));
					var maximumDiff = Mint.CompactToDiff(comp);
					var dateString = new Date(that.TxTime*1000).toUTCString();
          AppLogger.log('<p>MINT@ '+dateString+ " "+ maximumDiff+'</p>');					
				}		
			
				that.TxTime++;
				if (!that.Stop && that.TxTime < maxTime) {
					setTimeout(findStakeOnce, 50);
				}else
        		AppLogger.log('<p>done</p>');
           
        AppLogger.log('. ');
			};
			return findStakeOnce;
		}(this);
		
		setTimeout(getfindStakeOnce, 50);		
	}
	
})()