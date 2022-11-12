#![warn(missing_debug_implementations, clippy::pedantic)]
#![allow(
    clippy::module_name_repetitions,
    clippy::wildcard_imports,
    clippy::missing_errors_doc,
    clippy::missing_panics_doc
)]
//! Testing CPI using instruction generated in client

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
#[allow(clippy::needless_pass_by_value)]
pub mod client_cpi_test {
    use super::*;

    pub fn test_token_transfer(ctx: Context<TestTokenTransfer>, data: Vec<u8>) -> Result<()> {
        // get and verify token program
        let token_program_info = ctx.remaining_accounts.last().unwrap();
        Program::<anchor_spl::token::Token>::try_from(token_program_info)?;
        // find expect PDA
        let discriminant = b"test";
        let address_result = Pubkey::try_find_program_address(&[discriminant], &crate::ID).unwrap();
        // construct CPI and call it
        let accounts: Vec<AccountMeta> = ctx
            .remaining_accounts
            .iter()
            .take(ctx.remaining_accounts.len() - 1)
            .map(|acc| AccountMeta {
                pubkey: *acc.key,
                // pass `is_signer` via CPI correctly adapted from: https://github.com/coral-xyz/anchor/issues/1899
                is_signer: *acc.key == address_result.0,
                is_writable: acc.is_writable,
            })
            .collect();
        let accounts_infos: Vec<AccountInfo> = ctx
            .remaining_accounts
            .iter()
            .take(ctx.remaining_accounts.len() - 1)
            .map(|acc| AccountInfo { ..acc.clone() })
            .collect();
        invoke_signed(
            &Instruction {
                program_id: *token_program_info.key,
                accounts,
                data,
            },
            &accounts_infos,
            &[&[discriminant, &[address_result.1]]],
        )?;

        Ok(())
    }
}

/// Accounts for `TestTokenTransfer`
#[derive(Accounts, Debug)]
pub struct TestTokenTransfer {}
