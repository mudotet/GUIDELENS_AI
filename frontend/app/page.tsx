"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ImagePlus, Loader2, Sparkles, UploadCloud } from "lucide-react";

type Step = {
  order: number;
  action: string;
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

type AnalyzeResponse = {
  source_filename: string | null;
  image_width: number;
  image_height: number;
  summary: string;
  steps: Step[];
  annotated_image_data_url: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [goal, setGoal] = useState("Show the user which controls to click next.");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canAnalyze = useMemo(() => Boolean(file) && !isLoading, [file, isLoading]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_goal", goal);

    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Analysis failed.");
      }

      const payload = (await response.json()) as AnalyzeResponse;
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="workspace">
        <div className="panel controls">
          <div className="brand">
            <div className="brandMark">
              <Sparkles size={20} aria-hidden />
            </div>
            <div>
              <p className="eyebrow">AI UI Tutor</p>
              <h1>Screenshot guidance builder</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <label className="dropzone">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <UploadCloud size={28} aria-hidden />
              <span>{file ? file.name : "Upload a UI screenshot"}</span>
            </label>

            <label className="field">
              <span>User goal</span>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={5}
                placeholder="Example: Help the user create a new project"
              />
            </label>

            <button type="submit" disabled={!canAnalyze} className="primaryButton">
              {isLoading ? <Loader2 className="spin" size={18} aria-hidden /> : <Sparkles size={18} aria-hidden />}
              <span>{isLoading ? "Analyzing" : "Analyze screenshot"}</span>
            </button>

            {error ? <p className="error">{error}</p> : null}
          </form>
        </div>

        <div className="panel previewPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Output</p>
              <h2>Annotated image</h2>
            </div>
            <ImagePlus size={22} aria-hidden />
          </div>

          <div className="imageStage">
            {result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.annotated_image_data_url} alt="Annotated screenshot" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Uploaded screenshot preview" />
            ) : (
              <div className="emptyState">
                <ImagePlus size={34} aria-hidden />
                <span>No image selected</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {result ? (
        <section className="stepsPanel">
          <div>
            <p className="eyebrow">Detected flow</p>
            <h2>{result.summary || "Suggested steps"}</h2>
          </div>

          <ol className="steps">
            {result.steps.map((step) => (
              <li key={`${step.order}-${step.label}`}>
                <span className="stepNumber">{step.order}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.description}</p>
                  <small>
                    {step.action} at ({step.x}, {step.y}) - {Math.round(step.confidence * 100)}%
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
