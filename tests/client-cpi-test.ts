import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  getAccount,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { ClientCpiTest } from "../target/types/client_cpi_test";
import { expect } from "chai";

describe("client-cpi-test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ClientCpiTest as Program<ClientCpiTest>;
  const wallet = program.provider.publicKey;

  it("Is works!", async () => {
    // set up the mint and token accounts
    const mint = new Keypair();
    const pda = PublicKey.findProgramAddressSync(
      [Buffer.from("test")],
      program.programId
    );
    const walletToken = await getAssociatedTokenAddress(mint.publicKey, wallet);
    const pdaToken = await getAssociatedTokenAddress(
      mint.publicKey,
      pda[0],
      true
    );
    const createMintIx = SystemProgram.createAccount({
      fromPubkey: wallet,
      lamports:
        await program.provider.connection.getMinimumBalanceForRentExemption(
          MINT_SIZE,
          "confirmed"
        ),
      newAccountPubkey: mint.publicKey,
      programId: TOKEN_PROGRAM_ID,
      space: MINT_SIZE,
    });
    const initMintIx = createInitializeMintInstruction(
      mint.publicKey,
      9,
      wallet,
      wallet
    );
    const createSourceIx = createAssociatedTokenAccountInstruction(
      wallet,
      walletToken,
      wallet,
      mint.publicKey
    );
    const createDestinationIx = createAssociatedTokenAccountInstruction(
      wallet,
      pdaToken,
      pda[0],
      mint.publicKey
    );
    const mintToIx = createMintToInstruction(
      mint.publicKey,
      pdaToken,
      wallet,
      100_000
    );
    const tx = new anchor.web3.Transaction().add(
      ...[
        createMintIx,
        initMintIx,
        createSourceIx,
        createDestinationIx,
        mintToIx,
      ]
    );
    await program.provider.sendAndConfirm(tx, [mint]);

    let walletTokenAccBefore = await getAccount(program.provider.connection, walletToken, 'processed');

    // create transfer ix
    const amount = BigInt(200);
    const transferIx = createTransferInstruction(
      pdaToken,
      walletToken,
      pda[0],
      amount
    );

    const remainingAccounts = transferIx.keys.map((it) => {
      return {
        ...it,
        isSigner: false,
      };
    });
    remainingAccounts.push({
      pubkey: transferIx.programId,
      isSigner: false,
      isWritable: false,
    });

    const transferViaCpiIx = await program.methods
      .testTokenTransfer(transferIx.data)
      .accountsStrict({})
      .remainingAccounts(remainingAccounts)
      .instruction();

    const tx2 = new anchor.web3.Transaction().add(transferViaCpiIx);
    const txId = await program.provider.sendAndConfirm(tx2);
    console.log(txId);

    let walletTokenAccAfter = await getAccount(program.provider.connection, walletToken, 'processed');
    expect(walletTokenAccBefore.amount + amount).equals(walletTokenAccAfter.amount);
  });
});
