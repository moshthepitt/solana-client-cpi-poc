# Test Solana CPI using instruction generated in client

This is a quick proof of concept that proves you can make a CPI call in Solana by using an instruction generated in the client-side.

This may be useful in cases where you want a PDA to sign an instruction but for whatever reason do no want to construction the instruction within the program logic.  Such reasons may be:

1. You don't have the rust bindings of the program that you intend to call via CPI (quick note that this is dangerous since you probably don't know what the program does)
2. It is impossible to create the instruction on-chain e.g. Jupiter instructions [that find the best swap route have to be done off-chain](https://docs.jup.ag/notes/on-chain-program#rust) (as of right now)

This proof of concept does a token transfer instruction that is created off chain and then is signed by a PDA on-chain to prove that it is possible.

## How to run this

1. Clone the repo, and [install Solana & Anchor](https://www.anchor-lang.com/docs/installation)
2. Run `yarn` to install the packages
3. Run `anchor test`
