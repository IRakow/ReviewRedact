"use client"

import { useState } from "react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { W9Content, ContractorAgreementContent } from "@/components/sign/DocumentContent"
import { X, FileText, Pen } from "lucide-react"

interface SignatureData {
  type: "draw" | "typed"
  image_data?: string
  typed_name?: string
  font?: string
  ip: string
  user_agent: string
  timestamp: string
}

interface DocumentRow {
  id: string
  signer_type: string
  signer_id: string
  document_type: string
  status: string
  signature_data: SignatureData | null
  signed_at: string | null
  pdf_path: string | null
  created_at: string
}

function docLabel(type: string) {
  return type === "w9_1099" ? "W-9/1099" : "Contractor Agreement"
}

export function DocumentsTable({
  documents,
  nameMap,
}: {
  documents: DocumentRow[]
  nameMap: Record<string, string>
}) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null)

  return (
    <>
      <div className="rounded-md border border-border bg-surface">
        {documents.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No documents yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Signer</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Document</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Signed</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-surface/80 cursor-pointer transition-colors"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="px-5 py-3 font-medium text-foreground">
                    {nameMap[doc.signer_id] ?? "Unknown"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">{doc.signer_type}</td>
                  <td className="px-5 py-3 text-foreground">{docLabel(doc.document_type)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status === "signed" ? "signed" : "pending"} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {doc.signed_at
                      ? new Date(doc.signed_at).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="px-5 py-3">
                    {doc.signature_data ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDoc(doc)
                        }}
                        className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-light"
                      >
                        <Pen className="h-3 w-3" />
                        View Signature
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unsigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Document detail modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-md border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-steel" />
                <h3 className="text-sm font-semibold text-foreground">
                  {docLabel(selectedDoc.document_type)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Signer:</span>{" "}
                  <span className="text-foreground font-medium">
                    {nameMap[selectedDoc.signer_id] ?? "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="text-foreground capitalize">{selectedDoc.signer_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <StatusBadge status={selectedDoc.status === "signed" ? "signed" : "pending"} />
                </div>
                <div>
                  <span className="text-muted-foreground">Signed:</span>{" "}
                  <span className="text-foreground">
                    {selectedDoc.signed_at
                      ? new Date(selectedDoc.signed_at).toLocaleString()
                      : "Not signed"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <span className="font-mono text-xs text-foreground">{selectedDoc.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Document content */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Document Content
                </p>
                <div className="rounded-sm border border-border bg-background p-4 max-h-64 overflow-y-auto">
                  {selectedDoc.document_type === "w9_1099" ? (
                    <W9Content />
                  ) : (
                    <ContractorAgreementContent />
                  )}
                </div>
              </div>

              {/* Signature */}
              {selectedDoc.signature_data ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Signature
                  </p>
                  <div className="rounded-sm border border-border bg-background p-4">
                    {selectedDoc.signature_data.type === "draw" && selectedDoc.signature_data.image_data ? (
                      <img
                        src={selectedDoc.signature_data.image_data}
                        alt="Signature"
                        className="mx-auto max-h-24"
                      />
                    ) : selectedDoc.signature_data.type === "typed" && selectedDoc.signature_data.typed_name ? (
                      <p
                        className="text-center text-2xl text-foreground"
                        style={{ fontFamily: selectedDoc.signature_data.font ?? "cursive" }}
                      >
                        {selectedDoc.signature_data.typed_name}
                      </p>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        Signature data unavailable
                      </p>
                    )}
                  </div>

                  {/* Signature metadata */}
                  <div className="rounded-sm border border-border bg-background/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p>
                      IP: <span className="font-mono text-foreground">{selectedDoc.signature_data.ip}</span>
                    </p>
                    <p>
                      Signed: <span className="text-foreground">{new Date(selectedDoc.signature_data.timestamp).toLocaleString()}</span>
                    </p>
                    <p className="truncate">
                      UA: <span className="text-foreground">{selectedDoc.signature_data.user_agent}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-sm border border-border bg-background p-6 text-center text-sm text-muted-foreground">
                  This document has not been signed yet
                </div>
              )}

              {/* PDF link if available */}
              {selectedDoc.pdf_path && (
                <a
                  href={selectedDoc.pdf_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-steel/30 bg-steel/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
