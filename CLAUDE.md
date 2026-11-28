# AIcourse 開発ルール

## プロジェクト構成
- 現行アプリ: `index.html` / `script.js` / `style.css`(localStorage に保存)
- バックエンド: `backend/`(Spring Boot、Java 25、Gradle)。REST API と画面連携は未実装
- DB: `docker-compose.yml`(PostgreSQL 16)、`db/schema.sql`(手動で実行)
- 起動と確認の手順は `README.md` を参照

## 作業の進め方
1. 対応する Issue を確認する。なければ Issue の案を提示し、承認を得て作成する。
2. 実装前に計画(目的、変更するファイル、テスト方法、更新する設計書)を提示し、承認を得る。
3. 最新の main から作業ブランチを作る。
4. 実装し、テストと設計書の更新を行う。
5. 変更内容とテスト結果を報告する。

- ユーザーは初心者である。操作の目的を説明し、一括で進めず、一つずつ確認しながら進める。
- 計画と違う変更が必要になった場合は、作業を止めて相談する。

## 承認が必要な操作
次の操作は、毎回ユーザーの明示的な承認を得てから行う。過去の承認は引き継がない。
- コミット、push、マージ
- Issue と Pull Request の作成・クローズ
- ブランチの削除、履歴の書き換え(rebase、reset --hard、amend)
- GitHub の設定変更
- データが消える操作(`docker compose down -v`、テーブルの削除など)

## 禁止事項
- main への直接実装、直接コミット、直接 push
- force push(`--force`、`--force-with-lease`)
- ブランチ保護の解除や回避
- パスワード、トークン、`.env` などの秘密情報のコミット(このリポジトリは Public)

## ブランチ
- 形式: `<種類>/#<Issue番号>-<短い英語の説明>`(例: `fix/#6-overdue-highlight`)
- 半角の `#` を必ず含める。コマンドではブランチ名を引用符で囲む。
- 種類: `feature`(機能追加・仕様変更)、`fix`(不具合修正)、`docs`(文書のみ)、
  `chore`(設定・依存関係・開発ルール)、`refactor`(動きを変えない整理)
- 原則として 1 Issue = 1 ブランチ = 1 Pull Request

## Issue / コミット / Pull Request
- 小さな修正でも、作業開始前に Issue を作成する。
- Issue には目的、作業内容、完了条件を書く(`.github/ISSUE_TEMPLATE/task.md` の形式)。
- Issue と Pull Request の本文は日本語。
- コミットメッセージは日本語で、変更内容が簡潔に伝わるように記載する。
- Pull Request のタイトルは、英語の動詞始まりとする。
- PR 本文は `.github/pull_request_template.md` の形式にし、`Closes #番号` を書く
  (一部だけ対応する場合は `Refs #番号`)。
- マージ方式は Squash and merge。他者のレビュー承認は必須としないが、マージ前に差分を確認する。
- Squash and merge のコミットメッセージも、日本語に書き換える。
- マージ後は main を最新にする。

## テスト
| 変更対象 | 確認方法 |
|---|---|
| 現行アプリ | `FUNCTIONAL_REQUIREMENTS.md` の関連する完了条件と No.15(エラーが出ない)をブラウザで確認 |
| `backend/` | `docker compose up -d --wait` の後、`backend` で `.\gradlew.bat test`(`cards` テーブルが必要) |
| `db/`、`docker-compose.yml` | 既存データを消さない方法で確認し、`backend` のテストも実行 |
| 文書・設定のみ | リンク、記載と実際の一致、差分を確認 |

実行していない確認は「未実施」と理由を報告する。テストが失敗した状態でマージしない。

## 設計書との整合性
| 変更内容 | 更新する文書 |
|---|---|
| 機能の動き、完了条件 | `FUNCTIONAL_REQUIREMENTS.md` |
| 画面 | `SCREEN_DESIGN.md` |
| データ構造、テーブル | `DATABASE_DESIGN.md`、`db/schema.sql` |
| 技術、バージョン、構成 | `TECH_STACK.md` |
| 範囲、非機能要件、制約 | `REQUIREMENTS.md` |
| 手順、現在の状況 | `README.md` |

- 設計書の更新は、実装と同じ Pull Request に含める。
- 実装と設計書の食い違いを見つけたら、勝手に直さず、どちらが正しいか確認する。
- REST API は、実装前に API 設計書を作成する。
