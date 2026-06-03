async function handleResponseError(resp) {
  let errorMessage = `Submission failed: ${resp.status} ${resp.statusText}`;
  try {
    const text = await resp.clone().text();
    try {
      const errorData = JSON.parse(text);
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.errors && errorData.errors[0] && errorData.errors[0].message) {
        errorMessage = errorData.errors[0].message;
      }
    } catch {
      if (text) {
        errorMessage = text;
      }
    }
  } catch {
    // Ignore clone or reading errors
  }
  throw new Error(errorMessage);
}

export async function submitCandidate(data) {
  const url = process.env.NEXT_PUBLIC_FORMS_API_URL;

  if (!url) {
    console.warn(
      "NEXT_PUBLIC_FORMS_API_URL not set - falling back to local console log for submitCandidate",
    );
    console.log("Submitting candidate record:", data);
    return { success: true };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    await handleResponseError(resp);
  }

  return resp.json();
}

export async function submitReport(data) {
  const url = process.env.NEXT_PUBLIC_FORMS_API_URL;
  if (!url) {
    console.warn(
      "NEXT_PUBLIC_FORMS_API_URL not set — falling back to local console log for submitReport",
    );
    console.log("Submitting report record:", data);
    return { success: true };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    await handleResponseError(resp);
  }

  return resp.json();
}
