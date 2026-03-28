import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import {
  getFinancialOverview,
  getMoneyFlow,
  getFilingFees,
  getCommissions,
  getReconciliation,
  getFilingFeeRate,
  getFilingFeeHistory,
} from "./actions"
import { AccountingDashboard } from "./AccountingDashboard"

export default async function OwnerAccountingPage() {
  const session = await getSession()
  if (!session || session.user_type !== "owner") redirect("/")

  const [
    overview,
    moneyFlow,
    filingFees,
    resellerCommissions,
    spCommissions,
    reconciliation,
    filingRate,
    feeHistory,
  ] = await Promise.all([
    getFinancialOverview(),
    getMoneyFlow(),
    getFilingFees(),
    getCommissions("reseller"),
    getCommissions("salesperson"),
    getReconciliation(),
    getFilingFeeRate(),
    getFilingFeeHistory(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AccountingDashboard
        initialOverview={overview}
        initialMoneyFlow={moneyFlow}
        initialFilingFees={filingFees}
        initialResellerCommissions={resellerCommissions}
        initialSpCommissions={spCommissions}
        initialReconciliation={reconciliation}
        initialFilingRate={filingRate}
        initialFeeHistory={feeHistory}
      />
    </div>
  )
}
