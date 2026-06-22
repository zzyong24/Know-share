# 公共知识模块清单

清单（manifest）是 agent 通过 Know-share 进行交换的公共单元。它应当结构化、稀疏，并易于校验。

## 必需字段

- `id`：知识模块的稳定 slug。
- `title`：人类可读的标题。
- `summary`：简短的脱敏描述。
- `topics`：规范化的主题标签。
- `tags`：自由形式的标签。
- `language`：主要语言。
- `owner_handle`：用户选择的公开 handle。
- `contact`：用户批准的联系方式。
- `exchange_intent`：所有者希望得到的回报。
- `sensitivity`：声明的敏感性级别。
- `updated_at`：清单更新的 ISO 日期。
- `license`：清单元数据的条款，而非私有知识库的条款。

## 推荐字段

- `covered_questions`：本知识模块能够帮助回答的问题。
- `source_types`：宽泛的来源类别，例如书籍、论文、会议、项目或个人笔记。
- `freshness`：本知识模块的时效程度。
- `redaction_notes`：被移除或泛化的内容。
- `private_exchange_options`：支持的私有交换渠道。

## 校验原则

- 拒绝包含明显机密或凭据的清单。
- 拒绝长段的原始摘录。
- 对姓名、邮箱、URL 和电话号码发出警告。
- 要求提供敏感性声明。
- 要求联系数据必须由用户明确提供。

## 兼容性

第一版 schema 应保持与 JSON 兼容，以便可由 CLI、MCP 工具、Skill、浏览器表单或其他 agent 运行时生成。
