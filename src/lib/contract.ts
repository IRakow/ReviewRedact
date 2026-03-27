import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { Client, Review, SignatureData } from "./types"

const MARGIN_LEFT = 60
const MARGIN_RIGHT = 60
const MARGIN_TOP = 60
const MARGIN_BOTTOM = 60
const LINE_HEIGHT = 14
const SECTION_GAP = 10

interface ContractOptions {
  client: Client
  selectedReviews: Review[]
  contractRate: number
  btsEmail?: string
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toLocaleDateString("en-US")
  return new Date(dateStr).toLocaleDateString("en-US")
}

export async function generateContractPDF(options: ContractOptions): Promise<Uint8Array> {
  const { client, selectedReviews, contractRate, btsEmail = "contracts@bts-solutions.com" } = options

  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 612 // Letter size
  const pageHeight = 792
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - MARGIN_TOP
  let pageNum = 1

  function checkPageBreak(neededSpace: number) {
    if (y - neededSpace < MARGIN_BOTTOM) {
      // Add page number to current page
      page.drawText(`Page ${pageNum}`, {
        x: pageWidth / 2 - 20,
        y: 30,
        size: 9,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
      pageNum++
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - MARGIN_TOP
    }
  }

  function drawTitle(text: string) {
    checkPageBreak(40)
    page.drawText(text, {
      x: MARGIN_LEFT,
      y,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    y -= 28
  }

  function drawSectionHeader(text: string) {
    checkPageBreak(30)
    y -= SECTION_GAP
    page.drawText(text, {
      x: MARGIN_LEFT,
      y,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    y -= LINE_HEIGHT + 4
  }

  function drawParagraph(text: string, indent = 0) {
    const words = text.split(" ")
    let line = ""
    const fontSize = 10
    const maxWidth = contentWidth - indent

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const width = helvetica.widthOfTextAtSize(testLine, fontSize)
      if (width > maxWidth && line) {
        checkPageBreak(LINE_HEIGHT)
        page.drawText(line, {
          x: MARGIN_LEFT + indent,
          y,
          size: fontSize,
          font: helvetica,
          color: rgb(0, 0, 0),
        })
        y -= LINE_HEIGHT
        line = word
      } else {
        line = testLine
      }
    }
    if (line) {
      checkPageBreak(LINE_HEIGHT)
      page.drawText(line, {
        x: MARGIN_LEFT + indent,
        y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      y -= LINE_HEIGHT
    }
    y -= 4 // paragraph spacing
  }

  function drawBoldLine(text: string) {
    checkPageBreak(LINE_HEIGHT)
    page.drawText(text, {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    y -= LINE_HEIGHT + 2
  }

  function drawLine(text: string, indent = 0) {
    checkPageBreak(LINE_HEIGHT)
    page.drawText(text, {
      x: MARGIN_LEFT + indent,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    y -= LINE_HEIGHT
  }

  function drawSignatureLine(label: string) {
    checkPageBreak(40)
    y -= 10
    const lineStart = MARGIN_LEFT
    const lineEnd = MARGIN_LEFT + 250
    page.drawLine({
      start: { x: lineStart, y },
      end: { x: lineEnd, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    y -= 14
    page.drawText(label, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
    y -= 20
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  drawTitle("Digital Reputation Management Contract")

  y -= 4
  drawLine(`Date: ${formatDate()}`)
  drawLine(`Client: ${client.business_name}`)
  drawLine(`Client Representative: ${client.owner_name}`)
  if (client.owner_email) {
    drawLine(`Email: ${client.owner_email}`)
  }
  drawLine(`Address: ${client.address}`)
  y -= 8

  drawParagraph(
    "This Digital Reputation Management Contract (this \"Contract\") is entered into as of the date last signed below, by and between BTS Solutions, LLC (\"BTS\") and the client identified above (\"Client\")."
  )

  // ─── Section 1: Scope of Work ───────────────────────────────────────────────

  drawSectionHeader("Section 1 - Scope of Work")

  drawParagraph(
    "Client is a business / professional services enterprise / individual that is desirous of engaging BTS to remove inaccurate, incomplete and or unfair, derogatory content that appears in Google Reviews regarding the Client."
  )

  // Build the review description
  const reviewSummary = `${selectedReviews.length} Google Review${selectedReviews.length !== 1 ? "s" : ""} selected for removal:`
  drawBoldLine(`Google Review Description & Number: ${reviewSummary}`)

  for (let i = 0; i < selectedReviews.length; i++) {
    const r = selectedReviews[i]
    const truncatedText = r.review_text
      ? r.review_text.length > 80
        ? r.review_text.substring(0, 80) + "..."
        : r.review_text
      : "(no text)"
    drawLine(
      `${i + 1}. ${r.reviewer_name} - ${r.star_rating} star${r.star_rating !== 1 ? "s" : ""} - "${truncatedText}"`,
      10
    )
  }

  y -= 4

  drawParagraph(
    "It is expressly understood by Client that in conjunction with the performance of the services contemplated within this scope of work, BTS shall utilize its proprietary technology platform, Review Redact. Client has been informed by BTS through its authorized representatives that the Google Reviews identified in this scope of work will likely be removed within 8-14 days from the date of Client's execution of this Contract."
  )

  // ─── Section 2: Fees and Payment ────────────────────────────────────────────

  drawSectionHeader("Section 2 - BTS Fees and Payment Terms")

  drawParagraph(
    `Client shall remit to BTS a fee in the amount of ${formatCurrency(contractRate)} for each Google Review that is removed. The BTS Fee shall be due and payable by Client immediately upon removal of each such Google Review. Client shall not be liable to BTS for the payment of any fee or out of pocket expense incurred by BTS related to any Google Review that is not removed.`
  )

  const totalPotential = contractRate * selectedReviews.length
  drawBoldLine(`Total potential fee (${selectedReviews.length} reviews x ${formatCurrency(contractRate)}): ${formatCurrency(totalPotential)}`)

  // ─── Section 3: Compliance ──────────────────────────────────────────────────

  drawSectionHeader("Section 3 - Compliance with Applicable Laws")

  drawParagraph(
    "Both BTS and Client agree to comply with all applicable federal, state, and local laws, rules, and regulations in connection with the performance of their respective obligations under this Contract. BTS represents that its methods for seeking review removal comply with applicable terms of service and legal requirements. Nothing in this Contract shall be construed to require either party to take any action in violation of applicable law."
  )

  // ─── Section 4: Termination ─────────────────────────────────────────────────

  drawSectionHeader("Section 4 - Termination")

  drawParagraph(
    "Either party may terminate this Contract upon thirty (30) days written notice to the other party. BTS may terminate this Contract immediately if Client fails to make any payment when due. Upon termination, Client shall remain responsible for payment of fees for any Google Reviews that have been removed prior to the effective date of termination."
  )

  // ─── Section 5: Obligation for Payment if Client Terminates ─────────────────

  drawSectionHeader("Section 5 - Obligation for Payment if Client Terminates")

  drawParagraph(
    "In the event Client terminates this Contract prior to the completion of BTS's services, Client shall remain obligated to pay BTS for each Google Review that has been removed as of the date of termination. Client acknowledges that BTS incurs costs and expends resources upon execution of this Contract, and that this payment obligation is fair and reasonable."
  )

  // ─── Section 6: Client's Representations ────────────────────────────────────

  drawSectionHeader("Section 6 - Client's Representations")

  drawParagraph(
    "Client represents and warrants that: (a) the Google Reviews identified in Section 1 contain content that Client believes in good faith to be inaccurate, incomplete, unfair, or derogatory; (b) Client has the authority to enter into this Contract; (c) Client will provide BTS with all information and cooperation reasonably necessary for BTS to perform its services; and (d) Client will not take any action to interfere with BTS's efforts to remove the identified Google Reviews."
  )

  // ─── Section 7: Option to Become Retainer Client ────────────────────────────

  drawSectionHeader("Section 7 - Option to Become Retainer Client")

  drawParagraph(
    "Upon completion of the services described herein, Client shall have the option to engage BTS on a monthly retainer basis for ongoing digital reputation monitoring and management services. The terms of any such retainer arrangement shall be set forth in a separate agreement between the parties. BTS shall provide Client with information regarding its retainer programs upon request."
  )

  // ─── Section 8: Total Agreement ─────────────────────────────────────────────

  drawSectionHeader("Section 8 - Total Agreement")

  drawParagraph(
    "This Contract constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written, between the parties. No amendment, modification, or waiver of any provision of this Contract shall be effective unless in writing and signed by both parties."
  )

  // ─── Section 9: Notice ──────────────────────────────────────────────────────

  drawSectionHeader("Section 9 - Notice")

  drawParagraph(
    "All notices, requests, demands, and other communications under this Contract shall be in writing and shall be deemed to have been duly given when delivered personally, sent by confirmed email, or sent by certified mail, return receipt requested, to the parties at the following addresses:"
  )

  y -= 4
  drawBoldLine("BTS Solutions, LLC")
  drawLine(`Email: ${btsEmail}`, 10)
  y -= 4
  drawBoldLine(`Client: ${client.business_name}`)
  drawLine(`Attn: ${client.owner_name}`, 10)
  if (client.owner_email) {
    drawLine(`Email: ${client.owner_email}`, 10)
  }
  drawLine(`Address: ${client.address}`, 10)

  // ─── Section 10: Governing Law ──────────────────────────────────────────────

  drawSectionHeader("Section 10 - Governing Law")

  drawParagraph(
    "This Contract shall be governed by and construed in accordance with the laws of the State of Missouri, without regard to its conflict of law principles. The parties agree that any legal action or proceeding arising under this Contract shall be brought exclusively in the state or federal courts located in the State of Missouri, and the parties hereby consent to the personal jurisdiction and venue of such courts."
  )

  // ─── Section 11: Dispute Resolution / Jury Trial Waiver ─────────────────────

  drawSectionHeader("Section 11 - Dispute Resolution / Jury Trial Waiver")

  drawParagraph(
    "In the event of any dispute arising out of or relating to this Contract, the parties agree to first attempt to resolve the dispute through good faith negotiation. If the dispute cannot be resolved through negotiation within thirty (30) days, either party may pursue resolution through binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules, with the arbitration to take place in the State of Missouri."
  )

  drawParagraph(
    "EACH PARTY HEREBY WAIVES, TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ANY RIGHT IT MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY SUIT, ACTION, OR PROCEEDING ARISING OUT OF OR RELATING TO THIS CONTRACT."
  )

  // ─── Signature Block ────────────────────────────────────────────────────────

  drawSectionHeader("Signatures")

  drawParagraph(
    "IN WITNESS WHEREOF, the parties have executed this Digital Reputation Management Contract as of the date last signed below."
  )

  y -= 10

  drawBoldLine("CLIENT:")
  y -= 4
  drawSignatureLine("Signature")
  drawLine(`Name: ${client.owner_name}`)
  drawLine(`Title: Authorized Representative`)
  drawLine(`Business: ${client.business_name}`)
  drawSignatureLine("Date")

  y -= 10

  drawBoldLine("BTS SOLUTIONS, LLC:")
  y -= 4
  drawSignatureLine("Signature")
  drawLine("Name: ___________________________")
  drawLine("Title: Authorized Representative")
  drawSignatureLine("Date")

  // Add page number to the last page
  page.drawText(`Page ${pageNum}`, {
    x: pageWidth / 2 - 20,
    y: 30,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}

// ─── Signed Contract PDF ──────────────────────────────────────────────────────

interface SignedContractOptions extends ContractOptions {
  signatureData: {
    type: "draw" | "typed"
    image_data?: string
    typed_name?: string
    font?: string
  }
  signerName: string
  signedAt: string
}

export async function generateSignedContractPDF(options: SignedContractOptions): Promise<Uint8Array> {
  const { signatureData, signerName, signedAt, ...contractOptions } = options

  // 1. Generate the base PDF
  const basePdfBytes = await generateContractPDF(contractOptions)

  // 2. Load it with pdf-lib
  const pdfDoc = await PDFDocument.load(basePdfBytes)
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // The signature block on the last page: CLIENT section is drawn first,
  // then BTS section. We need to find the CLIENT signature line.
  // Based on the PDF generation, after "Signatures" header + witness paragraph + gap,
  // CLIENT: is drawn, then a signature line. We target a known Y region.
  // The signature lines are at roughly the same position each time.
  // We'll scan for the signature line by looking at page content annotations,
  // but since pdf-lib can't easily read drawn lines, we use a fixed offset approach.
  //
  // Strategy: The CLIENT signature area is approximately 180-220 points from the
  // bottom of the last page. We draw the signature at a reasonable fixed position
  // above the first signature line after "CLIENT:".
  //
  // Since the contract layout is deterministic (same sections each time),
  // we place the signature image/text and date at known Y coordinates
  // relative to the bottom of the page.

  // CLIENT signature position — the signature line is drawn ~180pt from bottom
  // on a typical 2-page contract. We'll use the page height and work from the
  // content that was drawn.
  //
  // More reliable: re-derive from the contract structure.
  // The last page has: CLIENT: + sig line + name + title + business + date line + gap + BTS: + sig line ...
  // Each sig line is preceded by y-=10, then the line, then y-=14 for label, y-=20 gap
  // So from the bottom of the BTS section going up:
  //   BTS date line label: ~y=30 (page number) + 20 + 14 = ~64
  //   BTS sig line: ~64 + 20 + 14 + 10 = ~108
  //   BTS header: ~108 + 14*3 + 4 + 10 = ~174
  //   CLIENT date label: ~174 + 20 = ~194
  //   CLIENT date sig line: ~194 + 14 = ~208
  //   CLIENT business line: ~208 + 14 = ~222
  //   CLIENT title line: ~222 + 14 = ~236
  //   CLIENT name line: ~236 + 14 = ~250
  //   CLIENT sig label: ~250 + 14 = ~264
  //   CLIENT sig line: ~264 + 10 = ~274
  //
  // We want to draw the signature just above the CLIENT signature line area.
  // Let's use a relative approach: draw the signature ~275pt from the bottom,
  // and the date ~195pt from the bottom.

  // Actually, let's be smarter. We know the page content height and we know
  // the last items drawn. Let's just target specific Y coordinates from the bottom.

  const clientSigY = 270 // Y position for signature (above the sig line)
  const clientDateY = 192 // Y position for date (above the date line)

  if (signatureData.type === "draw" && signatureData.image_data) {
    try {
      const base64 = signatureData.image_data.split(",")[1]
      if (base64) {
        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const pngImage = await pdfDoc.embedPng(imageBytes)
        const aspectRatio = pngImage.width / pngImage.height
        const sigWidth = Math.min(200, aspectRatio * 50)
        const sigHeight = sigWidth / aspectRatio

        lastPage.drawImage(pngImage, {
          x: MARGIN_LEFT,
          y: clientSigY,
          width: sigWidth,
          height: sigHeight,
        })
      }
    } catch {
      // If image embedding fails, fall back to drawing the name
      lastPage.drawText(signerName, {
        x: MARGIN_LEFT,
        y: clientSigY + 5,
        size: 16,
        font: helveticaOblique,
        color: rgb(0.1, 0.1, 0.3),
      })
    }
  } else if (signatureData.type === "typed" && signatureData.typed_name) {
    // Typed signature — use oblique font to simulate cursive
    lastPage.drawText(signatureData.typed_name, {
      x: MARGIN_LEFT,
      y: clientSigY + 5,
      size: 18,
      font: helveticaOblique,
      color: rgb(0.1, 0.1, 0.3),
    })
  }

  // Draw the date next to the date signature line
  const formattedDate = new Date(signedAt).toLocaleDateString("en-US")
  lastPage.drawText(formattedDate, {
    x: MARGIN_LEFT,
    y: clientDateY + 5,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  })

  // Add a "Digitally Signed" watermark text at the top of the first page
  const firstPage = pages[0]
  firstPage.drawText("DIGITALLY SIGNED", {
    x: 400,
    y: firstPage.getHeight() - 30,
    size: 8,
    font: helvetica,
    color: rgb(0.3, 0.6, 0.3),
  })

  return await pdfDoc.save()
}
