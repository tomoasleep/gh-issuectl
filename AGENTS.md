# AGENTS.md

このファイルは、このリポジトリで作業するエージェント向けのガイドラインです。

## プロジェクト概要

gh-issuectl は GitHub CLI 拡張機能で、Issue/PR の説明文のセクションをパッチするためのツールです。
Bun + TypeScript で開発されており、yargs を使用して CLI を構築しています。

## Build/Lint/Test コマンド

### ビルド
```bash
bun run build
# または直接実行
bun build ./src/index.ts --outdir ./dist --target node
```

### 型チェック
```bash
bun run typecheck
# tsc --noEmit
```

### リント
```bash
bun run lint
# biome check .
```

### フォーマット
```bash
bun run format
# biome format . --write
```

### テスト

全テスト実行:
```bash
bun test
```

単一テストファイルの実行:
```bash
bun test src/github/api.test.ts
bun test src/markdown/section.test.ts
```

パターンマッチでの実行:
```bash
bun test -t "should throw on failure"
```

Watch モード:
```bash
bun test --watch
```

## プロジェクト構造

```
src/
├── index.ts              # エントリーポイント
├── cli.ts                # CLI 定義 (yargs)
├── commands/
│   └── patch.ts          # patch コマンドの実装
├── github/
│   ├── api.ts            # GitHub API 関数 (gh コマンドのラッパー)
│   └── api.test.ts       # テストファイル
└── markdown/
    ├── section.ts        # Markdown セクション操作ユーティリティ
    └── section.test.ts   # テストファイル
```

## コードスタイル

### フォーマット

- **インデント**: タブを使用 (スペースではなく)
- **引用符**: ダブルクォート (`"`)
- **セミコロン**: なし (TypeScript/Bun の慣習に従う)
- **インポート**: 自動整理 (biome の organizeImports 機能)

### TypeScript 設定

- **Target**: ES2022
- **Module**: ESNext
- **Module Resolution**: bundler
- **Strict mode**: 有効

### インポート

```typescript
// 外部ライブラリ
import yargs from "yargs";

// 内部モジュール (拡張子 .js を付ける)
import { patch } from "./commands/patch.js";
import { SectionNotFoundError } from "./markdown/section.js";
```

### エクスポート

- named export を推奨
- 型は type キーワードを使用: `export type Foo = { ... }`
- インターフェースは直接 export: `export interface Bar { ... }`

### 型定義

```typescript
// 型エイリアス
export type ExecResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

// インターフェース
export interface Issue {
	number: number;
	title: string;
	body: string | null;
}

// 関数の型
export type Executor = (cmd: string[], stdin?: string) => Promise<ExecResult>;
```

### エラーハンドリング

- カスタムエラークラスを作成し、カスタムエラーが必要な場合は継承
- エラーメッセージは具体的に

```typescript
export class SectionNotFoundError extends Error {
	constructor(public sectionName: string) {
		super(`Section "${sectionName}" not found`);
		this.name = "SectionNotFoundError";
	}
}
```

- 関数内でのエラー処理:

```typescript
if (exitCode !== 0) {
	throw new Error(`Failed to get issue ${number}`);
}
```

### 関数定義

- `async function` を使用
- デフォルトパラメータは依存性注入に活用

```typescript
export async function getIssue(
	number: number,
	executor: Executor = exec,
): Promise<Issue> {
	// ...
}
```

### コメント

- コードの意図を説明するコメントは残さない
- コード自体が自明であるべき

## テストの書き方

### テストファイル配置

テストファイルはソースファイルと同じディレクトリに `<name>.test.ts` として配置。

### テスト構造

```typescript
import { describe, expect, it, mock } from "bun:test";
import { functionToTest } from "./module";

describe("GroupName", () => {
	describe("functionName", () => {
		it("should do something", () => {
			const result = functionToTest(input);
			expect(result).toBe(expected);
		});

		it("should throw on failure", async () => {
			await expect(functionToTest(badInput)).rejects.toThrow("Error message");
		});
	});
});
```

### モックの作成

```typescript
const createMockExecutor = (
	stdout: string = "",
	stderr: string = "",
	exitCode: number = 0,
): Executor => {
	return mock(async (): Promise<ExecResult> => {
		return { stdout, stderr, exitCode };
	});
};
```

### テストパターン

- 正常系のテスト
- エラーケースのテスト
- エッジケース (null, 空文字列など) のテスト

## 依存関係

- **yargs**: CLI 引数解析
- **Bun**: ランタイム、テストランナー、バンドラー
- **biome**: linting とフォーマット
- **TypeScript**: 型チェック

## CLI 実装パターン

```typescript
export async function run(args: string[]): Promise<void> {
	await yargs(args)
		.scriptName("gh-issuectl")
		.command(
			"command-name [arg]",
			"Description",
			{
				arg: { type: "number", describe: "Description" },
			},
			async (argv) => {
				const { commandImpl } = await import("./commands/command.js");
				await commandImpl(argv.arg);
			},
		)
		.demandCommand(1)
		.strict()
		.help()
		.parse();
}
```

## 外部コマンド実行

Bun.spawn を使用:

```typescript
const process = Bun.spawn(cmdArray, {
	stdin: stdinData ? new TextEncoder().encode(stdinData) : undefined,
	stdout: "pipe",
	stderr: "pipe",
});

const stdout = await new Response(process.stdout).text();
const stderr = await new Response(process.stderr).text();
const exitCode = await process.exited;
```

## Git ワークフロー

- コミット前に `bun run lint` と `bun run typecheck` を実行
- テストが通ることを確認: `bun test`