const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string;

if (!N8N_WEBHOOK_URL) {
  throw new Error(
    "VITE_N8N_WEBHOOK_URL is not set. Add it to .env.local - the " +
      "*production* URL of the 'Run Reconciliation' Form Trigger " +
      "(the workflow must be toggled Active in n8n; the Test URL only " +
      "fires once per click of 'Listen for test event' in the editor).",
  );
}

export interface UploadFormValues {
  branchId: string;
  periodStart: string;
  periodEnd: string;
  posFile: File;
  platformFile: File;
}

/**
 * Distinct from ApiError in api.ts on purpose - this call goes straight
 * to n8n, not through the ReconFlow API, so it can't throw the
 * {error_code, message} shape every backend module raises. The four
 * branches below are the four genuinely different ways this can fail,
 * kept separate because "couldn't reach n8n" and "n8n responded but the
 * Respond-to-Webhook node isn't returning analysis_id" call for
 * completely different fixes, and a generic "upload failed" would send
 * whoever's debugging it in the wrong direction.
 */
export class WebhookError extends Error {}

/**
 * Submits straight to the n8n Form Trigger webhook - the ReconFlow API's
 * bearer-token auth (see api.ts) doesn't apply here at all; n8n is the
 * one authenticating to the API on the workflow's own login step, same
 * as it already does for every other node in that pipeline.
 */
export async function submitReconciliationRun(values: UploadFormValues): Promise<string> {
  const formData = new FormData();
  formData.append("branch_id", values.branchId);
  formData.append("period_start", values.periodStart);
  formData.append("period_end", values.periodEnd);
  formData.append("pos_file", values.posFile);
  formData.append("platform_file", values.platformFile);

  let response: Response;
  try {
    // No Content-Type header set here on purpose - the browser adds
    // multipart/form-data with the correct boundary itself; setting it
    // manually breaks the boundary and n8n silently sees an empty body.
    response = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: formData });
  } catch {
    throw new WebhookError(
      "Couldn't reach the n8n webhook. Confirm the workflow is Active and " +
        "VITE_N8N_WEBHOOK_URL is the production URL, not the Test URL.",
    );
  }

  if (!response.ok) {
    throw new WebhookError(
      `The workflow returned an error (HTTP ${response.status}). Check the ` +
        "execution log in n8n for which node failed.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new WebhookError(
      "The workflow responded, but not with JSON. The Form Trigger's " +
        'Respond to Webhook step needs to return { "analysis_id": "..." } ' +
        "for this page to know where to send you.",
    );
  }

  const analysisId = (body as Record<string, unknown> | null)?.analysis_id;
  if (typeof analysisId !== "string" || analysisId.length === 0) {
    throw new WebhookError(
      "The workflow responded with JSON, but no analysis_id field was in it.",
    );
  }

  return analysisId;
}
