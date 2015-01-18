(function (globals) {

	var day           	= 60 * 60 * 24;
	var stakeMaxAge 	= 90 * day;
	var coin         	= 1000000;
	var coinDay     	= coin * day;
	
	function DiffToTarget(diff) {
		var mantissa = 0x0000ffff / diff;
		var exp = 1;
		var tmp = mantissa;
		while (tmp >= 256.0) {
			tmp /= 256.0;
			exp++;
		}
		for (var i = 0; i < exp; i++) {
			mantissa *= 256.0;
		}
		var	bn = new BigInteger(''+mantissa,10);
		bn = bn.shiftLeft((26-exp)*8);
		return bn;
	}
	function IncCompact(compact) {
		var mantissa = compact & 0x007fffff;
		var neg = compact & 0x00800000;
		var exponent = (compact >> 24);

		if (exponent <= 3) {
			mantissa += (1 << (8 * (3 - exponent)));
		} else {
			mantissa++;
		}

		if (mantissa >= 0x00800000) {
			mantissa >>= 8;
			exponent++;
		}
		return (exponent<<24) | mantissa | neg;
	}
		
	// BigToCompact converts a whole number N to a compact representation using
	// an unsigned 32-bit number.  The compact representation only provides 23 bits
	// of precision, so values larger than (2^23 - 1) only encode the most
	// significant digits of the number.  See CompactToBig for details.
	function BigToCompact(n)  {
		// No need to do any work if it's zero.
		if (n.equals(BigInteger.ZERO) ) {
			return 0;
		}

		// Since the base for the exponent is 256, the exponent can be treated
		// as the number of bytes.  So, shift the number right or left
		// accordingly.  This is equivalent to:
		// mantissa = mantissa / 256^(exponent-3)
		var mantissa;// uint32   var	mantissa = compact & 0x007fffff,

		var exponent = n.toByteArrayUnsigned().length;
		if (exponent <= 3) {
			mantissa = n.and(new BigInteger('4294967295',10)).intValue();			
			mantissa <<= 8 * (3 - exponent);
		} else {
			// Use a copy to avoid modifying the caller's original number.			
			var tn = new BigInteger(n.toString(),10);			
			mantissa = tn.shiftRight(8*(exponent-3)).and(new BigInteger('4294967295',10)).intValue();
		}

		// When the mantissa already has the sign bit set, the number is too
		// large to fit into the available 23-bits, so divide the number by 256
		// and increment the exponent accordingly.
		if ((mantissa&0x00800000) != 0) {
			mantissa >>= 8;
			exponent++;
		}

		// Pack the exponent, sign bit, and mantissa into an unsigned 32-bit
		// int and return it.
		var compact = ((exponent<<24) | mantissa);

		if (n.compareTo(BigInteger.ZERO) < 0){
			compact |= 0x00800000
		}
		return compact;
	}
	function CompactToDiff(bits) {
		var nShift = (bits >> 24) & 0xff;
		var diff = 1.0 * (0x0000ffff) / (bits&0x00ffffff);
		for (var n=0; nShift < 29; nShift++) {
			diff *= 256.0;
		}
		for (var n=0; nShift > 29; nShift-- ){
			diff /= 256.0;
		}
		return diff;
	}
	///////////////////////////////////////////////////////////////////////////////////////////////
	// CompactToBig converts a compact representation of a whole number N to an
	// unsigned 32-bit number.  The representation is similar to IEEE754 floating
	// point numbers.
	//
	// Like IEEE754 floating point, there are three basic components: the sign,
	// the exponent, and the mantissa.  They are broken out as follows:
	//
	//	* the most significant 8 bits represent the unsigned base 256 exponent
	// 	* bit 23 (the 24th bit) represents the sign bit
	//	* the least significant 23 bits represent the mantissa
	//
	//	-------------------------------------------------
	//	|   Exponent     |    Sign    |    Mantissa     |
	//	-------------------------------------------------
	//	| 8 bits [31-24] | 1 bit [23] | 23 bits [22-00] |
	//	-------------------------------------------------
	//
	// The formula to calculate N is:
	// 	N = (-1^sign) * mantissa * 256^(exponent-3)
	//
	// This compact form is only used in bitcoin to encode unsigned 256-bit numbers
	// which represent difficulty targets, thus there really is not a need for a
	// sign bit, but it is implemented here to stay consistent with bitcoind.
	function CompactToBig(compact){
		// Extract the mantissa, sign bit, and exponent.
		var	mantissa = compact & 0x007fffff,
		isNegative = (compact&0x00800000) != 0,
		exponent = (compact >> 24) >>> 0;
		
		// Since the base for the exponent is 256, the exponent can be treated
		// as the number of bytes to represent the full 256-bit number.  So,
		// treat the exponent as the number of bytes and shift the mantissa
		// right or left accordingly.  This is equivalent to:
		// N = mantissa * 256^(exponent-3)
		var bn;
		if (exponent <= 3) {
			mantissa >>= 8 * (3 - exponent)
			bn = new BigInteger(''+mantissa,10);
		} else {
			bn = new BigInteger(''+mantissa,10);
			bn = bn.shiftLeft(8*(exponent-3));
		}	
		// Make it negative if the sign bit is set.
		if (isNegative) {
			bn = bn.multiply(new BigInteger('-1',10));
		}

		return bn;	 
	}

globals.Mint = {
  DiffToTarget:DiffToTarget,
  IncCompact:IncCompact,
  BigToCompact:BigToCompact,
  CompactToDiff:CompactToDiff,
  CompactToBig:CompactToBig
};


}(window));