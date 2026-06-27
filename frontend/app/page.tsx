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

const exampleGoals = [
  "Hướng dẫn người dùng đăng nhập vào hệ thống.",
  "Chỉ ra các bước để tạo một dự án mới.",
  "Tìm nút cần bấm để tiếp tục thanh toán."
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [goal, setGoal] = useState(exampleGoals[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("annotated");

  const canAnalyze = useMemo(() => Boolean(file) && goal.trim().length > 0 && !isLoading, [file, goal, isLoading]);
  const displayedImage = result
    ? viewMode === "annotated"
      ? result.annotated_image_data_url
      : result.original_image_data_url
    : previewUrl;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
    setViewMode("annotated");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !goal.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_goal", goal.trim());

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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không phân tích được ảnh.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="workspace">
        <aside className="controlPane">
          <div className="brand">
            <div className="brandMark">
              <Sparkles size={20} aria-hidden />
            </div>
            <div>
              <p className="eyebrow">AI UI Tutor</p>
              <h1>Phân tích ảnh giao diện</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <label className="dropzone">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
              <UploadCloud size={30} aria-hidden />
              <span>{file ? file.name : "Chọn ảnh màn hình"}</span>
              {file ? <small>{Math.round(file.size / 1024)} KB</small> : <small>PNG, JPG hoặc WebP</small>}
            </label>

            <label className="field">
              <span>Mục tiêu người dùng</span>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={5}
                placeholder="Ví dụ: Hướng dẫn người dùng tạo tài khoản mới"
              />
            </label>

            <div className="quickGoals">
              {exampleGoals.map((item) => (
                <button key={item} type="button" onClick={() => setGoal(item)}>
                  {item}
                </button>
              ))}
            </div>

            <button type="submit" disabled={!canAnalyze} className="primaryButton">
              {isLoading ? <Loader2 className="spin" size={18} aria-hidden /> : <MousePointerClick size={18} aria-hidden />}
              <span>{isLoading ? "Đang phân tích" : "Phân tích và vẽ bước"}</span>
            </button>

            {error ? <p className="error">{error}</p> : null}
          </form>
        </aside>

        <section className="resultPane">
          <div className="resultHeader">
            <div>
              <p className="eyebrow">Kết quả</p>
              <h2>{result?.summary || "Ảnh đã annotate sẽ xuất hiện tại đây"}</h2>
            </div>

            <div className="headerActions">
              {result ? (
                <div className="segmented" aria-label="Chọn kiểu ảnh">
                  <button
                    type="button"
                    className={viewMode === "annotated" ? "active" : ""}
                    onClick={() => setViewMode("annotated")}
                  >
                    <Crosshair size={16} aria-hidden />
                    Annotated
                  </button>
                  <button
                    type="button"
                    className={viewMode === "original" ? "active" : ""}
                    onClick={() => setViewMode("original")}
                  >
                    <ImagePlus size={16} aria-hidden />
                    Gốc
                  </button>
                </div>
              ) : null}

              {result ? (
                <a className="iconButton" href={result.annotated_image_data_url} download="ui-guidance.png" aria-label="Tải ảnh kết quả">
                  <Download size={18} aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          <div className="imageStage">
            {displayedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayedImage} alt={result ? "Ảnh giao diện đã vẽ hướng dẫn" : "Ảnh giao diện đã chọn"} />
            ) : (
              <div className="emptyState">
                <ImagePlus size={34} aria-hidden />
                <span>Chưa có ảnh</span>
              </div>
            )}
          </div>

          <div className="statusBar">
            <span>{result ? `${result.image_width} x ${result.image_height}` : "Chưa phân tích"}</span>
            <span>{result ? result.model_used : "Model: gpt-5.4-mini"}</span>
            <span>{result ? `${result.steps.length} bước` : "0 bước"}</span>
          </div>
        </section>
      </section>

      {result ? (
        <section className="analysisBoard">
          <div className="boardTitle">
            <Route size={20} aria-hidden />
            <div>
              <p className="eyebrow">Tọa độ AI trả về</p>
              <h2>Danh sách bước thao tác</h2>
            </div>
          </div>

          {result.warnings.length > 0 ? (
            <div className="warnings">
              {result.warnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          ) : null}

          <ol className="steps">
            {result.steps.map((step) => (
              <li key={`${step.order}-${step.label}`}>
                <span className="stepNumber">{step.order}</span>
                <div className="stepBody">
                  <div className="stepHeading">
                    <strong>{step.label}</strong>
                    <span>{Math.round(step.confidence * 100)}%</span>
                  </div>
                  <p>{step.description}</p>
                  <code>
                    {step.action} / {step.target_type} / x:{step.x} y:{step.y} w:{step.width} h:{step.height}
                  </code>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
