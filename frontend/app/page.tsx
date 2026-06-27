"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  Crosshair,
  Download,
  ImagePlus,
  Loader2,
  MousePointerClick,
  Route,
  Sparkles,
  UploadCloud
} from "lucide-react";

type Step = {
  order: number;
  action: string;
  target_type: string;
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
  image_mime_type: string;
  model_used: string;
  summary: string;
  steps: Step[];
  warnings: string[];
  original_image_data_url: string;
  annotated_image_data_url: string;
};

type ViewMode = "annotated" | "original";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("annotated");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(file && question.trim()) && !isLoading, [file, question, isLoading]);
  const shownImage = result
    ? viewMode === "annotated"
      ? result.annotated_image_data_url
      : result.original_image_data_url
    : previewUrl;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setResult(null);
    setNotice(null);
    setError(null);
    setViewMode("annotated");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !question.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_goal", question.trim());

    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Không phân tích được ảnh.");
      }

      const payload = (await response.json()) as AnalyzeResponse;
      setResult(payload);
      setViewMode("annotated");
      setNotice("Đã phân tích ảnh và vẽ hướng dẫn lên output.");
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Không xử lý được yêu cầu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-primary text-brand-ink">
      <header className="border-b border-white/60 bg-brand-secondary/85 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-button shadow-sm">
            <Sparkles size={21} aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">AI UI Tutor Demo</p>
            <h1 className="text-2xl font-bold">Phân tích ảnh giao diện</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/70 bg-brand-secondary p-5 shadow-soft">
          <form onSubmit={handleAnalyze} className="grid gap-5">
            <label className="grid min-h-44 cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="sr-only" />
              <UploadCloud className="text-brand-button" size={34} aria-hidden />
              <span className="max-w-full break-words text-sm font-bold">{file ? file.name : "Chọn ảnh input"}</span>
              <small className="text-slate-500">PNG, JPG hoặc WebP</small>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">Câu hỏi hoặc mục tiêu</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                className="min-h-32 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-button/30 transition focus:ring-4"
                placeholder="Nhập yêu cầu bạn muốn AI hướng dẫn trên ảnh"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-button px-5 font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden /> : <MousePointerClick size={18} aria-hidden />}
              {isLoading ? "Đang phân tích" : "Phân tích ảnh"}
            </button>

            {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          </form>
        </aside>

        <section className="grid gap-5">
          <div className="rounded-3xl border border-white/70 bg-brand-secondary p-5 shadow-soft">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Output</p>
                <h2 className="text-xl font-bold">{result?.summary || "Ảnh output sau khi AI vẽ hướng dẫn"}</h2>
              </div>
              <div className="flex items-center gap-2">
                {result ? (
                  <div className="grid grid-cols-2 rounded-full bg-white p-1 text-sm font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode("annotated")}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 ${viewMode === "annotated" ? "bg-brand-button text-white" : "text-slate-600"
                        }`}
                    >
                      <Crosshair size={15} aria-hidden />
                      Output
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("original")}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 ${viewMode === "original" ? "bg-brand-button text-white" : "text-slate-600"
                        }`}
                    >
                      <ImagePlus size={15} aria-hidden />
                      Input
                    </button>
                  </div>
                ) : null}
                {result?.annotated_image_data_url ? (
                  <a
                    href={result.annotated_image_data_url}
                    download="ui-tutor-output.png"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-button"
                    aria-label="Tải ảnh output"
                  >
                    <Download size={18} aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid min-h-[420px] place-items-center overflow-hidden rounded-3xl border border-white bg-white">
              {shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImage} alt="Ảnh giao diện" className="max-h-[68vh] max-w-full object-contain" />
              ) : (
                <div className="grid place-items-center gap-3 text-slate-500">
                  <ImagePlus size={36} aria-hidden />
                  <span className="text-sm font-bold">Chưa có ảnh</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
              <span className="rounded-full bg-white px-3 py-2">Model: {result?.model_used ?? "gpt-5.5-pro"}</span>
              <span className="rounded-full bg-white px-3 py-2">Số bước: {result?.steps.length ?? 0}</span>
              <span className="rounded-full bg-white px-3 py-2">
                Kích thước: {result ? `${result.image_width} x ${result.image_height}` : "Chưa có"}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-brand-secondary p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <Route className="text-brand-button" size={20} aria-hidden />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tọa độ</p>
                <h2 className="text-xl font-bold">Các bước AI trả về</h2>
              </div>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {(result?.steps ?? []).map((step) => (
                <li key={`${step.order}-${step.label}`} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-button text-sm font-bold text-white">{step.order}</span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="break-words text-sm">{step.label}</strong>
                      <span className="text-xs font-bold text-emerald-700">{Math.round(step.confidence * 100)}%</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                    <code className="mt-2 block overflow-x-auto rounded-xl bg-brand-primary px-3 py-2 text-xs text-slate-700">
                      {step.action} / {step.target_type} / x:{step.x} y:{step.y} w:{step.width} h:{step.height}
                    </code>
                  </div>
                </li>
              ))}
              {!result ? <li className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500">Chưa có bước nào.</li> : null}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
