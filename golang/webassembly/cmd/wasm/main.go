package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"math/big"
	"syscall/js"
)

// type TxOut struct {
// 	Value    int64
// 	PkScript []byte
// }

// type CoinStakeSource struct {
// 	BlockTime     int64
// 	StakeModifier uint64
// 	TxOffset      uint32
// 	TxTime        int64

// 	TxSha []byte

// 	Outputs map[string]*TxOut
// }

const (
	day         int   = 60 * 60 * 24
	stakeMaxAge int64 = 90 * int64(day)
	coin        int64 = 1000000
	coinDay     int64 = coin * int64(day)
)

func doubleSha256(b []byte) []byte {
	h1 := sha256.New()
	h1.Write(b)
	bs := h1.Sum(nil)

	h2 := sha256.New()
	h2.Write(bs)
	return h2.Sum(nil)
}

// CompactToBig converts a compact representation of a whole number N to an
// unsigned 32-bit number.  The representation is similar to IEEE754 floating
// point numbers.
//
// Like IEEE754 floating point, there are three basic components: the sign,
// the exponent, and the mantissa.  They are broken out as follows:
//
//   - the most significant 8 bits represent the unsigned base 256 exponent
//
//   - bit 23 (the 24th bit) represents the sign bit
//
//   - the least significant 23 bits represent the mantissa
//
//     -------------------------------------------------
//     |   Exponent     |    Sign    |    Mantissa     |
//     -------------------------------------------------
//     | 8 bits [31-24] | 1 bit [23] | 23 bits [22-00] |
//     -------------------------------------------------
//
// The formula to calculate N is:
//
//	N = (-1^sign) * mantissa * 256^(exponent-3)
//
// This compact form is only used in bitcoin to encode unsigned 256-bit numbers
// which represent difficulty targets, thus there really is not a need for a
// sign bit, but it is implemented here to stay consistent with bitcoind.
func CompactToBig(compact uint32) *big.Int {
	// Extract the mantissa, sign bit, and exponent.
	mantissa := compact & 0x007fffff
	isNegative := compact&0x00800000 != 0
	exponent := uint(compact >> 24)

	// Since the base for the exponent is 256, the exponent can be treated
	// as the number of bytes to represent the full 256-bit number.  So,
	// treat the exponent as the number of bytes and shift the mantissa
	// right or left accordingly.  This is equivalent to:
	// N = mantissa * 256^(exponent-3)
	var bn *big.Int
	if exponent <= 3 {
		mantissa >>= 8 * (3 - exponent)
		bn = big.NewInt(int64(mantissa))
	} else {
		bn = big.NewInt(int64(mantissa))
		bn.Lsh(bn, 8*(exponent-3))
	}

	// Make it negative if the sign bit is set.
	if isNegative {
		bn = bn.Neg(bn)
	}

	return bn
}

// func add(a, b int) int {

// 	return a + b
// }

// return "0" when false
func HasStakeKernelHash(
	blockFromTime int64,
	stakeModifier uint64,
	prevTxOffset uint32,
	prevTxTime int64,
	prevTxOutIndex uint32,
	prevTxOutValue int64,
	stakeMinAge int64, //2592000
	bits uint32,
	txTime int64) float32 {

	bnTargetPerCoinDay := CompactToBig(bits)
	var timeReduction int64

	timeReduction = stakeMinAge

	var nTimeWeight int64 = txTime - prevTxTime
	if nTimeWeight > stakeMaxAge {
		nTimeWeight = stakeMaxAge
	}
	nTimeWeight -= timeReduction

	var bnCoinDayWeight *big.Int
	valueTime := prevTxOutValue * nTimeWeight
	if valueTime > 0 { // no overflow
		bnCoinDayWeight = new(big.Int).SetInt64(valueTime / coinDay)
	} else {
		// overflow, calc w/ big.Int or return error?
		// err = errors.New("valueTime overflow")
		// return
		bnCoinDayWeight = new(big.Int).Div(new(big.Int).
			Div(
				new(big.Int).Mul(big.NewInt(prevTxOutValue), big.NewInt(nTimeWeight)),
				new(big.Int).SetInt64(coin)),
			big.NewInt(24*60*60))
	}
	targetInt := new(big.Int).Mul(bnCoinDayWeight, bnTargetPerCoinDay)

	buf := make([]byte, 28)
	o := 0

	d := stakeModifier
	for i := 0; i < 8; i++ {
		buf[o] = byte(d & 0xff)
		d >>= 8
		o++
	}

	data := [5]uint32{uint32(blockFromTime), uint32(prevTxOffset),
		uint32(prevTxTime), uint32(prevTxOutIndex), uint32(txTime)}
	for _, d := range data {
		for i := 0; i < 4; i++ {
			buf[o] = byte(d & 0xff)
			d >>= 8
			o++
		}
	}
	hashProofOfStake := doubleSha256(buf[:o])

	//fmt.Println(buf)
	//fmt.Println(hashProofOfStake)

	buf = hashProofOfStake
	for i, l := 0, len(buf); i < l/2; i++ {
		buf[i], buf[l-1-i] = buf[l-1-i], buf[i]
	}
	hashProofOfStakeInt := new(big.Int).SetBytes(buf)

	if hashProofOfStakeInt.Cmp(targetInt) > 0 {
		return -1
	}
	minTarget := new(big.Int).Sub(new(big.Int).Div(hashProofOfStakeInt, bnCoinDayWeight), big.NewInt(1))

	comp := IncCompact(BigToCompact(minTarget))
	maximumDiff := CompactToDiff(comp)

	return maximumDiff
}

