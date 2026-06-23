import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  validateManifestStructure,
  type Step1Value,
} from "@/lib/queries/submission";
import {
  SourceTypePicker,
  validateStep1,
} from "@/components/submission/SourceTypePicker";
import { WizardNav } from "@/components/submission/WizardNav";
import { AgentSkillCard } from "@/components/submission/AgentSkillCard";
import {
  MODULE_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  submissionSkills,
  sampleManifest,
  manifestWithContact,
} from "@/mocks/fixtures/submission";

/*
  提交模块纯组件 / 校验单测：
  - validateManifestStructure（结构必填 / 非法 JSON / contact 默认私密提示，PAGE-021）
  - SourceTypePicker 必填校验 + 无原始内容入口（NFR-001/INV-01）
  - WizardNav 按步禁用（INV-02 导航层）
  - AgentSkillCard 空态跳目录（FR-080）
*/

describe("validateManifestStructure（COMP-072 / PAGE-021）", () => {
  it("合法且字段齐备 → valid", () => {
    const { result, parsed } = validateManifestStructure(
      JSON.stringify(sampleManifest)
    );
    expect(result.valid).toBe(true);
    expect(parsed?.title).toBe(sampleManifest.title);
  });

  it("非法 JSON → 无效 + _json 错误", () => {
    const { result, parsed } = validateManifestStructure("{ not json");
    expect(result.valid).toBe(false);
    expect(result.fieldErrors._json).toBeTruthy();
    expect(parsed).toBeNull();
  });

  it("缺必填字段 → 无效 + 字段级错误", () => {
    const { result } = validateManifestStructure(
      JSON.stringify({ title: "x" })
    );
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.summary).toBeTruthy();
    expect(result.fieldErrors.source_types).toBeTruthy();
  });

  it("含 contact.value → contactNotice「默认私密」但不阻断校验（DEC-010/INV-03）", () => {
    const { result } = validateManifestStructure(
      JSON.stringify(manifestWithContact)
    );
    expect(result.valid).toBe(true);
    expect(result.contactNotice).toMatch(/默认私密/);
  });
});

describe("validateStep1（COMP-071 / PAGE-020）", () => {
  it("空表单 → title/moduleType/sourceTypes 三处错误", () => {
    const errs = validateStep1({
      title: "",
      oneLineIntent: "",
      moduleType: "",
      sourceTypes: [],
    });
    expect(errs.title).toBeTruthy();
    expect(errs.moduleType).toBeTruthy();
    expect(errs.sourceTypes).toBeTruthy();
  });

  it("齐备 → 无错误", () => {
    const v: Step1Value = {
      title: "测试模块",
      oneLineIntent: "用途",
      moduleType: "knowledge",
      sourceTypes: ["obsidian"],
    };
    expect(Object.keys(validateStep1(v)).length).toBe(0);
  });
});

describe("SourceTypePicker（COMP-071）", () => {
  const value: Step1Value = {
    title: "",
    oneLineIntent: "",
    moduleType: "",
    sourceTypes: [],
  };

  it("不含任何原始内容 / 路径 / 凭据输入项（NFR-001/INV-01）", () => {
    render(
      <SourceTypePicker
        value={value}
        moduleTypeOptions={MODULE_TYPE_OPTIONS}
        sourceTypeOptions={SOURCE_TYPE_OPTIONS}
        onChange={vi.fn()}
      />
    );
    const forbidden = [/原始内容/, /路径/i, /凭据/, /密钥/, /token/i, /password/i];
    // 任何 textbox 的 label / placeholder 都不应采集原始内容（仅标题 / 用途分类信息）。
    const labels = screen.getAllByRole("textbox").map((el) => el.getAttribute("aria-label") ?? "");
    for (const f of forbidden) {
      expect(labels.some((l) => f.test(l))).toBe(false);
    }
  });

  it("勾选来源类别回传 onChange", () => {
    const onChange = vi.fn();
    render(
      <SourceTypePicker
        value={value}
        moduleTypeOptions={MODULE_TYPE_OPTIONS}
        sourceTypeOptions={SOURCE_TYPE_OPTIONS}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Obsidian"));
    expect(onChange).toHaveBeenCalledWith({ sourceTypes: ["obsidian"] });
  });
});

describe("WizardNav（COMP-078）", () => {
  const base = {
    step: 3 as const,
    canGoBack: true,
    isLastStep: false,
    onNext: vi.fn(),
    onBack: vi.fn(),
    onSaveDraft: vi.fn(),
  };

  it("canProceed=false → 「下一步」禁用且不触发 onNext（INV-02）", () => {
    const onNext = vi.fn();
    render(<WizardNav {...base} canProceed={false} disabledReason="存在阻断项" onNext={onNext} />);
    const btn = screen.getByRole("button", { name: "下一步" });
    expect(btn).toBeDisabled();
    expect(screen.getByText("存在阻断项")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("canProceed=true → 可前进", () => {
    const onNext = vi.fn();
    render(<WizardNav {...base} canProceed={true} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(onNext).toHaveBeenCalled();
  });

  it("「保存草稿」任一步可用", () => {
    const onSaveDraft = vi.fn();
    render(<WizardNav {...base} canProceed={false} onSaveDraft={onSaveDraft} />);
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    expect(onSaveDraft).toHaveBeenCalled();
  });
});

describe("AgentSkillCard（COMP-073）", () => {
  it("有技能 → 列表 + 文档动作", () => {
    const onOpenDoc = vi.fn();
    render(<AgentSkillCard skills={submissionSkills} onOpenDoc={onOpenDoc} />);
    expect(screen.getByText("清单生成器")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /文档/ })[0]);
    expect(onOpenDoc).toHaveBeenCalled();
  });

  it("无技能 → 空态可跳技能目录（FR-080）", () => {
    const onOpenCatalog = vi.fn();
    render(<AgentSkillCard skills={[]} onOpenCatalog={onOpenCatalog} />);
    expect(screen.getByText(/未发现可用本机技能/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "去技能目录" }));
    expect(onOpenCatalog).toHaveBeenCalled();
  });
});
