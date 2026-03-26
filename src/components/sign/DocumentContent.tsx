/**
 * Full legal document content for W-9 and Contractor Agreement.
 * Used in both the signing flow and the owner document viewer.
 */

export function W9Content() {
  return (
    <div className="text-xs text-muted-foreground space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <p className="text-sm font-bold text-foreground">
          Form W-9 — Request for Taxpayer Identification Number and Certification
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Department of the Treasury — Internal Revenue Service
        </p>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">
          Instructions
        </p>
        <p>
          Give this form to the requester. Do not send to the IRS. Refer to the instructions
          for the requester of Form W-9. An individual or entity (Form W-9 requester) who is
          required to file an information return with the IRS must obtain your correct taxpayer
          identification number (TIN) which may be your social security number (SSN), individual
          taxpayer identification number (ITIN), adoption taxpayer identification number (ATIN),
          or employer identification number (EIN).
        </p>
      </div>

      {/* Fields */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-2">
          Taxpayer Information
        </p>
        <div className="space-y-2 pl-2">
          <div>
            <span className="font-semibold text-foreground">1. Name</span>{" "}
            <span className="text-muted-foreground">(as shown on your income tax return):</span>{" "}
            <span className="italic">Provided from signer profile</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">2. Business name/disregarded entity name</span>{" "}
            <span className="text-muted-foreground">(if different from above):</span>{" "}
            <span className="italic">If applicable</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">3. Federal tax classification:</span>{" "}
            Individual/sole proprietor
          </div>
          <div>
            <span className="font-semibold text-foreground">4. Exemptions</span>{" "}
            <span className="text-muted-foreground">(if any):</span>{" "}
            <span className="italic">N/A</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">5. Address</span>{" "}
            <span className="text-muted-foreground">(number, street, apt/suite):</span>{" "}
            <span className="italic">Provided from signer profile</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">6. City, state, ZIP:</span>{" "}
            <span className="italic">Provided from signer profile</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">7. Taxpayer Identification Number</span>{" "}
            <span className="text-muted-foreground">(SSN or EIN):</span>{" "}
            <span className="italic">*** - ** - **** (provided upon account creation)</span>
          </div>
        </div>
      </div>

      {/* Certification */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">
          Certification
        </p>
        <p className="mb-2">Under penalties of perjury, I certify that:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            The number shown on this form is my correct taxpayer identification number (or I am
            waiting for a number to be issued to me); and
          </li>
          <li>
            I am not subject to backup withholding because: (a) I am exempt from backup
            withholding, or (b) I have not been notified by the Internal Revenue Service (IRS)
            that I am subject to backup withholding as a result of a failure to report all
            interest or dividends, or (c) the IRS has notified me that I am no longer subject
            to backup withholding; and
          </li>
          <li>I am a U.S. citizen or other U.S. person (defined below); and</li>
          <li>
            The FATCA code(s) entered on this form (if any) indicating that I am exempt from
            FATCA reporting is correct.
          </li>
        </ol>
      </div>

      {/* General Instructions */}
      <div className="border-t border-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">
          General Instructions
        </p>
        <p className="text-[10px]">
          The Internal Revenue Service does not require your consent to any provision of this
          document other than the certifications required to avoid backup withholding. Section
          references are to the Internal Revenue Code. Future developments regarding Form W-9
          and its instructions can be found at www.irs.gov/FormW9.
        </p>
      </div>
    </div>
  )
}

export function ContractorAgreementContent() {
  return (
    <div className="text-xs text-muted-foreground space-y-4">
      {/* Title */}
      <div className="border-b border-border pb-3 text-center">
        <p className="text-sm font-bold text-foreground uppercase tracking-wide">
          Independent Contractor Agreement
        </p>
      </div>

      {/* Preamble */}
      <p>
        This Independent Contractor Agreement (&ldquo;Agreement&rdquo;) is made and entered into as of the
        date signed below, by and between <span className="font-semibold text-foreground">Business
        Threat Solutions, LLC</span>, a Missouri limited liability company
        (&ldquo;Company&rdquo;), and the undersigned contractor (&ldquo;Contractor&rdquo;).
      </p>

      {/* Section 1 */}
      <div>
        <p className="font-semibold text-foreground mb-1">1. Engagement</p>
        <p>
          Company hereby engages Contractor as an independent contractor to provide review
          management and client acquisition services. Contractor shall perform services in
          accordance with Company guidelines, platform procedures, and applicable laws.
          Contractor acknowledges that the scope of services may evolve and agrees to adapt
          to reasonable modifications communicated by the Company.
        </p>
      </div>

      {/* Section 2 */}
      <div>
        <p className="font-semibold text-foreground mb-1">2. Independent Contractor Status</p>
        <p>
          Contractor is an independent contractor and is not an employee, agent, partner, or
          joint venturer of Company. Contractor shall not be entitled to any employee benefits,
          including but not limited to health insurance, retirement benefits, workers&rsquo;
          compensation, or unemployment insurance. Contractor is solely responsible for payment
          of all taxes, including self-employment tax, income tax, and any other applicable
          federal, state, and local taxes arising from compensation received under this
          Agreement. Contractor shall indemnify Company for any tax liability arising from
          a misclassification claim initiated by Contractor.
        </p>
      </div>

      {/* Section 3 */}
      <div>
        <p className="font-semibold text-foreground mb-1">3. Compensation</p>
        <p>
          Contractor shall be compensated per the commission plan assigned to Contractor&rsquo;s
          account. Payment terms, rates, and commission structures are set forth in the
          Company&rsquo;s platform and may be adjusted by Company or Contractor&rsquo;s managing
          reseller. Contractor acknowledges that commission rates and structures may be
          modified with reasonable notice and that continued performance of services after
          such modification constitutes acceptance of the revised terms.
        </p>
      </div>

      {/* Section 4 */}
      <div>
        <p className="font-semibold text-foreground mb-1">4. Confidentiality</p>
        <p>
          Contractor agrees that all information obtained during the course of engagement,
          including but not limited to client information, business methods, pricing structures,
          customer lists, marketing strategies, proprietary software and technology, financial
          data, and internal communications, is strictly confidential and constitutes trade
          secrets of the Company. Contractor shall not disclose, reproduce, or use any
          confidential information for any purpose other than the performance of services
          under this Agreement, both during and after the term of engagement. Any breach of
          this provision shall entitle Company to seek injunctive relief and damages.
        </p>
      </div>

      {/* Section 5 */}
      <div>
        <p className="font-semibold text-foreground mb-1">5. Non-Solicitation</p>
        <p>
          During the term of this Agreement and for twelve (12) months following termination,
          Contractor shall not directly or indirectly solicit, contact, or do business with
          any client of the Company for the purpose of providing services that are competitive
          with or substantially similar to the services provided by the Company. Contractor
          further agrees not to recruit, solicit, or induce any employee, contractor, or
          agent of the Company to terminate their relationship with the Company.
        </p>
      </div>

      {/* Section 6 */}
      <div>
        <p className="font-semibold text-foreground mb-1">6. Term and Termination</p>
        <p>
          This Agreement shall commence on the date of execution and continue until terminated
          by either party. Either party may terminate this Agreement with thirty (30) days
          written notice to the other party. Company may terminate this Agreement immediately
          and without notice in the event of Contractor&rsquo;s breach of any provision herein,
          including but not limited to the confidentiality and non-solicitation provisions.
          Upon termination, Contractor shall immediately cease all use of Company materials,
          return any Company property, and delete any confidential information in
          Contractor&rsquo;s possession.
        </p>
      </div>

      {/* Section 7 */}
      <div>
        <p className="font-semibold text-foreground mb-1">7. Indemnification</p>
        <p>
          Contractor shall indemnify, defend, and hold harmless Company and its officers,
          directors, members, employees, and agents from and against any and all claims,
          damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees)
          arising out of or related to: (a) Contractor&rsquo;s performance of services under
          this Agreement; (b) any breach of this Agreement by Contractor; (c) any violation
          of applicable law by Contractor; or (d) any negligent or wrongful act or omission
          of Contractor.
        </p>
      </div>

      {/* Section 8 */}
      <div>
        <p className="font-semibold text-foreground mb-1">8. Governing Law</p>
        <p>
          This Agreement shall be governed by and construed in accordance with the laws of
          the State of Missouri, without regard to its conflicts of law provisions.
        </p>
      </div>

      {/* Section 9 */}
      <div>
        <p className="font-semibold text-foreground mb-1">9. Dispute Resolution</p>
        <p>
          Any dispute arising under this Agreement shall be resolved by binding arbitration
          in St. Louis, Missouri, in accordance with the rules of the American Arbitration
          Association. The prevailing party shall be entitled to recover its reasonable
          attorneys&rsquo; fees and costs.
        </p>
      </div>

      {/* Section 10 */}
      <div>
        <p className="font-semibold text-foreground mb-1">10. Entire Agreement</p>
        <p>
          This Agreement constitutes the entire agreement between the parties with respect
          to the subject matter hereof and supersedes all prior and contemporaneous
          agreements, representations, and understandings, whether written or oral. No
          modification of this Agreement shall be effective unless made in writing and
          signed by both parties.
        </p>
      </div>
    </div>
  )
}