type StakeKernelTemplate struct {
	BlockFromTime int64
	StakeModifier uint64
	PrevTxOffset  uint32
	PrevTxTime    int64

	PrevTxOutIndex uint32
	PrevTxOutValue int64

	//IsProtocolV03 bool
	StakeMinAge int64 //2592000
	Bits        uint32
	TxTime      int64
}

// func CheckStakeKernelHash(t *StakeKernelTemplate) (success bool, minTarget *big.Int) {
// 	//(hashProofOfStake []byte, success bool, err error, minTarget *big.Int) {
// 	success = false

// 	// if t.TxTime < t.PrevTxTime { // Transaction timestamp violation
// 	// 	//err = errors.New("CheckStakeKernelHash() : nTime violation")
// 	// 	return
// 	// }

// 	// if t.BlockFromTime+t.StakeMinAge > t.TxTime { // Min age requirement
// 	// 	//err = errors.New("CheckStakeKernelHash() : min age violation")
// 	// 	return
// 	// }

// 	bnTargetPerCoinDay := CompactToBig(t.Bits)
// 	var timeReduction int64
// 	// if t.IsProtocolV03 {
// 	timeReduction = t.StakeMinAge
// 	// } else {
// 	// 	timeReduction = 0
// 	// }

// 	var nTimeWeight int64 = t.TxTime - t.PrevTxTime
// 	if nTimeWeight > stakeMaxAge {
// 		nTimeWeight = stakeMaxAge
// 	}
// 	nTimeWeight -= timeReduction

// 	var bnCoinDayWeight *big.Int
// 	valueTime := t.PrevTxOutValue * nTimeWeight
// 	if valueTime > 0 { // no overflow
// 		bnCoinDayWeight = new(big.Int).SetInt64(valueTime / coinDay)
// 	} else {
// 		// overflow, calc w/ big.Int or return error?
// 		// err = errors.New("valueTime overflow")
// 		// return
// 		bnCoinDayWeight = new(big.Int).Div(new(big.Int).
// 			Div(
// 				new(big.Int).Mul(big.NewInt(t.PrevTxOutValue), big.NewInt(nTimeWeight)),
// 				new(big.Int).SetInt64(coin)),
// 			big.NewInt(24*60*60))
// 	}
// 	targetInt := new(big.Int).Mul(bnCoinDayWeight, bnTargetPerCoinDay)

// 	buf := make([]byte, 28)
// 	o := 0

// 	//if t.IsProtocolV03 { // v0.3 protocol
// 	d := t.StakeModifier
// 	for i := 0; i < 8; i++ {
// 		buf[o] = byte(d & 0xff)
// 		d >>= 8
// 		o++
// 	}
// 	// } else { // v0.2 protocol
// 	// 	d := t.Bits
// 	// 	for i := 0; i < 4; i++ {
// 	// 		buf[o] = byte(d & 0xff)
// 	// 		d >>= 8
// 	// 		o++
// 	// 	}
// 	// }
// 	data := [5]uint32{uint32(t.BlockFromTime), uint32(t.PrevTxOffset),
// 		uint32(t.PrevTxTime), uint32(t.PrevTxOutIndex), uint32(t.TxTime)}
// 	for _, d := range data {
// 		for i := 0; i < 4; i++ {
// 			buf[o] = byte(d & 0xff)
// 			d >>= 8
// 			o++
// 		}
// 	}
// 	hashProofOfStake := doubleSha256(buf[:o])
// 	buf = hashProofOfStake
// 	for i, l := 0, len(buf); i < l/2; i++ {
// 		buf[i], buf[l-1-i] = buf[l-1-i], buf[i]
// 	}
// 	hashProofOfStakeInt := new(big.Int).SetBytes(buf)
// 	if hashProofOfStakeInt.Cmp(targetInt) > 0 {
// 		return
// 	}
// 	minTarget = new(big.Int).Sub(new(big.Int).Div(hashProofOfStakeInt, bnCoinDayWeight), big.NewInt(1))
// 	success = true
// 	return
// }

