/**
 * Builds a minimal Stellar transaction for wallet authentication.
 * The transaction contains the nonce as a text memo so Freighter can sign it.
 * The backend can verify the signature came from the claimed public key.
 */
export async function buildAuthTransaction(
  publicKey: string,
  nonce: string,
  networkPassphrase: string
): Promise<string> {
  // Dynamically import stellar-sdk to keep bundle manageable
  const { TransactionBuilder, Networks, Account, Operation, Asset, Memo, BASE_FEE } =
    await import('@stellar/stellar-sdk');

  // Use a dummy sequence number — this transaction is never submitted,
  // only signed as proof of key ownership.
  const account = new Account(publicKey, '0');

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      // Minimal no-op: manage data with nonce
      Operation.manageData({
        name: 'diasporacircle_auth',
        value: nonce.substring(0, 64), // max 64 bytes
      })
    )
    .addMemo(Memo.text(`dc_auth:${nonce.substring(0, 20)}`))
    .setTimeout(300)
    .build();

  return tx.toXDR();
}
