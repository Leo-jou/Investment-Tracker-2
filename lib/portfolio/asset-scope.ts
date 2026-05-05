export function filterAssetsByReferencedTransactions<
  TAsset extends { id: string },
  TTransaction extends { assetId?: string | null }
>(assets: TAsset[], transactions: TTransaction[]) {
  const referencedAssetIds = new Set(
    transactions.flatMap((transaction) => (transaction.assetId ? [transaction.assetId] : []))
  );

  return assets.filter((asset) => referencedAssetIds.has(asset.id));
}