// BigToCompact converts a whole number N to a compact representation using
// an unsigned 32-bit number.  The compact representation only provides 23 bits
// of precision, so values larger than (2^23 - 1) only encode the most
// significant digits of the number.  See CompactToBig for details.
func BigToCompact(n *big.Int) uint32 {
	// No need to do any work if it's zero.
	if n.Sign() == 0 {
		return 0
	}

	// Since the base for the exponent is 256, the exponent can be treated
	// as the number of bytes.  So, shift the number right or left
	// accordingly.  This is equivalent to:
	// mantissa = mantissa / 256^(exponent-3)
	var mantissa uint32
	exponent := uint(len(n.Bytes()))
	if exponent <= 3 {
		mantissa = uint32(n.Bits()[0])
		mantissa <<= 8 * (3 - exponent)
	} else {
		// Use a copy to avoid modifying the caller's original number.
		tn := new(big.Int).Set(n)
		mantissa = uint32(tn.Rsh(tn, 8*(exponent-3)).Bits()[0])
	}

	// When the mantissa already has the sign bit set, the number is too
	// large to fit into the available 23-bits, so divide the number by 256
	// and increment the exponent accordingly.
	if mantissa&0x00800000 != 0 {
		mantissa >>= 8
		exponent++
	}

	// Pack the exponent, sign bit, and mantissa into an unsigned 32-bit
	// int and return it.
	compact := uint32(exponent<<24) | mantissa
	if n.Sign() < 0 {
		compact |= 0x00800000
	}
	return compact
}

func CompactToDiff(bits uint32) (diff float32) {
	nShift := (bits >> 24) & 0xff
	diff = float32(0x0000ffff) / float32(bits&0x00ffffff)
	for ; nShift < 29; nShift++ {
		diff *= 256.0
	}
	for ; nShift > 29; nShift-- {
		diff /= 256.0
	}
	return
}

func IncCompact(compact uint32) uint32 {
	mantissa := compact & 0x007fffff
	neg := compact & 0x00800000
	exponent := uint(compact >> 24)

	if exponent <= 3 {
		mantissa += uint32(1 << (8 * (3 - exponent)))
	} else {
		mantissa++
	}

	if mantissa >= 0x00800000 {
		mantissa >>= 8
		exponent++
	}
	return uint32(exponent<<24) | mantissa | neg
}

func DiffToTarget(diff float32) (target *big.Int) {
	mantissa := 0x0000ffff / diff
	exp := 1
	tmp := mantissa
	for tmp >= 256.0 {
		tmp /= 256.0
		exp++
	}
	for i := 0; i < exp; i++ {
		mantissa *= 256.0
	}
	target = new(big.Int).Lsh(big.NewInt(int64(mantissa)), uint(26-exp)*8)
	return
}

func hasStakeKernelWrapper() js.Func {
	jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 {
			return "Invalid no of arguments passed"
		}
		inputJSON := args[0].String()
		//fmt.Printf("input %s\n", inputJSON)
		pretty, err := hasStakeKernel(inputJSON)
		if err != nil {
			fmt.Printf("unable to convert to json %s\n", err)
			return err.Error()
		}
		return pretty
	})
	return jsonFunc
}

// input a json of StakeKernelTemplate
func hasStakeKernel(input string) (float32, error) {

	var raw StakeKernelTemplate
	if err := json.Unmarshal([]byte(input), &raw); err != nil {
		return -1, err
	}

	maximumDiff := HasStakeKernelHash(raw.BlockFromTime, raw.StakeModifier, raw.PrevTxOffset, raw.PrevTxTime, raw.PrevTxOutIndex, raw.PrevTxOutValue, raw.StakeMinAge, raw.Bits, raw.TxTime)

	return maximumDiff, nil
}

func main() {
	fmt.Println("loaded webAssembly")
	js.Global().Set("hasStakeKernelWrapper", hasStakeKernelWrapper())
	<-make(chan struct{})
}
