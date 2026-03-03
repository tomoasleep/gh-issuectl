# gh-issuectl

GitHub CLI 拡張機能。Issue / Pull Request の本文（description）にある「指定した見出しセクション」だけを差し替えます。

PR テンプレの `## Summary` や `## Checklist` など、毎回同じセクションを更新したいときに使えます。

## できること

- 見出し（例: `## Summary`）配下の内容を、指定したテキストに置き換える
- 対象番号に Issue / PR どちらも指定できる（番号から自動判定）
- 番号を省略した場合、現在のブランチに紐づく PR を自動検出して更新する
- 置き換える内容を `--content` または stdin から渡せる

## 前提 / 注意

- `gh` が利用でき、認証済みであること（例: `gh auth login`）
- 指定した見出しは「すでに本文内に存在する」必要があります
  - 見出しが無い場合はエラーになります（新規作成はしません）
- 本文が空（description が未設定）の Issue / PR は更新できません

## インストール

```bash
gh ext install tomoasleep/gh-issuectl
```

## 使い方

```bash
gh issuectl patch [number] --section "Section heading" [--content "New content"]
```

- `number`: Issue / PR 番号（省略時は現在ブランチの PR を検出）
- `--section`, `-s`: 差し替え対象の見出しタイトル（完全一致）
- `--content`, `-c`: 新しい内容（省略時は stdin から読み込み）

## 例

### 番号を指定して更新（引数で内容を渡す）

```bash
gh issuectl patch 123 -s "Summary" -c "This PR updates ..."
```

### stdin から内容を渡して更新

```bash
cat ./summary.md | gh issuectl patch 123 -s "Summary"
```

### PR 番号を省略（現在ブランチの PR を自動検出）

```bash
gh issuectl patch -s "Summary" -c "Updated summary"
```

## 差し替えルール（見出しの扱い）

- 対象にできる見出しは `##` 以上です（`##`, `###`, ...）
- `--section` は見出し行のタイトル部分に「完全一致」したものを対象にします
- 差し替え範囲は、対象見出しの直後から「次の同階層以上の見出し」の直前までです
  - 例: `## Summary` を更新する場合、途中の `### Details` は同一セクション内として扱われます

## トラブルシュート

- `No pull request found for current branch`
  - 現在のブランチに紐づく PR が無い状態です。番号を指定して実行してください。
- `Section "..." not found`
  - 本文に指定した見出しが存在しません。見出しタイトルが一致しているか確認してください。

## 開発

```bash
bun run build
bun run typecheck
bun run lint
bun test
```