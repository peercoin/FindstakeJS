to compile into a wasm file, go version 1.22.2 was used. The file wasm_exec.js residing in public folder is copied from that version.

GOOS=js GOARCH=wasm go build -o  ../../assets/hasStakeKernel.wasm