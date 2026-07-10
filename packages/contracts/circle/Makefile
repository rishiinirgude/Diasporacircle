.PHONY: build test deploy clean

NETWORK ?= testnet
SOURCE ?= alice

build:
	cargo build --target wasm32-unknown-unknown --release 2>&1 | head -20
	@ls -lh target/wasm32-unknown-unknown/release/*.wasm

test:
	cargo test -- --nocapture

deploy:
	@echo "Deploying to $(NETWORK)..."
	stellar contract deploy \
	  --wasm target/wasm32-unknown-unknown/release/diasporacircle_circle.wasm \
	  --network $(NETWORK) \
	  --source $(SOURCE) \
	  | tee .contract-id
	@echo "Contract ID saved to .contract-id"

clean:
	cargo clean
