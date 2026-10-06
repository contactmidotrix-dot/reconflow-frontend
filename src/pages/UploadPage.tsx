import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { submitReconciliationRun, WebhookError } from "../lib/n8n";
import { recordLead } from "../lib/results";

const FILE_HINT = "CSV, XLSX, or XLS · up to 50MB";

export function UploadPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [posFile, setPosFile] = useState<File | null>(null);
  const [platformFile, setPlatformFile] = useState<File | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingAWhile, setIsTakingAWhile] = useState(false);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  function validate(): string | null {
    if (!branchId.trim()) return "branch_id is required.";
    if (!periodStart) return "Period start is required.";
    if (!periodEnd) return "Period end is required.";
    if (periodEnd < periodStart) return "Period end can't be before period start.";
    if (!posFile) return "POS export file is required.";
    if (!platformFile) return "Platform settlement file is required.";
    if (!restaurantName.trim()) return "Restaurant name is required.";
    if (!contactEmail.trim()) return "Contact email is required.";
    if (!whatsappNumber.trim()) return "WhatsApp number is required.";
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setIsTakingAWhile(false);
    // Render's free tier sleeps after 15 minutes idle - if the workflow's
    // first API call (Login) hits a cold instance, this can take up to
    // ~60s before Create Analysis even runs. Upgrading the message after
    // a few seconds rather than leaving a bare spinner running.
    slowTimerRef.current = setTimeout(() => setIsTakingAWhile(true), 8000);

    try {
      const analysisId = await submitReconciliationRun({
        branchId: branchId.trim(),
        periodStart,
        periodEnd,
        posFile: posFile!,
        platformFile: platformFile!,
      });

      // Best-effort, deliberately non-blocking: the reconciliation is
      // already running server-side by this point (n8n doesn't wait on
      // the frontend), so a lead-capture hiccup shouldn't strand someone
      // on this page with no way to reach a result that already exists.
      try {
        await recordLead(analysisId, {
          restaurant_name: restaurantName.trim(),
          contact_email: contactEmail.trim(),
          whatsapp_number: whatsappNumber.trim(),
        });
      } catch (leadError) {
        console.error("Lead capture failed, continuing to results anyway:", leadError);
      }

      navigate(`/results/${analysisId}`);
    } catch (err) {
      setError(err instanceof WebhookError ? err.message : "Something went wrong. Try again.");
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setIsSubmitting(false);
      setIsTakingAWhile(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              Run a reconciliation
            </h1>
            <p className="mt-1 text-sm text-ink-muted">Signed in as {user?.email}</p>
          </div>
          <button onClick={logout} className="text-sm font-medium text-ink-muted hover:text-ink">
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-paper-raised p-8 shadow-[0_1px_2px_rgba(33,29,24,0.04),0_8px_24px_rgba(33,29,24,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-ink">
                Branch ID
              </label>
              <input
                id="branchId"
                type="text"
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={inputClass}
                placeholder="e.g. 7f783010-7986-41a4-95e0-beea69d0a186"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="periodStart" className="mb-1.5 block text-sm font-medium text-ink">
                  Period start
                </label>
                <input
                  id="periodStart"
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="periodEnd" className="mb-1.5 block text-sm font-medium text-ink">
                  Period end
                </label>
                <input
                  id="periodEnd"
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <FileField id="posFile" label="POS export" file={posFile} onChange={setPosFile} />
            <FileField
              id="platformFile"
              label="Platform settlement"
              file={platformFile}
              onChange={setPlatformFile}
            />

            <div className="border-t border-line pt-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Your details
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="restaurantName" className="mb-1.5 block text-sm font-medium text-ink">
                    Restaurant name
                  </label>
                  <input
                    id="restaurantName"
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className={inputClass}
                    placeholder="Downtown Grill"
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@restaurant.com"
                  />
                </div>
                <div>
                  <label htmlFor="whatsappNumber" className="mb-1.5 block text-sm font-medium text-ink">
                    WhatsApp number
                  </label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className={inputClass}
                    placeholder="+966 5X XXX XXXX"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-severity-critical/20 bg-severity-critical/5 px-3.5 py-2.5 text-sm text-severity-critical"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-copper px-4 py-2.5 text-sm font-medium text-paper-raised transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isTakingAWhile
                  ? "Still working — the backend may be waking up, this can take a minute…"
                  : "Submitting…"
                : "Run reconciliation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-copper focus:ring-2 focus:ring-copper/20";

function FileField({
  id,
  label,
  file,
  onChange,
}: {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="file"
        required
        accept=".csv,.xlsx,.xls"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-copper-soft file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-copper-dark hover:file:bg-copper-soft/70"
      />
      <p className="mt-1 text-xs text-ink-muted">{file ? file.name : FILE_HINT}</p>
    </div>
  );
}
