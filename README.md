# AIcourse
AIcourse projects
Git merge practice
GitHub CLI pull request practice

## ドキュメント

- [REQUIREMENTS.md](./REQUIREMENTS.md) — 要件定義書(プロジェクト概要・非機能要件・制約事項・将来拡張候補)
- [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) — 機能要件・受け入れ基準・ユースケース
- [SCREEN_DESIGN.md](./SCREEN_DESIGN.md) — 画面設計
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) — データ保存方式(localStorage)・データ構造、PostgreSQL のテーブル設計(現行アプリとは未連携)
- [TECH_STACK.md](./TECH_STACK.md) — 使用技術とその役割
- [db/schema.sql](./db/schema.sql) — PostgreSQL の `cards` テーブルを作成する SQL(手動で実行する)

## 開発の運用ルール

開発は「Issue → ブランチ → Pull Request → `main` へマージ」の順に進める。`main` への直接の変更は行わない。

- [CLAUDE.md](./CLAUDE.md) — ブランチ・Issue・コミット・テストなどの開発ルール
- [Issue テンプレート](./.github/ISSUE_TEMPLATE/task.md) — Issue を作成するときの形式
- [Pull Request テンプレート](./.github/pull_request_template.md) — Pull Request を作成するときの形式

## 現在の状況(2026-11-24 の動作確認終了時点)

- 画面(`index.html`)は、引き続き **localStorage** にデータを保存する。PostgreSQL は使っていない。
- PostgreSQL の `cards` テーブルは作成済みで、Spring Boot から参照できることを確認した。データは0件(この時点の状態。今後の操作で変わる)。
- **REST API は未実装。フロントエンドとバックエンドの連携も未実装。**

## バックエンド(PostgreSQL + Spring Boot)の開発手順

前提: Docker Desktop が起動していること。

```powershell
docker compose up -d --wait   # PostgreSQL 16 を起動(healthy まで待つ)
cd backend
.\gradlew.bat test            # DB 接続テスト(DatabaseConnectionTest)を含む。cards テーブルへのアクセス確認も含む
.\gradlew.bat bootRun         # 起動(http://localhost:8080/actuator/health)
```

- **DB を先に起動すること。** `DatabaseConnectionTest` は実際に PostgreSQL へ接続するため、DB が停止中だと失敗する。`cards` テーブルへのアクセス確認(`canAccessCardsTable`)は、テーブルを作成してからでないと失敗する。
- **通常の停止は `docker compose stop`。** コンテナもデータも残る。
- コンテナ削除: `docker compose down`(データは残る)。
- **危険: `docker compose down -v` はボリュームごと削除するため、`cards` テーブルを含むすべてのデータが消える。通常は使わないこと。** 実行した場合は、下の手順でテーブルを作り直す必要がある。
- 接続確認: `docker compose exec db psql -U kanban -d kanban -c "select version();"`
- **ホスト側ポートの変更**(5432 が使用中の場合など): 環境変数 `DB_PORT` を設定する。docker compose と Spring Boot の両方が同じ変数を読むため、同じシェルで実行する。
  ```powershell
  $env:DB_PORT=5433
  docker compose up -d --wait
  cd backend; .\gradlew.bat test
  ```
- 接続情報の既定値は `kanban`(DB 名・ユーザー・パスワード)で、ローカル開発専用。`DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` で上書きできる(設定は `backend/src/main/resources/application.properties`)。

### cards テーブルの作成(手動・初回のみ)

`docker-compose.yml` のサービス名は `db`、データベース名とユーザー名は `kanban` である。リポジトリのルートで、PowerShell から実行する(Windows PowerShell 5.1 で確認した)。

```powershell
# 日本語のコメントが文字化けしないよう、UTF-8 で読み込み・送信する
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Get-Content db\schema.sql -Encoding UTF8 | docker compose exec -T db psql -U kanban -d kanban -v ON_ERROR_STOP=1 --single-transaction
```

- PowerShell は `<` によるファイルの入力リダイレクトが使えないため、`Get-Content` から渡す。`-T` は、パイプで入力するときに必要な指定である。
- `ON_ERROR_STOP=1` と `--single-transaction` により、エラーが出たら途中で止まり、作成処理は取り消される。
- **既に `cards` テーブルがある状態で実行すると、エラーになる**(上書きはしない)。作成済みの場合は実行しない。
- 確認: `docker compose exec db psql -U kanban -d kanban -c "\d cards"`(7つのカラム、制約、インデックスが表示される)。件数の確認は `-c "SELECT COUNT(*) FROM cards;"`。
