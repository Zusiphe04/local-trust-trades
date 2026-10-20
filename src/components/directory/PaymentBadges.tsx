import { useState } from "react";
import { Banknote, CreditCard, Landmark, QrCode } from "lucide-react";
import type { Listing } from "@/lib/directory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PaymentInfo = Pick<
  Listing,
  | "accepts_card"
  | "accepts_eft"
  | "accepts_snapscan"
  | "accepts_cash"
  | "bank_name"
  | "account_number"
  | "branch_code"
  | "payment_reference"
  | "snapscan_qr_url"
  | "payfast_link"
>;

export function hasPaymentInfo(l: PaymentInfo) {
  return l.accepts_card || l.accepts_eft || l.accepts_snapscan || l.accepts_cash;
}

/** South African payment method badges (Visa, Mastercard, Instant EFT, SnapScan, Zapper, Cash). */
export function PaymentBadges({ listing }: { listing: PaymentInfo }) {
  const badges: string[] = [];
  if (listing.accepts_card) badges.push("Visa", "Mastercard");
  if (listing.accepts_eft) badges.push("Instant EFT");
  if (listing.accepts_snapscan) badges.push("SnapScan", "Zapper");
  if (listing.accepts_cash) badges.push("Cash");
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b} className="rounded-sm border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          {b}
        </span>
      ))}
    </div>
  );
}

/** "Invoiced & Payment Details" modal — shows the provider's payment instructions to the customer. */
export function PaymentDetailsDialog({ listing, businessName }: { listing: PaymentInfo; businessName: string }) {
  const [open, setOpen] = useState(false);
  const hasEft = listing.accepts_eft && (listing.bank_name || listing.account_number);
  const hasQr = listing.accepts_snapscan && listing.snapscan_qr_url;
  const hasPayfast = !!listing.payfast_link;
  if (!hasEft && !hasQr && !hasPayfast && !listing.accepts_card && !listing.accepts_cash) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        View payment details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment details — {businessName}</DialogTitle>
            <DialogDescription>Pay the business directly once your job is complete and invoiced.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            {listing.accepts_card && (
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Card accepted</p>
                  <p className="text-muted-foreground">Visa and Mastercard accepted on site or via payment link.</p>
                </div>
              </div>
            )}
            {hasEft && (
              <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">Bank EFT</p>
                  <dl className="mt-1 space-y-1 text-muted-foreground">
                    {listing.bank_name && <div className="flex justify-between gap-4"><dt>Bank</dt><dd className="font-medium text-foreground">{listing.bank_name}</dd></div>}
                    {listing.account_number && <div className="flex justify-between gap-4"><dt>Account number</dt><dd className="font-medium text-foreground">{listing.account_number}</dd></div>}
                    {listing.branch_code && <div className="flex justify-between gap-4"><dt>Branch code</dt><dd className="font-medium text-foreground">{listing.branch_code}</dd></div>}
                    {listing.payment_reference && <div className="flex justify-between gap-4"><dt>Reference</dt><dd className="font-medium text-foreground">{listing.payment_reference}</dd></div>}
                  </dl>
                </div>
              </div>
            )}
            {hasQr && (
              <div className="flex items-start gap-3">
                <QrCode className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">SnapScan / Zapper</p>
                  <p className="text-muted-foreground">Scan this code with your banking app to pay.</p>
                  <img src={listing.snapscan_qr_url!} alt="SnapScan or Zapper QR code" className="mt-2 h-40 w-40 rounded-md border object-contain" />
                </div>
              </div>
            )}
            {hasPayfast && (
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">PayFast payment link</p>
                  <a href={listing.payfast_link!} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                    Pay securely via PayFast →
                  </a>
                </div>
              </div>
            )}
            {listing.accepts_cash && (
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Cash</p>
                  <p className="text-muted-foreground">Cash on completion is accepted.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
