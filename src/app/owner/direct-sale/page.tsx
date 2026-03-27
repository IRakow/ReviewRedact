import { DirectSaleFlow } from "./DirectSaleFlow"

export default function DirectSalePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Direct Sale
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sell review removals directly — set any price, no reseller or salesperson in the chain
        </p>
      </div>
      <div className="mt-6">
        <DirectSaleFlow />
      </div>
    </div>
  )
}
